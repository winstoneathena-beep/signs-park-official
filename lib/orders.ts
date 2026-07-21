"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { FieldValues } from "@/components/sign/SignPreview";
import { isApprover } from "./approvers";
import { useAuth, supabaseSignOut, getAuthUserId } from "./auth";
import { migrateLegacyOrders } from "./migrate-legacy";
import { supabase } from "./supabase";

export type OrderStatus =
  "draft" | "pending" | "approved" | "ordered" | "rejected";

export type Order = {
  id: string;
  templateId: string;
  status: OrderStatus;
  /** Editable field values. */
  values: FieldValues;
  /** Vendor specs */
  specs: {
    widthIn: number;
    heightIn: number;
    quantity: number;
    material: string;
    notes?: string;
  };
  /** Location label (free-form) for filter/search. Required at order time. */
  location: string;
  /** Site number — required at order time for expense coding / billing. */
  siteNumber: string;
  /** Manager who created the order. */
  createdBy: { name: string; email: string; role: Role };
  createdAt: number;
  updatedAt: number;
  /** Approver decision metadata. */
  approval?: {
    decidedBy: string;
    decidedAt: number;
    notes?: string;
    revisionRequested?: boolean;
  };
};

export type Role = "requester" | "approver";

/** Device-local UI preference only — identity comes from Supabase Auth. */
const ROLE_KEY = "parkwell.role.v1";

type Session = {
  name: string;
  email: string;
  role: Role;
};

const DEFAULT_SESSION: Session = {
  name: "",
  email: "",
  role: "requester",
};

/* ---------------------------------- Orders store ---------------------------------- */

/**
 * Orders live in `public.sign_orders` on the shared Parkwell Supabase
 * instance — RLS-enforced, so a Requester's submission actually reaches
 * Approvers on other machines (the old localStorage store was
 * per-browser fiction). This module keeps a client cache with the same
 * useSyncExternalStore contract the UI already speaks: mutations update
 * the cache optimistically, persist via PostgREST, then reconcile from
 * the server (which also reverts anything RLS refused).
 */

type SignOrderRow = {
  id: string;
  template_id: string;
  status: OrderStatus;
  field_values: FieldValues;
  specs: Order["specs"];
  location: string;
  site_number: string;
  created_by: string;
  created_by_name: string;
  created_by_email: string;
  created_by_role: string;
  approval: Order["approval"] | null;
  created_at: string;
  updated_at: string;
};

function fromRow(row: SignOrderRow): Order {
  return {
    id: row.id,
    templateId: row.template_id,
    status: row.status,
    values: row.field_values ?? {},
    specs: row.specs,
    location: row.location,
    siteNumber: row.site_number,
    createdBy: {
      name: row.created_by_name,
      email: row.created_by_email,
      role: row.created_by_role === "approver" ? "approver" : "requester",
    },
    createdAt: Date.parse(row.created_at),
    updatedAt: Date.parse(row.updated_at),
    approval: row.approval ?? undefined,
  };
}

/** Columns both INSERT and UPDATE may write (never created_by/created_at). */
function writeCols(order: Order) {
  return {
    template_id: order.templateId,
    status: order.status,
    field_values: order.values,
    specs: order.specs,
    location: order.location,
    site_number: order.siteNumber,
    approval: order.approval ?? null,
  };
}

const EMPTY_ORDERS: Order[] = [];
let orders: Order[] = EMPTY_ORDERS;
let loadPending = false;
let watchersInstalled = false;

function emitOrders() {
  window.dispatchEvent(new Event("parkwell:orders"));
}

async function loadOrders() {
  if (loadPending || typeof window === "undefined") return;
  loadPending = true;
  // One-time per browser: push any pre-Supabase localStorage orders into the
  // shared table before the first read, so they appear in this very load.
  const uid = getAuthUserId();
  if (uid) await migrateLegacyOrders(uid);
  const { data, error } = await supabase
    .from("sign_orders")
    .select("*")
    .order("created_at", { ascending: false });
  loadPending = false;
  if (error) {
    console.error("[signs] loading orders failed:", error.message);
    return;
  }
  orders = (data as SignOrderRow[]).map(fromRow);
  emitOrders();
}

/**
 * The shared approval queue has no realtime channel (yet) — the cache
 * refreshes on sign-in/out, tab focus, and after every mutation. Good
 * enough for a queue worked a few times a day.
 */
function ensureOrdersWatchers() {
  if (watchersInstalled || typeof window === "undefined") return;
  watchersInstalled = true;
  window.addEventListener("parkwell:auth", () => void loadOrders());
  window.addEventListener("focus", () => void loadOrders());
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) void loadOrders();
  });
}

export function useOrders(): Order[] {
  const subscribe = useCallback((cb: () => void) => {
    ensureOrdersWatchers();
    if (orders === EMPTY_ORDERS) void loadOrders();
    window.addEventListener("parkwell:orders", cb);
    return () => window.removeEventListener("parkwell:orders", cb);
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => orders,
    () => EMPTY_ORDERS,
  );
}

async function persistOrder(order: Order, exists: boolean) {
  let errorMessage: string | null = null;
  if (exists) {
    const { error } = await supabase
      .from("sign_orders")
      .update(writeCols(order))
      .eq("id", order.id);
    errorMessage = error?.message ?? null;
  } else {
    const uid = getAuthUserId();
    if (!uid) {
      errorMessage = "not signed in";
    } else {
      const { error } = await supabase.from("sign_orders").insert({
        ...writeCols(order),
        id: order.id,
        created_by: uid,
        created_by_name: order.createdBy.name,
        created_by_email: order.createdBy.email,
        created_by_role: order.createdBy.role,
      });
      errorMessage = error?.message ?? null;
    }
  }
  if (errorMessage) {
    console.error(`[signs] saving ${order.id} failed:`, errorMessage);
  }
  // Reconcile: server timestamps/status win, and optimistic writes that
  // RLS refused get rolled back in the same pass.
  await loadOrders();
}

export function saveOrder(order: Order) {
  const exists = orders.some((o) => o.id === order.id);
  // Must produce a NEW array reference. useSyncExternalStore compares
  // snapshots by Object.is — mutating in place would skip re-renders.
  orders = exists
    ? orders.map((o) => (o.id === order.id ? order : o))
    : [order, ...orders];
  emitOrders();
  void persistOrder(order, exists);
}

export function deleteOrder(id: string) {
  orders = orders.filter((o) => o.id !== id);
  emitOrders();
  void (async () => {
    const { error } = await supabase.from("sign_orders").delete().eq("id", id);
    if (error) console.error(`[signs] deleting ${id} failed:`, error.message);
    await loadOrders();
  })();
}

export function nextOrderId(): string {
  const year = new Date().getFullYear();
  let max = 0;
  for (const o of orders) {
    const m = /ORD-(\d{4})-(\d{4})/.exec(o.id);
    if (m && Number(m[1]) === year) max = Math.max(max, Number(m[2]));
  }
  return `ORD-${year}-${String(max + 1).padStart(4, "0")}`;
}

/** Synchronous order lookup from the cache — safe in useState initializers,
 *  but the cache loads async: deep-link consumers must also watch
 *  useOrders() and adopt the order when it arrives (see SignEditor). */
export function getOrderById(id: string): Order | null {
  return orders.find((o) => o.id === id) ?? null;
}

export function statusLabel(s: OrderStatus): string {
  return {
    draft: "Draft",
    pending: "Pending Approval",
    approved: "Approved",
    ordered: "Ordered",
    rejected: "Rejected",
  }[s];
}

/* ---------------------------------- Session ---------------------------------- */

function readRolePref(): Role {
  if (typeof window === "undefined") return "requester";
  return window.localStorage.getItem(ROLE_KEY) === "approver"
    ? "approver"
    : "requester";
}

export function setRolePref(role: Role) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROLE_KEY, role);
  window.dispatchEvent(new Event("parkwell:role"));
}

function useRolePref(): Role {
  const subscribe = useCallback((cb: () => void) => {
    window.addEventListener("parkwell:role", cb);
    window.addEventListener("storage", cb);
    return () => {
      window.removeEventListener("parkwell:role", cb);
      window.removeEventListener("storage", cb);
    };
  }, []);
  return useSyncExternalStore(subscribe, readRolePref, () => "requester");
}

/**
 * Session = verified Supabase Auth identity + a device-local role
 * preference. The effective role is re-derived on every render:
 * `approver` only when the preference says so AND the verified email is
 * on the allowlist — so a hand-edited localStorage role pref still
 * renders as requester. `setRole` stores the raw preference; the
 * derivation is the guard.
 */
export function useSession(): {
  session: Session;
  setRole: (role: Role) => void;
} {
  const auth = useAuth();
  const rolePref = useRolePref();
  const session: Session =
    auth.status === "signed-in"
      ? {
          name: auth.user.name,
          email: auth.user.email,
          role:
            rolePref === "approver" && isApprover(auth.user.email)
              ? "approver"
              : "requester",
        }
      : DEFAULT_SESSION;
  return { session, setRole: setRolePref };
}

/* ---------------------------------- Sign-out ---------------------------------- */

/**
 * Real sign-out: ends the Supabase session (shared across Parkwell
 * internal tools) and clears the device role preference. The auth store
 * broadcasts the state change, so gates and headers react on their own.
 */
export function signOut() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ROLE_KEY);
  window.dispatchEvent(new Event("parkwell:role"));
  void supabaseSignOut();
}
