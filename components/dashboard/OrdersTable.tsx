"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrders, type Order, type OrderStatus } from "@/lib/orders";
import { userTag } from "@/lib/user-display";
import { TEMPLATES_BY_ID, SIGN_TEMPLATES } from "@/lib/sign-templates";
import { StatusBadge } from "./StatusBadge";
import { OrderDetailDialog } from "./OrderDetailDialog";

type Status = OrderStatus | "all";

export function OrdersTable() {
  const orders = useOrders();
  const router = useRouter();
  const params = useSearchParams();

  const initialStatus = (params.get("status") as Status) || "all";
  const initialId = params.get("id");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>(initialStatus);
  const [template, setTemplate] = useState<string>("all");
  const [selected, setSelected] = useState<Order | null>(null);

  // Open dialog if ?id= present in URL
  useEffect(() => {
    if (!initialId) return;
    const handle = requestAnimationFrame(() => {
      const order = orders.find((o) => o.id === initialId);
      if (order) setSelected(order);
    });
    return () => cancelAnimationFrame(handle);
  }, [initialId, orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (template !== "all" && o.templateId !== template) return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          !o.id.toLowerCase().includes(q) &&
          !o.location.toLowerCase().includes(q) &&
          !o.createdBy.name.toLowerCase().includes(q) &&
          !(TEMPLATES_BY_ID[o.templateId]?.name ?? "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [orders, status, template, query]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order, location, manager…"
            className="h-11 pl-10 rounded-full"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
          <SelectTrigger className="h-11 rounded-full sm:w-48">
            <Filter className="h-4 w-4 mr-1.5 opacity-60" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="ordered">Ordered</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Select value={template} onValueChange={setTemplate}>
          <SelectTrigger className="h-11 rounded-full sm:w-56">
            <SelectValue placeholder="Template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All templates</SelectItem>
            {SIGN_TEMPLATES.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.number} — {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Desktop / tablet table */}
        <div className="hidden md:block">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs uppercase tracking-wider font-semibold text-muted-foreground border-b border-border bg-muted/40">
            <div className="col-span-1">Sign</div>
            <div className="col-span-2">Order ID</div>
            <div className="col-span-3">Template</div>
            <div className="col-span-3">Location</div>
            <div className="col-span-1">Qty</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
          <ul>
            {filtered.map((o) => {
              const tpl = TEMPLATES_BY_ID[o.templateId];
              return (
                <li key={o.id} className="border-b border-border last:border-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(o);
                      router.replace(`/dashboard/orders?id=${o.id}`);
                    }}
                    className="w-full grid grid-cols-12 gap-4 items-center px-5 py-3.5 text-left hover:bg-muted/40 transition-colors"
                  >
                    <div className="col-span-1">
                      {tpl && (
                        <div className="relative h-12 w-9 rounded bg-white border border-border overflow-hidden">
                          <Image
                            src={tpl.sourceImage}
                            alt={tpl.name}
                            fill
                            sizes="36px"
                            className="object-contain p-0.5"
                          />
                        </div>
                      )}
                    </div>
                    <div className="col-span-2 font-mono text-xs text-muted-foreground">
                      {o.id}
                    </div>
                    <div className="col-span-3 text-sm font-semibold truncate">
                      {tpl ? tpl.name : o.templateId}
                      <span className="ml-1 font-normal text-muted-foreground">
                        — {userTag(o.createdBy.name, o.createdBy.role)}
                      </span>
                    </div>
                    <div className="col-span-3 text-sm text-muted-foreground truncate">
                      {o.location}
                    </div>
                    <div className="col-span-1 text-sm font-semibold">{o.specs.quantity}</div>
                    <div className="col-span-2 flex justify-end">
                      <StatusBadge status={o.status} />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Mobile stacked cards */}
        <ul className="md:hidden divide-y divide-border">
          {filtered.map((o) => {
            const tpl = TEMPLATES_BY_ID[o.templateId];
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(o);
                    router.replace(`/dashboard/orders?id=${o.id}`);
                  }}
                  className="w-full px-4 py-4 flex gap-3.5 text-left hover:bg-muted/40 transition-colors"
                >
                  {tpl && (
                    <div className="relative h-16 w-12 shrink-0 rounded bg-white border border-border overflow-hidden">
                      <Image
                        src={tpl.sourceImage}
                        alt={tpl.name}
                        fill
                        sizes="48px"
                        className="object-contain p-0.5"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-muted-foreground">
                        {o.id}
                      </span>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="mt-1 text-sm font-semibold truncate">
                      {tpl ? tpl.name : o.templateId}
                      <span className="ml-1 font-normal text-muted-foreground">
                        — {userTag(o.createdBy.name, o.createdBy.role)}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground truncate">
                      {o.location}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>{o.createdBy.name}</span>
                      <span>·</span>
                      <span>qty {o.specs.quantity}</span>
                      <span>·</span>
                      <span>{o.specs.material}</span>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No orders match these filters.
          </div>
        )}
      </div>

      <OrderDetailDialog
        order={selected}
        open={!!selected}
        onOpenChange={(v) => {
          if (!v) {
            setSelected(null);
            router.replace("/dashboard/orders");
          }
        }}
      />
    </div>
  );
}
