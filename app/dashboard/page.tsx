"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Files, Clock, CheckCircle2, Truck, ArrowRight } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { OrderDetailDialog } from "@/components/dashboard/OrderDetailDialog";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { TEMPLATES_BY_ID } from "@/lib/sign-templates";
import { useOrders, type Order, type OrderStatus } from "@/lib/orders";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const orders = useOrders();
  const [selected, setSelected] = useState<Order | null>(null);

  const counts = useMemo(() => {
    const c = { all: 0, pending: 0, approved: 0, ordered: 0 } as Record<string, number>;
    for (const o of orders) {
      c.all += 1;
      if (o.status === "pending") c.pending += 1;
      if (o.status === "approved") c.approved += 1;
      if (o.status === "ordered") c.ordered += 1;
    }
    return c;
  }, [orders]);

  const recent = orders.slice(0, 6);

  return (
    <DashboardLayout>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-12">
        <StatTile
          icon={Files}
          label="Total orders"
          value={counts.all}
          href="/dashboard/orders"
          tone="blue"
        />
        <StatTile
          icon={Clock}
          label="Pending review"
          value={counts.pending}
          href="/dashboard/orders?status=pending"
          tone="yellow"
        />
        <StatTile
          icon={CheckCircle2}
          label="Approved"
          value={counts.approved}
          href="/dashboard/orders?status=approved"
          tone="green"
        />
        <StatTile
          icon={Truck}
          label="Ordered"
          value={counts.ordered}
          href="/dashboard/orders?status=ordered"
          tone="ink"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Recent orders</h2>
            <Link
              href="/dashboard/orders"
              className="text-sm font-semibold text-parkwell-blue hover:underline inline-flex items-center gap-1"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {recent.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => setSelected(o)}
                  className="w-full px-6 py-4 hover:bg-muted/40 transition-colors text-left flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold truncate">
                      {o.id}
                      <span className="text-muted-foreground font-normal">
                        · {TEMPLATES_BY_ID[o.templateId]?.name ?? o.templateId}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground truncate">
                      {o.location} · {o.createdBy.name} · qty {o.specs.quantity}
                    </div>
                  </div>
                  <StatusBadge status={o.status} />
                </button>
              </li>
            ))}
            {recent.length === 0 && (
              <li className="px-6 py-12 text-center text-sm text-muted-foreground">
                No orders yet — start with{" "}
                <Link href="/create" className="text-parkwell-blue font-semibold hover:underline">
                  creating a sign
                </Link>
                .
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold">By status</h2>
          <div className="mt-4 space-y-3">
            {(["pending", "approved", "ordered"] as OrderStatus[]).map((s) => {
              const n = orders.filter((o) => o.status === s).length;
              const pct = orders.length ? Math.round((n / orders.length) * 100) : 0;
              return (
                <div key={s}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <StatusBadge status={s} />
                    <span className="font-semibold">{n}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        s === "pending"
                          ? "bg-parkwell-yellow"
                          : s === "approved"
                            ? "bg-parkwell-green"
                            : "bg-parkwell-blue",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <OrderDetailDialog
        order={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
      />
    </DashboardLayout>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  href,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  href: string;
  tone: "blue" | "yellow" | "green" | "ink";
}) {
  const ring = {
    blue: "bg-parkwell-blue/10 text-parkwell-blue",
    yellow: "bg-parkwell-yellow/15 text-parkwell-yellow",
    green: "bg-parkwell-green/10 text-parkwell-green",
    ink: "bg-ink/10 dark:bg-white/10 text-ink dark:text-white",
  }[tone];
  return (
    <Link
      href={href}
      className="rounded-2xl border border-border bg-card p-5 hover:border-parkwell-blue/40 hover:shadow-sm transition-all flex items-start gap-4"
    >
      <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", ring)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
          {label}
        </div>
        <div className="mt-1 text-2xl font-bold leading-none">{value}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
