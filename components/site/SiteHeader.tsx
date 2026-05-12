"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Pencil, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { useSession } from "@/lib/orders";
import { userTag } from "@/lib/user-display";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Sign Library", href: "/templates" },
  { label: "Create a Sign", href: "/create" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "FAQ", href: "/#faq" },
];

function useScrolled() {
  const subscribe = useCallback((cb: () => void) => {
    window.addEventListener("scroll", cb, { passive: true });
    return () => window.removeEventListener("scroll", cb);
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => window.scrollY > 8,
    () => false,
  );
}

export function SiteHeader() {
  const scrolled = useScrolled();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session } = useSession();
  const pathname = usePathname();
  const onDashboard = pathname?.startsWith("/dashboard") ?? false;
  const RoleIcon = session.role === "approver" ? ShieldCheck : Pencil;
  const roleAccent =
    session.role === "approver" ? "text-parkwell-green" : "text-parkwell-blue";
  const identity = userTag(session.name, session.role);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled || mobileOpen
          ? "bg-background/85 backdrop-blur-lg border-b border-border"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8 h-16 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Logo tone="ink" className="w-28 dark:hidden" />
          <Logo tone="white" className="w-28 hidden dark:inline-block" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground rounded-full hover:bg-muted transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Open dashboard"
          >
            <RoleIcon className={cn("h-3.5 w-3.5", roleAccent)} />
            {identity}
          </Link>
          <ThemeToggle />
          {!onDashboard && (
            <Button
              asChild
              className="hidden md:inline-flex h-10 rounded-full bg-parkwell-blue text-white hover:bg-parkwell-blue/90 shadow-lg shadow-parkwell-blue/30"
            >
              <Link href="/dashboard">Open Dashboard</Link>
            </Button>
          )}
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-border"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="mx-auto max-w-7xl px-5 py-4 flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-3 text-base font-medium text-foreground/80 hover:text-foreground rounded-lg hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            {!onDashboard && (
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="mt-2 px-4 py-3 text-center text-base font-semibold text-white bg-parkwell-blue rounded-full"
              >
                Open Dashboard
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
