"use client";

import { forwardRef } from "react";
import Image from "next/image";
import type { SignTemplate, EditableField } from "@/lib/sign-templates";
import { cn } from "@/lib/utils";

export type RateRow = { label: string; sub: string; rates: string[] };

export type FieldValues = {
  [fieldId: string]: string | RateRow[];
};

/**
 * Renders a sign template at any size.
 *
 * The base PNG (extracted from the brand guide pptx at print resolution) is
 * the visual ground truth — we never redraw the artwork. Editable fields
 * are positioned absolutely on top using normalized 0..1 bbox coordinates,
 * and font sizes scale relative to the rendered HEIGHT in px.
 */
type Props = {
  template: SignTemplate;
  values?: FieldValues;
  /** Width in px. Container height is derived from aspectRatio. */
  width?: number;
  /** Show subtle dashed outlines around editable zones (editor mode only). */
  showZones?: boolean;
  className?: string;
  /** Use plain <img> rather than next/image — required for html-to-image rasterization. */
  forExport?: boolean;
};

export const DEFAULT_RATE_ROWS: RateRow[] = [
  {
    label: "WEEKDAYS",
    sub: "5am-4pm",
    rates: ["$10 first 2 hours", "$5 hourly thereafter", "$25 maximum"],
  },
  { label: "WEEKNIGHTS", sub: "4pm-5am", rates: ["$15 flat rate"] },
  { label: "WEEKENDS", sub: "5am-5am", rates: ["$15 flat rate"] },
];

export const SignPreview = forwardRef<HTMLDivElement, Props>(function SignPreview(
  { template, values = {}, width = 480, showZones = false, className, forExport = false },
  ref,
) {
  const height = width / template.aspectRatio;

  return (
    <div
      ref={ref}
      className={cn(
        "relative bg-white shadow-2xl shadow-ink/10 overflow-hidden select-none",
        className,
      )}
      style={{ width, height }}
    >
      {forExport ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={template.sourceImage}
          alt={template.name}
          width={width}
          height={height}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
      ) : (
        <Image
          src={template.sourceImage}
          alt={template.name}
          fill
          sizes={`${Math.ceil(width)}px`}
          priority
          className="object-cover pointer-events-none"
          draggable={false}
        />
      )}

      {template.editableFields.map((field) => (
        <FieldOverlay
          key={field.id}
          field={field}
          value={values[field.id]}
          width={width}
          height={height}
          showZones={showZones}
        />
      ))}
    </div>
  );
});

function FieldOverlay({
  field,
  value,
  width,
  height,
  showZones,
}: {
  field: EditableField;
  value: string | RateRow[] | undefined;
  width: number;
  height: number;
  showZones: boolean;
}) {
  const { bbox, style } = field;
  const px = {
    left: bbox.x * width,
    top: bbox.y * height,
    width: bbox.w * width,
    height: bbox.h * height,
  };
  const fontSize = style.fontSize * height;

  const bg =
    field.id === "locationName" || field.id === "propertyName"
      ? "#FFFFFF"
      : "#19B2EC";

  if (field.type === "rate-table") {
    const rows: RateRow[] =
      Array.isArray(value) && value.length > 0 ? value : DEFAULT_RATE_ROWS;
    return (
      <div
        style={{
          position: "absolute",
          ...px,
          background: bg,
          color: style.color,
          fontFamily: "var(--font-sans)",
          outline: showZones ? "1px dashed rgba(255,255,255,0.6)" : undefined,
        }}
      >
        <RateTable
          rows={rows}
          fontSize={fontSize}
          columnSplit={style.columnSplit ?? 0.43}
          color={style.color}
          weight={style.fontWeight}
        />
      </div>
    );
  }

  const text = typeof value === "string" && value.length > 0 ? value : field.placeholder;

  return (
    <div
      style={{
        position: "absolute",
        ...px,
        background: bg,
        color: style.color,
        fontWeight: style.fontWeight,
        fontSize,
        lineHeight: style.lineHeight ?? 1.15,
        textAlign: style.align ?? "center",
        textTransform: style.transform ?? "none",
        fontFamily: "var(--font-sans)",
        display: "flex",
        flexDirection: "column",
        justifyContent:
          style.valign === "top"
            ? "flex-start"
            : style.valign === "bottom"
              ? "flex-end"
              : "center",
        alignItems:
          style.align === "left"
            ? "flex-start"
            : style.align === "right"
              ? "flex-end"
              : "center",
        padding: `${fontSize * 0.15}px ${fontSize * 0.4}px`,
        whiteSpace: "pre-wrap",
        outline: showZones ? "1px dashed rgba(0,0,0,0.4)" : undefined,
      }}
    >
      {text.split("\n").map((line, i) => (
        <span key={i}>{line || " "}</span>
      ))}
    </div>
  );
}

function RateTable({
  rows,
  fontSize,
  columnSplit,
  color,
  weight,
}: {
  rows: RateRow[];
  fontSize: number;
  columnSplit: number;
  color: string;
  weight: number;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: `${columnSplit * 100}% ${(1 - columnSplit) * 100}%`,
            padding: `${fontSize * 0.5}px 0`,
            borderTop: i > 0 ? "1px solid rgba(255,255,255,0.65)" : undefined,
            color,
            fontFamily: "var(--font-sans)",
            fontSize,
            lineHeight: 1.15,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontWeight: 700 }}>{row.label}</div>
            {row.sub && (
              <div style={{ fontWeight: weight, opacity: 0.95 }}>{row.sub}</div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", fontWeight: weight }}>
            {row.rates.map((r, j) => (
              <div key={j}>{r || " "}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
