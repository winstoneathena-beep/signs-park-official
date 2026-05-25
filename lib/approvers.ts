/**
 * Approver allowlist — the single source of truth for who can act as an
 * Approver on this site.
 *
 * Until TeamHub stands up real auth, "auth" here is just typing the right
 * email into the welcome page. This file gates THREE UI surfaces:
 *
 *   1. /welcome           — only show the Approver role chip if the typed
 *                            email is on the list.
 *   2. Dashboard chrome   — hide the role switcher + "Switch role" button
 *                            for non-listed users.
 *   3. Order actions      — Approve / Reject / Mark-as-ordered buttons only
 *                            render for listed users (and never on the
 *                            user's own orders — self-approval is blocked).
 *
 * Defense in depth: an attacker who hand-edits localStorage to set
 * `role: "approver"` still won't see the approval buttons because each
 * surface re-checks `isApprover(email)` on render, not just `role`.
 *
 * Every Parkwell user (Approver or Requester) must be on the
 * `@goparkwell.com` domain. See `isParkwellDomain()`.
 *
 * Adding / removing an approver = edit this list + push. When TeamHub
 * lands and we move to Clerk + Neon, this array becomes a DB table with
 * the same shape — no logic changes downstream.
 */

export type ApproverRecord = {
  email: string;
  /**
   * True for the platform admin — currently only winstone. Reserved for
   * future admin UI (managing approvers, viewing global audit log, etc).
   * No admin-specific features exist yet, so today this flag is metadata
   * only.
   */
  isAdmin?: boolean;
};

export const APPROVERS: ApproverRecord[] = [
  { email: "ocastillo@goparkwell.com" },
  { email: "abritton@goparkwell.com" },
  { email: "joel@goparkwell.com" },
  { email: "ryan@goparkwell.com" },
  { email: "andre@goparkwell.com" },
  { email: "adibenedetto@goparkwell.com" },
  { email: "ryanross@goparkwell.com" },
  { email: "roman@goparkwell.com" },
  { email: "dillon.fuller@goparkwell.com" },
  { email: "ty@goparkwell.com" },
  { email: "travis@goparkwell.com" },
  { email: "winstone@goparkwell.com", isAdmin: true },
  { email: "asearl@goparkwell.com" },
  { email: "michael@goparkwell.com" },
  { email: "jon@goparkwell.com" },
];

const APPROVER_EMAIL_SET = new Set(
  APPROVERS.map((a) => a.email.toLowerCase()),
);

const ADMIN_EMAIL_SET = new Set(
  APPROVERS.filter((a) => a.isAdmin).map((a) => a.email.toLowerCase()),
);

/** Lowercase + trim — every comparison goes through this. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** True when the email is on the approver allowlist. */
export function isApprover(email: string | undefined | null): boolean {
  if (!email) return false;
  return APPROVER_EMAIL_SET.has(normalizeEmail(email));
}

/** True for the platform admin (currently winstone only). */
export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAIL_SET.has(normalizeEmail(email));
}

/**
 * Every user on the platform must be `@goparkwell.com`. Non-Parkwell
 * emails are rejected at the /welcome screen — they can't be Requesters
 * OR Approvers.
 */
export function isParkwellDomain(email: string | undefined | null): boolean {
  if (!email) return false;
  return normalizeEmail(email).endsWith("@goparkwell.com");
}
