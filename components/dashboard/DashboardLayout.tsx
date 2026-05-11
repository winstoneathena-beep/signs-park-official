"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Files, ShieldCheck, Library, Plus, LogOut } from "lucide-react";
import { useSession, signOut } from "@/lib/orders";
import { roleAbbrev } from "@/lib/user-display";
import { RoleSwitcher } from "./RoleSwitcher";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["requester", "approver"] as const },
  { href: "/dashboard/orders", label: "Orders", icon: Files, roles: ["requester", "approver"] as const },
  { href: "/dashboard/queue", label: "Approval queue", icon: ShieldCheck, roles: ["approver"] as const },
  { href: "/templates", label: "Sign library", icon: Library, roles: ["requester", "approver"] as const },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const onSignOut = () => {
    signOut();
    router.replace("/welcome");
  };

  return (
    <div className="mx-auto max-w-7xl px-5 md:px-8 pt-24 pb-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-parkwell-blue">
            {session.role === "approver" ? "Approver dashboard" : "Requester dashboard"}
          </div>
          <h1 className="mt-1.5 text-3xl md:text-4xl font-bold tracking-tight">
            Welcome back, {session.name.split(" ")[0]}{" "}
            <span className="text-muted-foreground font-medium text-2xl md:text-3xl">
              ({roleAbbrev(session.role)})
            </span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Signed in as <span className="font-semibold">{session.name}</span>{" "}
            · {session.email}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RoleSwitcher />
          <Link
            href="/create"
            className="inline-flex h-10 items-center justify-center rounded-full bg-parkwell-blue px-5 text-sm font-semibold text-white hover:bg-parkwell-blue/90 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" /> New sign
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="h-4 w-4 mr-1.5" /> Switch role
          </button>
        </div>
      </div>

      <nav className="flex flex-wrap gap-1 border-b border-border mb-8">
        {NAV.filter((n) =>
          (n.roles as readonly string[]).includes(session.role),
        ).map((n) => {
          const active =
            pathname === n.href ||
            (n.href !== "/dashboard" && pathname.startsWith(n.href));
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                active
                  ? "border-parkwell-blue text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
