"use client";

import { useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  Pencil,
  Send,
  CheckCircle2,
  Truck,
  FileText,
  Loader2,
} from "lucide-react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { useRouter } from "next/navigation";
import { TEMPLATES_BY_ID } from "@/lib/sign-templates";
import { saveOrder, useOrders, useSession, type Order } from "@/lib/orders";
import { SignPreview } from "@/components/sign/SignPreview";
import { userTag } from "@/lib/user-display";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";

export function OrderDetailDialog({
  order: passedOrder,
  open,
  onOpenChange,
}: {
  order: Order | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const { session } = useSession();
  // Re-pull the latest version of the order from the store every render so
  // that an in-dialog action (Approve, Mark-as-ordered, Request Revision)
  // updates the badge + footer immediately without closing.
  const orders = useOrders();
  const order = useMemo(
    () => (passedOrder ? orders.find((o) => o.id === passedOrder.id) ?? passedOrder : null),
    [orders, passedOrder],
  );

  const [revisionNote, setRevisionNote] = useState("");
  const [revisionError, setRevisionError] = useState(false);
  const [pngPending, setPngPending] = useState(false);
  const [pdfPending, setPdfPending] = useState(false);
  const revisionRef = useRef<HTMLTextAreaElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  if (!order) return null;
  const tpl = TEMPLATES_BY_ID[order.templateId];

  const isApprover = session.role === "approver";
  const isCreator = order.createdBy.email === session.email;
  const canApprove = isApprover && order.status === "pending";
  const canMarkOrdered = isApprover && order.status === "approved";
  // Creator can fix their own draft or rejected (revision-requested) orders.
  // Pending orders are in the approver's queue — the creator can't edit while
  // it's under review. Approved + ordered are permanently locked.
  const canCreatorEdit =
    isCreator && (order.status === "draft" || order.status === "rejected");
  const hasActionFooter = canApprove || canMarkOrdered || canCreatorEdit;

  const downloadPng = async () => {
    if (!exportRef.current || pngPending || pdfPending) return;
    setPngPending(true);
    try {
      const url = await toPng(exportRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${order.id}.png`;
      a.click();
    } finally {
      setPngPending(false);
    }
  };

  const downloadPdf = async () => {
    if (!exportRef.current || pngPending || pdfPending) return;
    setPdfPending(true);
    try {
      const url = await toPng(exportRef.current, {
        pixelRatio: 3,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });
      const w = order.specs.widthIn;
      const h = order.specs.heightIn;
      const pdf = new jsPDF({
        orientation: w > h ? "landscape" : "portrait",
        unit: "in",
        format: [w, h],
      });
      pdf.addImage(url, "PNG", 0, 0, w, h);
      pdf.save(`${order.id}.pdf`);
    } finally {
      setPdfPending(false);
    }
  };

  const downloadSpecSheet = () => {
    const pdf = new jsPDF({ unit: "pt", format: "letter" });
    const margin = 56;
    let y = margin;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("Parkwell Sign Order — Vendor Spec Sheet", margin, y);
    y += 28;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Generated ${new Date().toLocaleString()}`, margin, y);
    y += 28;

    const rows: [string, string][] = [
      ["Order ID", order.id],
      ["Template", tpl ? `${tpl.number} — ${tpl.name}` : order.templateId],
      ["Location", order.location || "—"],
      ["Site #", order.siteNumber || "—"],
      ["Dimensions", `${order.specs.widthIn}" W × ${order.specs.heightIn}" H`],
      ["Quantity", String(order.specs.quantity)],
      ["Material", order.specs.material],
      ["Brand colors", "Parkwell Blue #19B2EC, Ink #0A202E, White #FFFFFF"],
      ["Typography", "Montserrat — Bold for headings, Regular for body"],
      ["Manager", `${order.createdBy.name} <${order.createdBy.email}>`],
    ];
    pdf.setFontSize(11);
    rows.forEach(([k, v]) => {
      pdf.setFont("helvetica", "bold");
      pdf.text(`${k}:`, margin, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(v, margin + 110, y);
      y += 18;
    });
    if (order.specs.notes) {
      y += 8;
      pdf.setFont("helvetica", "bold");
      pdf.text("Notes:", margin, y);
      y += 16;
      pdf.setFont("helvetica", "normal");
      const lines = pdf.splitTextToSize(order.specs.notes, 480);
      pdf.text(lines, margin, y);
    }
    pdf.save(`${order.id}-specs.pdf`);
  };

  // Action handlers no longer auto-close the dialog. We re-pull the order
  // from the store on every render, so the badge + footer update in place —
  // an approver can approve, see the green stamp, then immediately mark as
  // ordered without re-opening anything.
  const approve = () => {
    saveOrder({
      ...order,
      status: "approved",
      approval: {
        decidedBy: session.name,
        decidedAt: Date.now(),
      },
      updatedAt: Date.now(),
    });
  };

  const requestRevision = () => {
    if (!revisionNote.trim()) {
      // Make the missing requirement OBVIOUS instead of silently disabling.
      setRevisionError(true);
      revisionRef.current?.focus();
      revisionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    saveOrder({
      ...order,
      status: "rejected",
      approval: {
        decidedBy: session.name,
        decidedAt: Date.now(),
        notes: revisionNote,
        revisionRequested: true,
      },
      updatedAt: Date.now(),
    });
    setRevisionNote("");
    setRevisionError(false);
  };

  const markOrdered = () => {
    saveOrder({
      ...order,
      status: "ordered",
      updatedAt: Date.now(),
    });
  };

  const editSign = () => {
    // Don't call onOpenChange — its parent does a router.replace back to
    // /dashboard/orders, which races with this push and cancels the
    // navigation. The dialog unmounts as soon as the route changes.
    router.push(`/create?template=${order.templateId}&order=${order.id}`);
  };

  const descriptionText = `${order.id} · ${tpl?.name ?? order.templateId} for ${order.location || "no location"} — ${order.specs.quantity} × ${order.specs.widthIn}" × ${order.specs.heightIn}" on ${order.specs.material}.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-6xl !p-0 w-[calc(100vw-2rem)] sm:w-[calc(100vw-4rem)] h-[calc(100vh-3rem)] sm:h-[min(calc(100vh-4rem),900px)] gap-0 grid-rows-[auto_1fr_auto] overflow-hidden"
        showCloseButton={false}
        aria-describedby="order-detail-description"
      >
        <DialogDescription id="order-detail-description" className="sr-only">
          {descriptionText}
        </DialogDescription>
        {/* ============ Sticky header ============ */}
        <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-background">
          <div className="min-w-0 flex items-center gap-3">
            <StatusBadge status={order.status} />
            <div className="hidden sm:flex items-baseline gap-2 min-w-0">
              <span className="font-mono text-xs text-muted-foreground">
                {order.id}
              </span>
              <span className="text-muted-foreground">·</span>
              <DialogTitle className="text-base font-semibold truncate">
                {tpl ? tpl.name : order.templateId}
                <span className="ml-1 font-normal text-muted-foreground">
                  — {userTag(order.createdBy.name, order.createdBy.role)}
                </span>
              </DialogTitle>
            </div>
            <DialogTitle className="sm:hidden text-base font-semibold truncate">
              {tpl?.name ?? order.templateId}
              <span className="ml-1 font-normal text-muted-foreground">
                — {userTag(order.createdBy.name, order.createdBy.role)}
              </span>
            </DialogTitle>
          </div>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-9 w-9 p-0 rounded-full shrink-0"
            aria-label="Close"
          >
            <span className="text-lg leading-none">×</span>
          </Button>
        </header>

        {/* ============ Scrollable body ============ */}
        <div className="overflow-y-auto">
          <div className="grid lg:grid-cols-[1.05fr_1fr] min-h-full">
            {/* Preview */}
            <div className="bg-muted/40 dark:bg-card/40 lg:border-r border-b lg:border-b-0 border-border p-6 md:p-10 flex items-start justify-center">
              <SignPreview template={tpl} values={order.values} width={420} />
              {/* Hidden export-grade copy */}
              <div
                style={{
                  position: "fixed",
                  top: -10000,
                  left: -10000,
                  pointerEvents: "none",
                }}
                aria-hidden
              >
                <SignPreview
                  ref={exportRef}
                  template={tpl}
                  values={order.values}
                  width={1200}
                  forExport
                />
              </div>
            </div>

            {/* Detail */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Title row visible on mobile only */}
              <div className="sm:hidden">
                <span className="font-mono text-xs text-muted-foreground">
                  {order.id}
                </span>
              </div>

              <Section title="Specs">
                <dl className="grid grid-cols-2 gap-y-2.5 text-sm">
                  <Row label="Location" value={order.location || "—"} />
                  <Row label="Site #" value={order.siteNumber || "—"} />
                  <Row label="Manager" value={order.createdBy.name} />
                  <Row
                    label="Dimensions"
                    value={`${order.specs.widthIn}" × ${order.specs.heightIn}"`}
                  />
                  <Row label="Quantity" value={String(order.specs.quantity)} />
                  <Row label="Material" value={order.specs.material} />
                  <Row
                    label="Created"
                    value={new Date(order.createdAt).toLocaleDateString()}
                  />
                </dl>
              </Section>

              {order.specs.notes && (
                <Section title="Vendor notes">
                  <p className="text-sm leading-relaxed">{order.specs.notes}</p>
                </Section>
              )}

              {order.approval && (
                <Section
                  title={
                    order.approval.revisionRequested
                      ? "Revision requested"
                      : "Approval record"
                  }
                  tone={order.approval.revisionRequested ? "warning" : "success"}
                >
                  <div className="text-sm">
                    <div className="font-medium">{order.approval.decidedBy}</div>
                    <div className="text-muted-foreground">
                      {new Date(order.approval.decidedAt).toLocaleString()}
                    </div>
                    {order.approval.notes && (
                      <p className="mt-2 text-muted-foreground italic">
                        “{order.approval.notes}”
                      </p>
                    )}
                  </div>
                </Section>
              )}

              <Section title="Vendor-ready files">
                <div className="grid grid-cols-3 gap-2">
                  <DownloadButton
                    onClick={downloadPng}
                    icon={Download}
                    label="PNG"
                    busy={pngPending}
                    busyLabel="Rendering…"
                    disabled={pngPending || pdfPending}
                  />
                  <DownloadButton
                    onClick={downloadPdf}
                    icon={Download}
                    label="Print PDF"
                    busy={pdfPending}
                    busyLabel="Generating PDF…"
                    disabled={pngPending || pdfPending}
                  />
                  <DownloadButton
                    onClick={downloadSpecSheet}
                    icon={FileText}
                    label="Spec sheet"
                    disabled={pngPending || pdfPending}
                  />
                </div>
              </Section>

              {canApprove && (
                <Section
                  title="Revisions Needed"
                  hint="Required to send back for changes."
                  tone={revisionError ? "warning" : undefined}
                >
                  <Textarea
                    ref={revisionRef}
                    rows={3}
                    placeholder="What needs to change before this can be approved?"
                    value={revisionNote}
                    onChange={(e) => {
                      setRevisionNote(e.target.value);
                      if (e.target.value.trim()) setRevisionError(false);
                    }}
                    aria-invalid={revisionError}
                    className={cn(
                      "resize-none",
                      revisionError &&
                        "border-parkwell-red focus-visible:ring-parkwell-red/40",
                    )}
                  />
                  {revisionError && (
                    <p className="mt-2 text-xs text-parkwell-red">
                      Add a short note about what needs changing — the requester needs to know what to fix.
                    </p>
                  )}
                </Section>
              )}
            </div>
          </div>
        </div>

        {/* ============ Sticky action footer ============ */}
        {hasActionFooter && (
          <footer className="border-t border-border bg-background px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {canApprove ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Requested by <span className="font-semibold text-foreground">{order.createdBy.name}</span>
                </p>
                <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-2">
                  <Button
                    variant="outline"
                    onClick={editSign}
                    className="h-11 rounded-full border-2 px-5"
                  >
                    <Pencil className="h-4 w-4 mr-1.5" />
                    Edit Sign
                  </Button>
                  <Button
                    variant="outline"
                    onClick={requestRevision}
                    className="h-11 rounded-full border-2 border-parkwell-red/40 text-parkwell-red hover:bg-parkwell-red/10 hover:text-parkwell-red px-5"
                  >
                    <Send className="h-4 w-4 mr-1.5" />
                    Request Revision
                  </Button>
                  <Button
                    onClick={approve}
                    className="h-11 rounded-full bg-parkwell-green text-white hover:bg-parkwell-green/90 shadow-md shadow-parkwell-green/30 px-6"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Approve
                  </Button>
                </div>
              </>
            ) : canCreatorEdit ? (
              <>
                <p className="text-xs text-muted-foreground">
                  {order.status === "rejected"
                    ? "Revisions were requested. Update and resubmit."
                    : "Draft — only you can see this until you submit."}
                </p>
                <Button
                  onClick={editSign}
                  className="h-11 rounded-full bg-parkwell-blue text-white hover:bg-parkwell-blue/90 shadow-md shadow-parkwell-blue/30 px-7"
                >
                  <Pencil className="h-4 w-4 mr-1.5" />
                  {order.status === "rejected" ? "Edit & Resubmit" : "Edit Sign"}
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Approved by{" "}
                  <span className="font-semibold text-foreground">
                    {order.approval?.decidedBy}
                  </span>
                  . Confirm vendor receipt to close out.
                </p>
                <Button
                  onClick={markOrdered}
                  className="h-11 rounded-full bg-parkwell-blue text-white hover:bg-parkwell-blue/90 shadow-md shadow-parkwell-blue/30 px-7"
                >
                  <Truck className="h-4 w-4 mr-1.5" />
                  Mark as ordered
                </Button>
              </>
            )}
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ----- helpers ----- */

function Section({
  title,
  hint,
  children,
  tone,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  tone?: "warning" | "success";
}) {
  const toneCls =
    tone === "warning"
      ? "border-parkwell-yellow/50 bg-parkwell-yellow/5"
      : tone === "success"
        ? "border-parkwell-green/40 bg-parkwell-green/5"
        : "border-border bg-muted/30 dark:bg-card/30";
  return (
    <section className={`rounded-2xl border ${toneCls} p-4`}>
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
          {title}
        </h3>
        {hint && (
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        )}
      </div>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </>
  );
}

function DownloadButton({
  onClick,
  icon: Icon,
  label,
  busy,
  busyLabel,
  disabled,
}: {
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  busy?: boolean;
  busyLabel?: string;
  disabled?: boolean;
}) {
  const ShownIcon = busy ? Loader2 : Icon;
  const shownLabel = busy && busyLabel ? busyLabel : label;
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant="outline"
      className="h-11 rounded-full border-2 hover:border-parkwell-blue hover:text-parkwell-blue transition-colors"
    >
      <ShownIcon className={cn("h-4 w-4 mr-1.5", busy && "animate-spin")} />
      <span className="hidden sm:inline">{shownLabel}</span>
      <span className="sm:hidden text-xs">{shownLabel.split(" ")[0]}</span>
    </Button>
  );
}
