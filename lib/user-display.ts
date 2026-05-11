import type { Role } from "@/lib/orders";

/** "Apr" for approver, "Rqs" for requester. */
export function roleAbbrev(role: Role): "Apr" | "Rqs" {
  return role === "approver" ? "Apr" : "Rqs";
}

/** First word of a person's name — used as their compact username. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

/** "Andre (Rqs)" — the human + role tag we use everywhere for accountability. */
export function userTag(name: string, role: Role): string {
  return `${firstName(name)} (${roleAbbrev(role)})`;
}
