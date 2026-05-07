"use client";

import { useState } from "react";
import Image from "next/image";
import { Inbox, ArrowRight } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { OrderDetailDialog } from "@/components/dashboard/OrderDetailDialog";
import { TEMPLATES_BY_ID } from "@/lib/sign-templates";
import { useOrders, type Order } from "@/lib/orders";

export default function QueuePage() {
  const orders = useOrders();
  const [selected, setSelected] = useState<Order | null>(null);
  const pending = orders.filter((o) => o.status === "pending");

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-parkwell-blue">
          Approval queue
        </div>
        <h2 className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight">
          {pending.length} {pending.length === 1 ? "sign" : "signs"} awaiting your review
        </h2>
        <p className="mt-2 text-muted-foreground">
          Click any item to preview the sign, review specs, and decide.
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center">
          <Inbox className="h-10 w-10 mx-auto text-muted-foreground/50" />
          <h3 className="mt-4 font-semibold">Queue is clear.</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            New submissions will appear here for your review.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {pending.map((o) => {
            const tpl = TEMPLATES_BY_ID[o.templateId];
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => setSelected(o)}
                  className="w-full text-left rounded-2xl border border-border bg-card overflow-hidden hover:border-parkwell-yellow/60 hover:shadow-md transition-all flex"
                >
                  <div className="relative w-32 shrink-0 bg-muted/40 border-r border-border">
                    {tpl && (
                      <Image
                        src={tpl.sourceImage}
                        alt={tpl.name}
                        fill
                        sizes="128px"
                        className="object-contain p-3"
                      />
                    )}
                  </div>
                  <div className="flex-1 p-5 min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wider text-parkwell-yellow">
                      Pending review
                    </div>
                    <h3 className="mt-1.5 font-semibold truncate">
                      {tpl ? `${tpl.number} — ${tpl.name}` : o.templateId}
                    </h3>
                    <div className="mt-1 text-sm text-muted-foreground truncate">
                      {o.location}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {o.createdBy.name} · qty {o.specs.quantity}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-parkwell-blue">
                        Review <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <OrderDetailDialog
        order={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
      />
    </DashboardLayout>
  );
}
