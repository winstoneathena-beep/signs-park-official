import type { Role } from "@/lib/orders";

/** Full role label — used in user-facing pills and tags. */
export function roleLabel(role: Role): "Approver" | "Requester" {
  return role === "approver" ? "Approver" : "Requester";
}

/** Kept for backwards compatibility; same return as roleLabel now. */
export const roleAbbrev = roleLabel;

/** First word of a person's name — used as their compact username. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

/** "Andre · Requester" — the human + role tag we use everywhere for accountability. */
export function userTag(name: string, role: Role): string {
  return `${firstName(name)} · ${roleLabel(role)}`;
}
