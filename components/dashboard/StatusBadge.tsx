import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/orders";

const STYLES: Record<OrderStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-parkwell-yellow/15 text-parkwell-yellow border-parkwell-yellow/40",
  approved: "bg-parkwell-green/15 text-parkwell-green border-parkwell-green/40",
  ordered: "bg-parkwell-blue/15 text-parkwell-blue border-parkwell-blue/40",
  rejected: "bg-parkwell-red/15 text-parkwell-red border-parkwell-red/40",
};

const LABELS: Record<OrderStatus, string> = {
  draft: "Draft",
  pending: "Pending Approval",
  approved: "Approved",
  ordered: "Ordered",
  rejected: "Rejected",
};

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        STYLES[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[status]}
    </span>
  );
}
