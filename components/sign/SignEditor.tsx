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
} from "lucide-react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import {
  SIGN_TEMPLATES,
  TEMPLATES_BY_ID,
  type SignTemplate,
} from "@/lib/sign-templates";
import { SignPreview, DEFAULT_RATE_ROWS, type FieldValues, type RateRow } from "@/components/sign/SignPreview";
import {
  nextOrderId,
  saveOrder,
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

export function SignEditor({ initialTemplateId }: { initialTemplateId?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { session } = useSession();

  const tplFromQuery = params.get("template");
  const [templateId, setTemplateId] = useState<string>(
    initialTemplateId || tplFromQuery || SIGN_TEMPLATES[2].id, // default Standard Rate
  );
  const template = TEMPLATES_BY_ID[templateId] ?? SIGN_TEMPLATES[2];

  const [values, setValues] = useState<FieldValues>(() =>
    initFieldValues(template),
  );
  const [specs, setSpecs] = useState({
    widthIn: template.defaultDimensions.widthIn,
    heightIn: template.defaultDimensions.heightIn,
    quantity: 1,
    material: template.materials[0] ?? "Aluminium",
    notes: "",
  });
  const [location, setLocation] = useState("");
  const [step, setStep] = useState<Step>("content");
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null);

  /** Switch template + reset dependent state in one user-driven action. */
  const switchTemplate = (id: string) => {
    const next = TEMPLATES_BY_ID[id] ?? SIGN_TEMPLATES[2];
    setTemplateId(id);
    setValues(initFieldValues(next));
    setSpecs((s) => ({
      ...s,
      widthIn: next.defaultDimensions.widthIn,
      heightIn: next.defaultDimensions.heightIn,
      material: next.materials[0] ?? s.material,
    }));
  };

  const previewRef = useRef<HTMLDivElement>(null);

  // Render preview at a target export width regardless of layout width
  const exportRef = useRef<HTMLDivElement>(null);

  const downloadPng = async () => {
    const node = exportRef.current;
    if (!node) return;
    const dataUrl = await toPng(node, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: "#ffffff",
    });
    triggerDownload(dataUrl, `${template.id}-${slug(location || "sign")}.png`);
  };

  const downloadPdf = async () => {
    const node = exportRef.current;
    if (!node) return;
    const dataUrl = await toPng(node, {
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: "#ffffff",
    });
    const widthIn = specs.widthIn;
    const heightIn = specs.heightIn;
    const pdf = new jsPDF({
      orientation: widthIn > heightIn ? "landscape" : "portrait",
      unit: "in",
      format: [widthIn, heightIn],
    });
    pdf.addImage(dataUrl, "PNG", 0, 0, widthIn, heightIn);
    pdf.save(`${template.id}-${slug(location || "sign")}.pdf`);
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
      ["Dimensions", `${specs.widthIn}" W × ${specs.heightIn}" H`],
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
    const id = submittedOrderId || nextOrderId();
    const order: Order = {
      id,
      templateId: template.id,
      status,
      values,
      specs,
      location: location || `${template.name} — ${session.name}`,
      createdBy: session,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveOrder(order);
    setSubmittedOrderId(id);
    if (status !== "draft") {
      router.push(`/dashboard/orders?id=${id}`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8 pt-24 pb-20">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <Link
            href="/templates"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to library
          </Link>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">
            Create a sign
          </h1>
          <p className="mt-1 text-muted-foreground">
            Pick a template, fill the editable fields, download or submit for approval.
          </p>
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
              showZones={step === "content"}
            />
          </div>
          {/* Hidden export-grade copy at fixed pixel width for rasterization */}
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
              onNext={() => setStep("specs")}
            />
          )}
          {step === "specs" && (
            <SpecsStep
              template={template}
              specs={specs}
              location={location}
              onSpecs={setSpecs}
              onLocation={setLocation}
              onBack={() => setStep("content")}
              onNext={() => setStep("review")}
            />
          )}
          {step === "review" && (
            <ReviewStep
              template={template}
              specs={specs}
              location={location}
              onBack={() => setStep("specs")}
              onSaveDraft={() => submit("draft")}
              onSubmit={() => submit("pending")}
              onDownloadPng={downloadPng}
              onDownloadPdf={downloadPdf}
              onDownloadSpecs={downloadSpecSheet}
              submittedOrderId={submittedOrderId}
            />
          )}
        </div>
      </div>
    </div>
  );
}

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
  // Container max — preview clamps to MIN(container width, max) so it
  // never overflows on phones narrower than 460px.
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

/* ---------------------------------- Step 1: Content ---------------------------------- */

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
        <CardHeader title="1. Template" subtitle="What kind of sign are you ordering?" />
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
        <p className="mt-3 text-sm text-muted-foreground">{template.description}</p>
      </Card>

      {template.editableFields.length === 0 ? (
        <Card>
          <CardHeader
            title="2. Content"
            subtitle="This sign has no editable fields — the artwork ships as-is from the brand guide."
          />
          <div className="rounded-xl border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-parkwell-green inline mr-2" />
            Locked to brand. You only choose dimensions, material, and quantity in the next step.
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader
            title="2. Content"
            subtitle="Only the fields below are editable. Everything else is locked to brand."
          />
          <div className="space-y-5">
            {template.editableFields.map((field) => {
              if (field.type === "rate-table") {
                const rows: RateRow[] =
                  Array.isArray(values[field.id]) && (values[field.id] as RateRow[]).length
                    ? (values[field.id] as RateRow[])
                    : DEFAULT_RATE_ROWS;
                return (
                  <RateTableEditor
                    key={field.id}
                    rows={rows}
                    onChange={(next) =>
                      onValues({ ...values, [field.id]: next })
                    }
                  />
                );
              }
              const v =
                typeof values[field.id] === "string"
                  ? (values[field.id] as string)
                  : "";
              const Component = field.type === "messaging" ? Textarea : Input;
              return (
                <div key={field.id}>
                  <Label className="mb-1.5 block">
                    {field.label}
                    {field.constraints?.maxChars && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        max {field.constraints.maxChars} chars
                      </span>
                    )}
                  </Label>
                  <Component
                    value={v}
                    placeholder={field.placeholder}
                    rows={field.type === "messaging" ? 3 : undefined}
                    onChange={(e) =>
                      onValues({ ...values, [field.id]: e.target.value })
                    }
                  />
                </div>
              );
            })}
          </div>
        </Card>
      )}

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

function RateTableEditor({
  rows,
  onChange,
}: {
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
      <Label>Parking rates</Label>
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
              onChange={(e) => update(i, { ...row, label: e.target.value.toUpperCase() })}
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
                  placeholder={j === 0 ? "$10 first 2 hours" : "$5 hourly thereafter"}
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
                onClick={() =>
                  update(i, { ...row, rates: [...row.rates, ""] })
                }
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

/* ---------------------------------- Step 2: Specs ---------------------------------- */

function SpecsStep({
  template,
  specs,
  location,
  onSpecs,
  onLocation,
  onBack,
  onNext,
}: {
  template: SignTemplate;
  specs: { widthIn: number; heightIn: number; quantity: number; material: string; notes: string };
  location: string;
  onSpecs: (s: typeof specs) => void;
  onLocation: (s: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="3. Location" subtitle="Where will this sign live?" />
        <Input
          placeholder="e.g. 250 Columbine — Denver, CO"
          value={location}
          onChange={(e) => onLocation(e.target.value)}
        />
      </Card>

      <Card>
        <CardHeader title="4. Dimensions" subtitle="Print size in inches" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1.5 block">Width (in)</Label>
            <Input
              type="number"
              min={1}
              value={specs.widthIn}
              onChange={(e) => onSpecs({ ...specs, widthIn: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Height (in)</Label>
            <Input
              type="number"
              min={1}
              value={specs.heightIn}
              onChange={(e) => onSpecs({ ...specs, heightIn: Number(e.target.value) || 0 })}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Brand-guide default for {template.name}: {template.defaultDimensions.widthIn}&quot; ×{" "}
          {template.defaultDimensions.heightIn}&quot;
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

      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" className="h-12 rounded-full px-7">
          Back
        </Button>
        <Button
          onClick={onNext}
          className="h-12 rounded-full bg-parkwell-blue text-white hover:bg-parkwell-blue/90 px-8"
        >
          Review & download
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------------- Step 3: Review ---------------------------------- */

function ReviewStep({
  template,
  specs,
  location,
  onBack,
  onSaveDraft,
  onSubmit,
  onDownloadPng,
  onDownloadPdf,
  onDownloadSpecs,
  submittedOrderId,
}: {
  template: SignTemplate;
  specs: { widthIn: number; heightIn: number; quantity: number; material: string; notes: string };
  location: string;
  onBack: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onDownloadPng: () => void;
  onDownloadPdf: () => void;
  onDownloadSpecs: () => void;
  submittedOrderId: string | null;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="6. Review" subtitle="Looks good? Download or send for approval." />
        <dl className="grid grid-cols-2 gap-y-3 text-sm">
          <Row label="Template" value={`${template.number} — ${template.name}`} />
          <Row label="Location" value={location || "—"} />
          <Row label="Dimensions" value={`${specs.widthIn}" × ${specs.heightIn}"`} />
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
            "No abbreviations in editable copy",
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
            variant="outline"
            className="h-12 rounded-full border-2"
          >
            <Download className="h-4 w-4 mr-1.5" />
            PNG
          </Button>
          <Button
            onClick={onDownloadPdf}
            variant="outline"
            className="h-12 rounded-full border-2"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Print PDF
          </Button>
          <Button
            onClick={onDownloadSpecs}
            variant="outline"
            className="h-12 rounded-full border-2"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Spec sheet
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Send for approval" subtitle="Approver gets a notification with the preview and specs." />
        {submittedOrderId ? (
          <Badge className="bg-parkwell-green/15 text-parkwell-green border-parkwell-green/30">
            Submitted as {submittedOrderId}
          </Badge>
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
        <Button onClick={onBack} variant="outline" className="h-12 rounded-full px-7">
          Back
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------------- UI helpers ---------------------------------- */

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
      {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
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
          {i < steps.length - 1 && (
            <span className="w-6 h-px bg-border mx-1" />
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------- Helpers ---------------------------------- */

function initFieldValues(template: SignTemplate): FieldValues {
  const v: FieldValues = {};
  for (const f of template.editableFields) {
    if (f.type === "rate-table") v[f.id] = DEFAULT_RATE_ROWS;
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

