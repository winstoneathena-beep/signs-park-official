"use client";

import { Pencil, ShieldCheck } from "lucide-react";
import { useSession, type Role } from "@/lib/orders";
import { cn } from "@/lib/utils";

const ROLES: { id: Role; label: string; icon: React.ElementType; activeColor: string }[] = [
  { id: "requester", label: "Requester", icon: Pencil, activeColor: "text-parkwell-blue" },
  { id: "approver", label: "Approver", icon: ShieldCheck, activeColor: "text-parkwell-green" },
];

export function RoleSwitcher() {
  const { session, setRole } = useSession();

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1">
      {ROLES.map((r) => {
        const Icon = r.icon;
        const active = session.role === r.id;
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => setRole(r.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", active && r.activeColor)} />
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
