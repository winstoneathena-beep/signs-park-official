"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Download,
  CheckCircle2,
  Plus,
  Trash2,
  Send,
  Save,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Upload,
  X,
  Loader2,
  Compass,
  List as ListIcon,
} from "lucide-react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import {
  SIGN_TEMPLATES,
  TEMPLATES_BY_ID,
  defaultSize,
  isSquare,
  type SignTemplate,
  type EditableField,
  type SignSize,
  type ArrowDirection,
} from "@/lib/sign-templates";
import {
  SignPreview,
  DEFAULT_RATE_ROWS,
  type FieldValues,
  type RateRow,
} from "@/components/sign/SignPreview";
import {
  getOrderById,
  nextOrderId,
  saveOrder,
  useOrders,
  useSession,
  type Order,
} from "@/lib/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Step = "content" | "specs" | "review";

export function SignEditor({
  initialTemplateId,
}: {
  initialTemplateId?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const { session } = useSession();

  const tplFromQuery = params.get("template");
  const orderIdFromQuery = params.get("order");

  // If ?order= present, load that order on first render and pre-populate every
  // field from it. We're now editing, not creating.
  const [editingOrder, setEditingOrder] = useState<Order | null>(() =>
    orderIdFromQuery ? getOrderById(orderIdFromQuery) : null,
  );

  // Permission check — keep in sync with OrderDetailDialog.
  const canEditExisting = editingOrder
    ? (() => {
        const isApprover = session.role === "approver";
        const isCreator = editingOrder.createdBy.email === session.email;
        if (
          editingOrder.status === "approved" ||
          editingOrder.status === "ordered"
        )
          return false;
        if (isApprover && editingOrder.status === "pending") return true;
        if (
          isCreator &&
          (editingOrder.status === "draft" ||
            editingOrder.status === "rejected")
        )
          return true;
        return false;
      })()
    : true; // creating a new sign — always allowed

  const [templateId, setTemplateId] = useState<string>(
    editingOrder?.templateId ||
      initialTemplateId ||
      tplFromQuery ||
      SIGN_TEMPLATES[2].id,
  );
  const template = TEMPLATES_BY_ID[templateId] ?? SIGN_TEMPLATES[2];

  const [values, setValues] = useState<FieldValues>(
    () => editingOrder?.values ?? initFieldValues(template),
  );
  const [size, setSize] = useState<SignSize>(() =>
    editingOrder
      ? {
          widthIn: editingOrder.specs.widthIn,
          heightIn: editingOrder.specs.heightIn,
        }
      : defaultSize(template),
  );
  const [specs, setSpecs] = useState({
    quantity: editingOrder?.specs.quantity ?? 1,
    material:
      editingOrder?.specs.material ?? template.materials[0] ?? "Aluminium",
    notes: editingOrder?.specs.notes ?? "",
  });
  const [location, setLocation] = useState(editingOrder?.location ?? "");
  const [siteNumber, setSiteNumber] = useState(editingOrder?.siteNumber ?? "");
  const [step, setStep] = useState<Step>("content");
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null);

  // Orders load async from Supabase now — on a deep-link (?order=) the cache
  // may still be empty at mount, so getOrderById above returned null. Adopt
  // the order the moment it arrives and re-seed every field from it.
  // (State-during-render is the sanctioned React pattern for this; the
  // orderIdFromQuery && !editingOrder guard makes it run at most once.)
  const allOrders = useOrders();
  if (orderIdFromQuery && !editingOrder) {
    const found = allOrders.find((o) => o.id === orderIdFromQuery);
    if (found) {
      setEditingOrder(found);
      setTemplateId(found.templateId);
      setValues(found.values);
      setSize({ widthIn: found.specs.widthIn, heightIn: found.specs.heightIn });
      setSpecs({
        quantity: found.specs.quantity,
        material: found.specs.material,
        notes: found.specs.notes ?? "",
      });
      setLocation(found.location);
      setSiteNumber(found.siteNumber);
    }
  }

  /**
   * Step-change ergonomics: after Continue / Back, scroll the window to the
   * top so the user sees the new step's first field. Without this they
   * stay anchored to wherever the button was — usually the bottom of the
   * previous step.
   */
  const goToStep = (s: Step) => {
    setStep(s);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  /** Switch template + reset dependent state in one user-driven action. */
  const switchTemplate = (id: string) => {
    const next = TEMPLATES_BY_ID[id] ?? SIGN_TEMPLATES[2];
    setTemplateId(id);
    setValues(initFieldValues(next));
    setSize(defaultSize(next));
    setSpecs((s) => ({
      ...s,
      material: next.materials[0] ?? s.material,
    }));
  };

  const previewRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Track in-flight downloads so the buttons can show spinners. PDF rasterizes
  // at pixelRatio 3 (intentional for print fidelity) and takes ~8s — without
  // a spinner the user has no feedback and may click another export, cancelling.
  const [pngPending, setPngPending] = useState(false);
  const [pdfPending, setPdfPending] = useState(false);

  const downloadPng = async () => {
    if (pngPending || pdfPending) return;
    const node = exportRef.current;
    if (!node) return;
    setPngPending(true);
    try {
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      triggerDownload(
        dataUrl,
        `${template.id}-${slug(location || "sign")}.png`,
      );
    } finally {
      setPngPending(false);
    }
  };

  const downloadPdf = async () => {
    if (pngPending || pdfPending) return;
    const node = exportRef.current;
    if (!node) return;
    setPdfPending(true);
    try {
      const dataUrl = await toPng(node, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const pdf = new jsPDF({
        orientation: size.widthIn > size.heightIn ? "landscape" : "portrait",
        unit: "in",
        format: [size.widthIn, size.heightIn],
      });
      pdf.addImage(dataUrl, "PNG", 0, 0, size.widthIn, size.heightIn);
      pdf.save(`${template.id}-${slug(location || "sign")}.pdf`);
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
      ["Template", `${template.number} — ${template.name}`],
      ["Location", location || "—"],
      ["Site #", siteNumber || "—"],
      ["Dimensions", `${size.widthIn}" W × ${size.heightIn}" H`],
      ["Quantity", String(specs.quantity)],
      ["Material", specs.material],
      ["Brand colors", "Parkwell Blue #19B2EC, Ink #0A202E, White #FFFFFF"],
      ["Typography", "Montserrat — Bold for headings, Regular for body"],
      ["Manager", `${session.name} <${session.email}>`],
    ];
    pdf.setFontSize(11);
    rows.forEach(([k, v]) => {
      pdf.setFont("helvetica", "bold");
      pdf.text(`${k}:`, margin, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(v, margin + 110, y);
      y += 18;
    });
    if (specs.notes) {
      y += 8;
      pdf.setFont("helvetica", "bold");
      pdf.text("Notes:", margin, y);
      y += 16;
      pdf.setFont("helvetica", "normal");
      const lines = pdf.splitTextToSize(specs.notes, 480);
      pdf.text(lines, margin, y);
    }
    pdf.save(`${template.id}-${slug(location || "sign")}-specs.pdf`);
  };

  const submit = (status: Order["status"]) => {
    const commonSpecs = {
      widthIn: size.widthIn,
      heightIn: size.heightIn,
      quantity: specs.quantity,
      material: specs.material,
      notes: specs.notes,
    };

    let savedId: string;

    if (editingOrder) {
      // Update existing — preserve id, createdBy, createdAt. The status passed
      // in wins (so "Save changes" can keep pending, "Submit" can re-raise a
      // rejected sign back to pending, etc.).
      savedId = editingOrder.id;
      saveOrder({
        ...editingOrder,
        templateId: template.id,
        status,
        values,
        specs: commonSpecs,
        location: location || editingOrder.location,
        siteNumber: siteNumber || editingOrder.siteNumber,
        updatedAt: Date.now(),
      });
      // Keep the editingOrder reference fresh for subsequent saves on the same screen.
      setEditingOrder({
        ...editingOrder,
        templateId: template.id,
        status,
        values,
        specs: commonSpecs,
        location: location || editingOrder.location,
        siteNumber: siteNumber || editingOrder.siteNumber,
        updatedAt: Date.now(),
      });
    } else {
      // Create new. Store an empty string when no location was provided —
      // the display layer renders "—" for empty so a missing Location isn't
      // smashed into a synthetic "template — manager" label.
      savedId = submittedOrderId || nextOrderId();
      saveOrder({
        id: savedId,
        templateId: template.id,
        status,
        values,
        specs: commonSpecs,
        location: location.trim(),
        siteNumber: siteNumber.trim(),
        createdBy: session,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      setSubmittedOrderId(savedId);
    }

    if (status !== "draft") {
      router.push(`/dashboard/orders?id=${savedId}`);
    }
  };

  // If the user is trying to edit an order they have no rights to, show a
  // friendly block instead of the editor.
  if (editingOrder && !canEditExisting) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-5 md:px-8 pt-32 pb-20 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          You can&rsquo;t edit this order
        </h1>
        <p className="mt-4 text-muted-foreground">
          {editingOrder.status === "approved" ||
          editingOrder.status === "ordered"
            ? `${editingOrder.id} is ${editingOrder.status} and locked.`
            : editingOrder.status === "pending"
              ? `${editingOrder.id} is in approval — only the assigned approver can edit it while it's there.`
              : `${editingOrder.id} belongs to ${editingOrder.createdBy.name}. Only they can edit their own ${editingOrder.status}.`}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href={`/dashboard/orders?id=${editingOrder.id}`}
            className="inline-flex h-11 items-center justify-center rounded-full bg-parkwell-blue px-6 text-sm font-semibold text-white hover:bg-parkwell-blue/90"
          >
            View order
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-6 text-sm font-semibold hover:bg-muted"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 pt-24 pb-20">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <Link
            href={editingOrder ? "/dashboard/orders" : "/templates"}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            {editingOrder ? "Back to orders" : "Back to library"}
          </Link>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">
            {editingOrder ? "Edit sign" : "Create a sign"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {editingOrder
              ? "Make changes to this sign, then save."
              : "Pick a template, fill the editable fields, download or submit for approval."}
          </p>
          {editingOrder && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-parkwell-blue/30 bg-parkwell-blue/10 px-3.5 py-1 text-xs">
              <span className="font-mono font-semibold text-parkwell-blue">
                {editingOrder.id}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                Status:{" "}
                <span className="capitalize">{editingOrder.status}</span>
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                Created by {editingOrder.createdBy.name}
              </span>
            </div>
          )}
        </div>
        <Steps current={step} />
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_minmax(360px,440px)]">
        {/* Left: Preview */}
        <div className="lg:sticky lg:top-24 self-start">
          <div className="rounded-3xl bg-muted/40 dark:bg-card/30 border border-border p-4 sm:p-6 md:p-10 flex justify-center">
            <PreviewBox
              previewRef={previewRef}
              template={template}
              values={values}
              showZones={false}
            />
          </div>
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
              template={template}
              values={values}
              width={1200}
              forExport
            />
          </div>
        </div>

        {/* Right: Editor steps */}
        <div className="space-y-6">
          {step === "content" && (
            <ContentStep
              template={template}
              values={values}
              onValues={setValues}
              onTemplate={switchTemplate}
              onNext={() => goToStep("specs")}
            />
          )}
          {step === "specs" && (
            <SpecsStep
              template={template}
              size={size}
              specs={specs}
              location={location}
              siteNumber={siteNumber}
              onSize={setSize}
              onSpecs={setSpecs}
              onLocation={setLocation}
              onSiteNumber={setSiteNumber}
              onBack={() => goToStep("content")}
              onNext={() => goToStep("review")}
            />
          )}
          {step === "review" && (
            <ReviewStep
              template={template}
              size={size}
              specs={specs}
              location={location}
              siteNumber={siteNumber}
              onBack={() => goToStep("specs")}
              onSaveDraft={() => submit("draft")}
              onSubmit={() => {
                // Status decision when saving:
                //  • New sign → "pending" (submit for approval).
                //  • Approver editing pending → stay pending (fix-and-approve).
                //  • Creator editing rejected → re-submit → "pending".
                //  • Creator editing draft → submit → "pending".
                //  • Any other edit → keep existing status.
                if (!editingOrder) return submit("pending");
                if (
                  editingOrder.status === "rejected" ||
                  editingOrder.status === "draft"
                )
                  return submit("pending");
                submit(editingOrder.status);
              }}
              onDownloadPng={downloadPng}
              onDownloadPdf={downloadPdf}
              onDownloadSpecs={downloadSpecSheet}
              pngPending={pngPending}
              pdfPending={pdfPending}
              submittedOrderId={submittedOrderId}
              editingOrder={editingOrder}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------- Responsive Preview -------------------------- */

function PreviewBox({
  previewRef,
  template,
  values,
  showZones,
}: {
  previewRef: React.RefObject<HTMLDivElement | null>;
  template: SignTemplate;
  values: FieldValues;
  showZones: boolean;
}) {
  const MAX_WIDTH = 460;
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(MAX_WIDTH);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.min(MAX_WIDTH, Math.max(220, el.clientWidth));
      setWidth(w);
    };
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full flex justify-center"
      style={{ maxWidth: MAX_WIDTH }}
    >
      <SignPreview
        ref={previewRef}
        template={template}
        values={values}
        width={width}
        showZones={showZones && template.editableFields.length > 0}
      />
    </div>
  );
}

/* ============================ Step 1: Content ============================ */

function ContentStep({
  template,
  values,
  onValues,
  onTemplate,
  onNext,
}: {
  template: SignTemplate;
  values: FieldValues;
  onValues: (v: FieldValues) => void;
  onTemplate: (id: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="1. Template"
          subtitle="What kind of sign are you ordering?"
        />
        <Select value={template.id} onValueChange={onTemplate}>
          <SelectTrigger className="h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SIGN_TEMPLATES.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.number} — {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-3 text-sm text-muted-foreground">
          {template.description}
        </p>
      </Card>

      <Card>
        <CardHeader
          title="2. Content"
          subtitle="Edit the fields below. Brand colors, fonts, the wave, and the logo stay locked."
        />
        <div className="space-y-5">
          {template.editableFields.map((field) => (
            <FieldEditor
              key={field.id}
              field={field}
              value={values[field.id]}
              onChange={(v) => onValues({ ...values, [field.id]: v })}
            />
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          className="h-12 rounded-full bg-parkwell-blue text-white hover:bg-parkwell-blue/90 px-8"
        >
          Continue to specs
        </Button>
      </div>
    </div>
  );
}

/* --------------------------- Per-field editor --------------------------- */

function FieldEditor({
  field,
  value,
  onChange,
}: {
  field: EditableField;
  value: string | string[] | RateRow[] | undefined;
  onChange: (v: string | string[] | RateRow[]) => void;
}) {
  if (field.type === "arrow-direction") {
    const current: ArrowDirection =
      value === "right" ||
      value === "left" ||
      value === "up" ||
      value === "down"
        ? value
        : ((field.placeholder as ArrowDirection) ?? "right");
    return (
      <ArrowDirectionEditor
        label={field.label}
        value={current}
        onChange={(v) => onChange(v)}
      />
    );
  }

  if (field.type === "rate-table") {
    const rows: RateRow[] =
      Array.isArray(value) && value.length > 0 && typeof value[0] === "object"
        ? (value as RateRow[])
        : (field.defaultRows ?? DEFAULT_RATE_ROWS);
    return (
      <RateTableEditor label={field.label} rows={rows} onChange={onChange} />
    );
  }

  if (field.type === "list") {
    const items: string[] = Array.isArray(value)
      ? (value as string[]).filter((v) => typeof v === "string")
      : Array.isArray(field.placeholder)
        ? (field.placeholder as string[])
        : [];
    return (
      <ListEditor
        label={field.label}
        items={items.length > 0 ? items : (field.placeholder as string[])}
        bulletStyle={field.style.bulletStyle ?? "•"}
        max={field.constraints?.maxItems ?? 12}
        onChange={onChange}
      />
    );
  }

  if (field.type === "qr-image") {
    const dataUrl = typeof value === "string" ? value : "";
    return (
      <QrUploader label={field.label} value={dataUrl} onChange={onChange} />
    );
  }

  const v = typeof value === "string" ? value : "";
  const isMultiline =
    field.type === "body" ||
    field.type === "messaging" ||
    (field.constraints?.maxRows ?? 1) > 1;

  return (
    <div>
      <FieldLabel
        label={field.label}
        constraints={field.constraints}
        value={v}
      />
      {isMultiline ? (
        <Textarea
          value={v}
          placeholder={
            Array.isArray(field.placeholder)
              ? (field.placeholder as string[]).join("\n")
              : field.placeholder
          }
          rows={Math.min(6, Math.max(2, field.constraints?.maxRows ?? 3))}
          onChange={(e) => onChange(e.target.value)}
          className="resize-none"
        />
      ) : (
        <Input
          value={v}
          placeholder={
            typeof field.placeholder === "string" ? field.placeholder : ""
          }
          maxLength={field.constraints?.maxChars}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function ArrowDirectionEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ArrowDirection;
  onChange: (v: ArrowDirection) => void;
}) {
  // Order matches the visual compass — up, right, down, left.
  const OPTIONS: {
    dir: ArrowDirection;
    Icon: React.ElementType;
    label: string;
  }[] = [
    { dir: "up", Icon: ChevronUp, label: "Up" },
    { dir: "right", Icon: ChevronRight, label: "Right" },
    { dir: "down", Icon: ChevronDown, label: "Down" },
    { dir: "left", Icon: ChevronLeft, label: "Left" },
  ];
  return (
    <div>
      <Label className="mb-2 flex items-center gap-1.5">
        <Compass className="h-3.5 w-3.5" />
        {label}
      </Label>
      <div
        role="radiogroup"
        aria-label={label}
        className="inline-flex rounded-full border border-input bg-background p-1 gap-1"
      >
        {OPTIONS.map(({ dir, Icon, label: optLabel }) => {
          const active = dir === value;
          return (
            <button
              key={dir}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={optLabel}
              onClick={() => onChange(dir)}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                active
                  ? "bg-parkwell-blue text-white shadow-md shadow-parkwell-blue/30"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        The brand chevron stays the same — only its direction changes.
      </p>
    </div>
  );
}

function FieldLabel({
  label,
  constraints,
  value,
}: {
  label: string;
  constraints?: EditableField["constraints"];
  value: string;
}) {
  const maxChars = constraints?.maxChars;
  const isOver = maxChars != null && value.length > maxChars;
  return (
    <div className="flex items-baseline justify-between mb-1.5">
      <Label>{label}</Label>
      {maxChars != null && (
        <span
          className={cn(
            "text-[11px] tabular-nums",
            isOver
              ? "text-parkwell-red font-semibold"
              : "text-muted-foreground",
          )}
          aria-live={isOver ? "polite" : undefined}
        >
          {value.length}/{maxChars}
          {isOver ? " · too long" : ""}
        </span>
      )}
    </div>
  );
}

/* ------------------------------ List editor ------------------------------ */

function ListEditor({
  label,
  items,
  bulletStyle,
  max,
  onChange,
}: {
  label: string;
  items: string[];
  bulletStyle: "•" | "–" | "1." | "none";
  max: number;
  onChange: (items: string[]) => void;
}) {
  const update = (i: number, val: string) => {
    const copy = [...items];
    copy[i] = val;
    onChange(copy);
  };
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
  const add = () => onChange([...items, ""]);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <Label className="flex items-center gap-1.5">
          <ListIcon className="h-3.5 w-3.5" />
          {label}
        </Label>
        <span className="text-[11px] text-muted-foreground">
          {items.length}/{max}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground shrink-0">
              {bulletStyle === "1."
                ? `${i + 1}.`
                : bulletStyle === "–"
                  ? "–"
                  : "•"}
            </span>
            <Textarea
              value={item}
              onChange={(e) => update(i, e.target.value)}
              rows={2}
              className="resize-none flex-1 min-h-9"
            />
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove item"
                className="h-9 w-9 inline-flex items-center justify-center text-muted-foreground hover:text-parkwell-red rounded-full hover:bg-parkwell-red/10 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        {items.length < max && (
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 text-sm text-parkwell-blue font-medium hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Add item
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Rate table ------------------------------ */

function RateTableEditor({
  label,
  rows,
  onChange,
}: {
  label: string;
  rows: RateRow[];
  onChange: (rows: RateRow[]) => void;
}) {
  const update = (i: number, next: RateRow) => {
    const copy = [...rows];
    copy[i] = next;
    onChange(copy);
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      {rows.map((row, i) => (
        <div
          key={i}
          className="rounded-xl border border-border p-4 space-y-2.5 bg-card"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Row {i + 1}
            </span>
            {rows.length > 1 && (
              <button
                type="button"
                aria-label="Remove row"
                onClick={() => onChange(rows.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-parkwell-red"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="WEEKDAYS"
              value={row.label}
              onChange={(e) =>
                update(i, { ...row, label: e.target.value.toUpperCase() })
              }
            />
            <Input
              placeholder="5am-4pm"
              value={row.sub}
              onChange={(e) => update(i, { ...row, sub: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            {row.rates.map((rate, j) => (
              <div key={j} className="flex gap-2">
                <Input
                  placeholder={
                    j === 0 ? "$10 first 2 hours" : "$5 hourly thereafter"
                  }
                  value={rate}
                  onChange={(e) => {
                    const next = [...row.rates];
                    next[j] = e.target.value;
                    update(i, { ...row, rates: next });
                  }}
                />
                {row.rates.length > 1 && (
                  <button
                    type="button"
                    aria-label="Remove rate"
                    onClick={() =>
                      update(i, {
                        ...row,
                        rates: row.rates.filter((_, k) => k !== j),
                      })
                    }
                    className="px-3 text-muted-foreground hover:text-parkwell-red"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {row.rates.length < 4 && (
              <button
                type="button"
                onClick={() => update(i, { ...row, rates: [...row.rates, ""] })}
                className="inline-flex items-center gap-1.5 text-xs text-parkwell-blue font-medium hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add rate line
              </button>
            )}
          </div>
        </div>
      ))}
      {rows.length < 4 && (
        <button
          type="button"
          onClick={() =>
            onChange([...rows, { label: "", sub: "", rates: [""] }])
          }
          className="inline-flex items-center gap-1.5 text-sm text-parkwell-blue font-medium hover:underline"
        >
          <Plus className="h-4 w-4" /> Add rate row
        </button>
      )}
    </div>
  );
}

/* ------------------------------ QR uploader ------------------------------ */

function QrUploader({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, SVG).");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("Image must be under 4MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.onerror = () => setError("Couldn't read that file. Try another.");
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <div
        className={cn(
          "rounded-xl border-2 border-dashed border-border bg-muted/30 p-4 transition-colors",
          "hover:border-parkwell-blue/50",
        )}
      >
        {value ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="QR code preview"
              className="h-20 w-20 rounded-md bg-white object-contain border border-border shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">QR code uploaded</div>
              <div className="text-xs text-muted-foreground">
                Replaces the placeholder QR on this sign.
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Remove QR"
              className="h-9 w-9 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-parkwell-red hover:bg-parkwell-red/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full flex flex-col items-center gap-2 py-4 text-center text-muted-foreground hover:text-foreground"
          >
            <div className="h-11 w-11 rounded-full bg-parkwell-blue/10 text-parkwell-blue inline-flex items-center justify-center">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                Upload QR code
              </div>
              <div className="text-xs">PNG, JPG or SVG · up to 4MB</div>
            </div>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {error && <p className="mt-2 text-xs text-parkwell-red">{error}</p>}
    </div>
  );
}

/* ============================ Step 2: Specs ============================ */

function SpecsStep({
  template,
  size,
  specs,
  location,
  siteNumber,
  onSize,
  onSpecs,
  onLocation,
  onSiteNumber,
  onBack,
  onNext,
}: {
  template: SignTemplate;
  size: SignSize;
  specs: { quantity: number; material: string; notes: string };
  location: string;
  siteNumber: string;
  onSize: (s: SignSize) => void;
  onSpecs: (s: typeof specs) => void;
  onLocation: (s: string) => void;
  onSiteNumber: (s: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const sizeKey = `${size.widthIn}x${size.heightIn}`;
  const sq = isSquare(template);

  // Both fields are required for billing / expense coding — gate the Next
  // button and show inline validation on touched-but-empty inputs.
  const [touched, setTouched] = useState<{ location: boolean; site: boolean }>({
    location: false,
    site: false,
  });
  const locationMissing = !location.trim();
  const siteMissing = !siteNumber.trim();
  const canContinue = !locationMissing && !siteMissing;
  const tryNext = () => {
    if (!canContinue) {
      setTouched({ location: true, site: true });
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="3. Location & Site #"
          subtitle="Both are required — used for delivery and to code the expense."
        />
        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block">
              Location name <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="e.g. 250 Columbine — Denver, CO"
              value={location}
              aria-invalid={touched.location && locationMissing}
              onBlur={() => setTouched((t) => ({ ...t, location: true }))}
              onChange={(e) => onLocation(e.target.value)}
              className={
                touched.location && locationMissing
                  ? "border-destructive focus-visible:ring-destructive"
                  : undefined
              }
            />
            {touched.location && locationMissing && (
              <p className="mt-1.5 text-xs text-destructive">
                Location name is required.
              </p>
            )}
          </div>
          <div>
            <Label className="mb-1.5 block">
              Site # <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="e.g. PW-0250"
              value={siteNumber}
              aria-invalid={touched.site && siteMissing}
              onBlur={() => setTouched((t) => ({ ...t, site: true }))}
              onChange={(e) => onSiteNumber(e.target.value)}
              className={
                touched.site && siteMissing
                  ? "border-destructive focus-visible:ring-destructive"
                  : undefined
              }
            />
            {touched.site && siteMissing && (
              <p className="mt-1.5 text-xs text-destructive">
                Site # is required so the order can be coded to the right
                expense.
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="4. Sign size"
          subtitle={
            sq
              ? "Square dimensions only — pick a size that fits the install location."
              : "Fixed sizes that preserve the brand-correct aspect ratio."
          }
        />
        <Select
          value={sizeKey}
          onValueChange={(v) => {
            const next = template.sizes.find(
              (s) => `${s.widthIn}x${s.heightIn}` === v,
            );
            if (next) onSize(next);
          }}
        >
          <SelectTrigger className="h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {template.sizes.map((s) => (
              <SelectItem
                key={`${s.widthIn}x${s.heightIn}`}
                value={`${s.widthIn}x${s.heightIn}`}
              >
                {s.label ?? `${s.widthIn}" × ${s.heightIn}"`}
                {s === template.sizes[0] && " (default)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-2 text-xs text-muted-foreground">
          Text scales automatically with the chosen size — brand proportions
          stay consistent.
        </p>
      </Card>

      <Card>
        <CardHeader title="5. Material & quantity" subtitle="" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1.5 block">Material</Label>
            <Select
              value={specs.material}
              onValueChange={(v) => onSpecs({ ...specs, material: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {template.materials.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Quantity</Label>
            <Input
              type="number"
              min={1}
              value={specs.quantity}
              onChange={(e) =>
                onSpecs({ ...specs, quantity: Number(e.target.value) || 1 })
              }
            />
          </div>
        </div>
        <div className="mt-4">
          <Label className="mb-1.5 block">Notes for vendor (optional)</Label>
          <Textarea
            rows={3}
            value={specs.notes}
            placeholder="Mounting hardware, install date, special handling…"
            onChange={(e) => onSpecs({ ...specs, notes: e.target.value })}
          />
        </div>
      </Card>

      <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          className="h-12 rounded-full px-7"
        >
          Back
        </Button>
        <div className="flex flex-col items-end gap-1.5">
          <Button
            onClick={tryNext}
            disabled={!canContinue}
            className="h-12 rounded-full bg-parkwell-blue text-white hover:bg-parkwell-blue/90 disabled:opacity-50 disabled:cursor-not-allowed px-8"
          >
            Review & download
          </Button>
          {!canContinue && (
            <p className="text-xs text-muted-foreground">
              Fill in Location and Site # to continue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================ Step 3: Review ============================ */

function ReviewStep({
  template,
  size,
  specs,
  location,
  siteNumber,
  onBack,
  onSaveDraft,
  onSubmit,
  onDownloadPng,
  onDownloadPdf,
  onDownloadSpecs,
  pngPending,
  pdfPending,
  submittedOrderId,
  editingOrder,
}: {
  template: SignTemplate;
  size: SignSize;
  specs: { quantity: number; material: string; notes: string };
  location: string;
  siteNumber: string;
  onBack: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onDownloadPng: () => void;
  onDownloadPdf: () => void;
  onDownloadSpecs: () => void;
  pngPending: boolean;
  pdfPending: boolean;
  submittedOrderId: string | null;
  editingOrder: Order | null;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="6. Review"
          subtitle="Looks good? Download or send for approval."
        />
        <dl className="grid grid-cols-2 gap-y-3 text-sm">
          <Row
            label="Template"
            value={`${template.number} — ${template.name}`}
          />
          <Row label="Location" value={location || "—"} />
          <Row label="Site #" value={siteNumber || "—"} />
          <Row
            label="Dimensions"
            value={`${size.widthIn}" × ${size.heightIn}"`}
          />
          <Row label="Quantity" value={String(specs.quantity)} />
          <Row label="Material" value={specs.material} />
        </dl>
      </Card>

      <Card>
        <CardHeader
          title="Brand compliance"
          subtitle="Auto-checked against the Parkwell signage standards."
        />
        <ul className="space-y-2 text-sm">
          {[
            "Parkwell Blue (#19B2EC) and Ink (#0A202E) used as defined",
            "Montserrat — Bold for headings, Regular for body",
            "Wave footer with white Parkwell logo on Ink",
            "Aspect ratio preserved across all available sizes",
          ].map((c) => (
            <li key={c} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-parkwell-green mt-0.5 shrink-0" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader
          title="Download"
          subtitle="Vendor-ready files. Hand off to any vendor regardless of their tech setup."
        />
        <div className="grid gap-2.5 sm:grid-cols-3">
          <Button
            onClick={onDownloadPng}
            disabled={pngPending || pdfPending}
            variant="outline"
            className="h-12 rounded-full border-2"
          >
            {pngPending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1.5" />
            )}
            {pngPending ? "Rendering…" : "PNG"}
          </Button>
          <Button
            onClick={onDownloadPdf}
            disabled={pngPending || pdfPending}
            variant="outline"
            className="h-12 rounded-full border-2"
          >
            {pdfPending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1.5" />
            )}
            {pdfPending ? "Generating PDF…" : "Print PDF"}
          </Button>
          <Button
            onClick={onDownloadSpecs}
            disabled={pngPending || pdfPending}
            variant="outline"
            className="h-12 rounded-full border-2"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Spec sheet
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader
          title={editingOrder ? "Save changes" : "Send for approval"}
          subtitle={
            editingOrder
              ? `Updates will be applied to ${editingOrder.id} (currently ${editingOrder.status}).`
              : "Approver gets a notification with the preview and specs."
          }
        />
        {submittedOrderId ? (
          <Badge className="bg-parkwell-green/15 text-parkwell-green border-parkwell-green/30">
            Submitted as {submittedOrderId}
          </Badge>
        ) : editingOrder ? (
          <Button
            onClick={onSubmit}
            className="w-full h-12 rounded-full bg-parkwell-blue text-white hover:bg-parkwell-blue/90"
          >
            {editingOrder.status === "rejected" ? (
              <>
                <Send className="h-4 w-4 mr-1.5" />
                Re-submit {editingOrder.id} for approval
              </>
            ) : editingOrder.status === "draft" ? (
              <>
                <Send className="h-4 w-4 mr-1.5" />
                Submit {editingOrder.id} for approval
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1.5" />
                Save changes to {editingOrder.id}
              </>
            )}
          </Button>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Button
              onClick={onSaveDraft}
              variant="outline"
              className="h-12 rounded-full border-2"
            >
              <Save className="h-4 w-4 mr-1.5" />
              Save as draft
            </Button>
            <Button
              onClick={onSubmit}
              className="h-12 rounded-full bg-parkwell-blue text-white hover:bg-parkwell-blue/90"
            >
              <Send className="h-4 w-4 mr-1.5" />
              Submit for approval
            </Button>
          </div>
        )}
      </Card>

      <div className="flex justify-start">
        <Button
          onClick={onBack}
          variant="outline"
          className="h-12 rounded-full px-7"
        >
          Back
        </Button>
      </div>
    </div>
  );
}

/* ============================== UI helpers ============================== */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {subtitle && (
        <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
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

function Steps({ current }: { current: Step }) {
  const steps: Step[] = ["content", "specs", "review"];
  const labels: Record<Step, string> = {
    content: "Content",
    specs: "Specs",
    review: "Review",
  };
  const idx = steps.indexOf(current);
  return (
    <div className="hidden sm:flex items-center gap-2 text-sm">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-full font-semibold text-xs",
              i <= idx
                ? "bg-parkwell-blue text-white"
                : "bg-muted text-muted-foreground",
            )}
          >
            {i + 1}
          </span>
          <span
            className={cn(
              "font-medium",
              i === idx ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {labels[s]}
          </span>
          {i < steps.length - 1 && <span className="w-6 h-px bg-border mx-1" />}
        </div>
      ))}
    </div>
  );
}

/* ============================== Helpers ============================== */

function initFieldValues(template: SignTemplate): FieldValues {
  const v: FieldValues = {};
  for (const f of template.editableFields) {
    if (f.type === "rate-table")
      // Prefer the field's own defaultRows so each template can ship its own
      // canonical starting grid (Sign #3 weekday/weeknight, Sign #4 prices).
      v[f.id] = f.defaultRows ?? DEFAULT_RATE_ROWS;
    else if (f.type === "list")
      v[f.id] = Array.isArray(f.placeholder)
        ? [...(f.placeholder as string[])]
        : [];
    else if (f.type === "arrow-direction")
      // Arrow direction has no "empty" state — default to the canonical
      // PNG direction so the chevron always renders.
      v[f.id] = typeof f.placeholder === "string" ? f.placeholder : "right";
    else v[f.id] = "";
  }
  return v;
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
