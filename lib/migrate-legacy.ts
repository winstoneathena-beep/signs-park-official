"use client";

/**
 * One-time migration of the old localStorage order store into Supabase
 * (signs.sign_orders). The pre-Supabase site kept every order in
 * `parkwell.orders.v1` PER BROWSER — nothing ever left the machine — so each
 * user's browser is the only copy of their orders. This runs once per browser,
 * after sign-in, before the first server load, and pushes whatever it finds.
 *
 * Rules of the road:
 * - The demo seed orders the old site injected into empty stores are skipped
 *   (SEED_IDS) so visitors don't upload sample data.
 * - RLS only lets a creator INSERT rows with status draft/pending and no
 *   approval. Decided orders (approved/ordered/rejected) therefore migrate as
 *   `pending`, with the original outcome preserved under
 *   field_values.__legacy for an approver to re-decide in-app. Restoring the
 *   decision automatically is impossible anyway: approvers can't decide their
 *   OWN rows (self-approval block), and migrated rows belong to the migrating
 *   user.
 * - Order ids were minted client-side per browser, so two users can hold the
 *   same "ORD-2026-NNNN". On a primary-key conflict we check whether the
 *   existing row is this user's own earlier migration (skip) or someone
 *   else's number (retry once with a per-user suffix).
 * - The localStorage payload is left intact as a backup; only the
 *   MIGRATED_KEY marker stops re-runs, and it is only written when every
 *   order made it (partial failures retry on the next visit — per-order
 *   idempotency comes from the __migratedFrom stamp).
 */

import { supabase } from "./supabase";

const LEGACY_ORDERS_KEY = "parkwell.orders.v1";
const MIGRATED_KEY = "parkwell.orders.migrated.v1";

// Demo orders the old site seeded into every empty localStorage store.
const SEED_IDS = new Set([
  "ORD-2026-0173",
  "ORD-2026-0175",
  "ORD-2026-0179",
  "ORD-2026-0181",
  "ORD-2026-0184",
]);

type LegacyOrder = {
  id: string;
  templateId: string;
  status: string;
  values?: Record<string, unknown>;
  specs?: Record<string, unknown>;
  location?: string;
  siteNumber?: string;
  createdBy?: { name?: string; email?: string; role?: string };
  createdAt?: number;
  approval?: Record<string, unknown>;
};

function parseLegacyOrders(raw: string): LegacyOrder[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (o): o is LegacyOrder =>
        typeof o === "object" &&
        o !== null &&
        typeof (o as LegacyOrder).id === "string" &&
        typeof (o as LegacyOrder).templateId === "string",
    );
  } catch {
    return [];
  }
}

function toRow(o: LegacyOrder, uid: string) {
  const decided =
    (o.status !== "draft" && o.status !== "pending") || o.approval != null;
  const fieldValues: Record<string, unknown> = {
    ...(o.values ?? {}),
    // Per-order idempotency stamp — lets a re-run tell "my own earlier
    // migration" apart from "someone else's colliding order number".
    __migratedFrom: o.id,
    ...(decided
      ? { __legacy: { status: o.status, approval: o.approval ?? null } }
      : {}),
  };
  return {
    id: o.id,
    template_id: o.templateId,
    status: o.status === "draft" ? "draft" : "pending",
    field_values: fieldValues,
    specs: o.specs ?? {},
    location: o.location ?? "",
    site_number: o.siteNumber ?? "",
    created_by: uid,
    created_by_name: o.createdBy?.name ?? "",
    created_by_email: o.createdBy?.email ?? "",
    created_by_role:
      o.createdBy?.role === "approver" ? "approver" : "requester",
    approval: null,
    ...(Number.isFinite(o.createdAt)
      ? { created_at: new Date(o.createdAt as number).toISOString() }
      : {}),
  };
}

// True when the conflicting row is this user's own earlier migration of the
// same legacy order (safe to skip rather than re-insert under a new id).
async function alreadyMigrated(id: string, uid: string): Promise<boolean> {
  const { data } = await supabase
    .from("sign_orders")
    .select("created_by, field_values")
    .eq("id", id)
    .maybeSingle();
  if (!data) return false;
  const fv = (data.field_values ?? {}) as Record<string, unknown>;
  return data.created_by === uid && fv.__migratedFrom === id;
}

let inflight = false;

/**
 * Migrate this browser's legacy orders for the signed-in user. Returns the
 * number of orders inserted this run (0 when there was nothing to do).
 */
export async function migrateLegacyOrders(uid: string): Promise<number> {
  if (typeof window === "undefined" || inflight) return 0;
  if (window.localStorage.getItem(MIGRATED_KEY)) return 0;
  const raw = window.localStorage.getItem(LEGACY_ORDERS_KEY);
  const candidates = raw
    ? parseLegacyOrders(raw).filter((o) => !SEED_IDS.has(o.id))
    : [];
  if (candidates.length === 0) {
    window.localStorage.setItem(
      MIGRATED_KEY,
      JSON.stringify({ at: Date.now(), migrated: 0 }),
    );
    return 0;
  }

  inflight = true;
  let migrated = 0;
  let failed = 0;
  try {
    for (const order of candidates) {
      const row = toRow(order, uid);
      let { error } = await supabase.from("sign_orders").insert(row);
      if (error?.code === "23505") {
        if (await alreadyMigrated(order.id, uid)) continue;
        // Someone else's browser minted the same order number — keep both.
        const suffixed = `${order.id}-M${uid.slice(0, 4)}`;
        ({ error } = await supabase
          .from("sign_orders")
          .insert({ ...row, id: suffixed }));
        if (error?.code === "23505" && (await alreadyMigrated(suffixed, uid))) {
          continue;
        }
      }
      if (error) {
        failed++;
        console.error(`[signs] migrating ${order.id} failed:`, error.message);
      } else {
        migrated++;
      }
    }
  } finally {
    inflight = false;
  }

  if (failed === 0) {
    // Legacy payload stays behind as a backup; only the marker is written.
    window.localStorage.setItem(
      MIGRATED_KEY,
      JSON.stringify({ at: Date.now(), migrated }),
    );
  }
  if (migrated > 0) {
    console.info(
      `[signs] migrated ${migrated} legacy order(s) to the shared database`,
    );
  }
  return migrated;
}
