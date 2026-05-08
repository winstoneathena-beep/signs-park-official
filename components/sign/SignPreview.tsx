"use client";

import { forwardRef } from "react";
import Image from "next/image";
import type { SignTemplate, EditableField } from "@/lib/sign-templates";
import { cn } from "@/lib/utils";

export type RateRow = { label: string; sub: string; rates: string[] };

export type FieldValues = {
  [fieldId: string]: string | string[] | RateRow[];
};

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

/* ------------------------------ FieldOverlay ------------------------------ */

function FieldOverlay({
  field,
  value,
  width,
  height,
  showZones,
}: {
  field: EditableField;
  value: string | string[] | RateRow[] | undefined;
  width: number;
  height: number;
  showZones: boolean;
}) {
  const { bbox, style, type } = field;
  const px = {
    left: bbox.x * width,
    top: bbox.y * height,
    width: bbox.w * width,
    height: bbox.h * height,
  };
  const fontSize = style.fontSize * height;
  const outline = showZones ? "1px dashed rgba(255,255,255,0.6)" : undefined;

  /* QR image */
  if (type === "qr-image") {
    const src = typeof value === "string" && value.length > 0 ? value : null;
    return (
      <div
        style={{
          position: "absolute",
          ...px,
          background: style.bgColor,
          outline,
          padding: "2%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="QR code"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
            draggable={false}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px dashed rgba(10,32,46,0.25)",
              borderRadius: "6px",
              color: "rgba(10,32,46,0.55)",
              fontSize: Math.max(10, fontSize * 0.7),
              textAlign: "center",
              padding: "8%",
              fontFamily: "var(--font-sans)",
            }}
          >
            Upload QR code
          </div>
        )}
      </div>
    );
  }

  /* Rate table */
  if (type === "rate-table") {
    const rows: RateRow[] =
      Array.isArray(value) && value.length > 0 && typeof value[0] === "object"
        ? (value as RateRow[])
        : DEFAULT_RATE_ROWS;
    return (
      <div
        style={{
          position: "absolute",
          ...px,
          background: style.bgColor,
          color: style.color,
          fontFamily: "var(--font-sans)",
          outline,
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

  /* List with bullets */
  if (type === "list") {
    const items: string[] = Array.isArray(value)
      ? (value as string[]).filter((v) => typeof v === "string")
      : Array.isArray(field.placeholder)
        ? (field.placeholder as string[])
        : [];
    const list = items.length > 0 ? items : (field.placeholder as string[]);
    return (
      <div
        style={{
          position: "absolute",
          ...px,
          background: style.bgColor,
          color: style.color,
          fontFamily: "var(--font-sans)",
          fontWeight: style.fontWeight,
          fontSize,
          lineHeight: style.lineHeight ?? 1.35,
          textAlign: style.align ?? "left",
          textTransform: style.transform ?? "none",
          fontStyle: style.italic ? "italic" : "normal",
          display: "flex",
          flexDirection: "column",
          justifyContent:
            style.valign === "top"
              ? "flex-start"
              : style.valign === "bottom"
                ? "flex-end"
                : "center",
          padding: `${fontSize * 0.3}px ${fontSize * 0.5}px`,
          gap: `${fontSize * 0.25}px`,
          outline,
        }}
      >
        {list.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: `${fontSize * 0.5}px`,
              alignItems: "baseline",
              justifyContent:
                style.align === "center"
                  ? "center"
                  : style.align === "right"
                    ? "flex-end"
                    : "flex-start",
            }}
          >
            <span
              aria-hidden
              style={{
                flex: "0 0 auto",
                opacity: 0.95,
                minWidth: style.bulletStyle === "1." ? `${fontSize * 1.1}px` : "auto",
              }}
            >
              {bulletMarker(style.bulletStyle, i)}
            </span>
            <span style={{ flex: "0 1 auto" }}>{item || " "}</span>
          </div>
        ))}
      </div>
    );
  }

  /* Vertical word stack — Delineator */
  if (field.id === "directionWord") {
    const text =
      typeof value === "string" && value.length > 0
        ? value
        : (field.placeholder as string);
    const letters = text.toUpperCase().split("");
    return (
      <div
        style={{
          position: "absolute",
          ...px,
          background: style.bgColor,
          color: style.color,
          fontFamily: "var(--font-sans)",
          fontWeight: style.fontWeight,
          fontSize,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          alignItems: "center",
          padding: `${fontSize * 0.3}px 0`,
          outline,
        }}
      >
        {letters.map((l, i) => (
          <span key={i} style={{ lineHeight: 1.0 }}>
            {l}
          </span>
        ))}
      </div>
    );
  }

  /* Default: text / headline / body */
  const text =
    typeof value === "string" && value.length > 0
      ? value
      : Array.isArray(field.placeholder)
        ? (field.placeholder as string[]).join("\n")
        : (field.placeholder as string);

  return (
    <div
      style={{
        position: "absolute",
        ...px,
        background: style.bgColor,
        color: style.color,
        fontWeight: style.fontWeight,
        fontSize,
        lineHeight: style.lineHeight ?? 1.15,
        textAlign: style.align ?? "center",
        textTransform: style.transform ?? "none",
        fontStyle: style.italic ? "italic" : "normal",
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
        padding: `${fontSize * 0.2}px ${fontSize * 0.45}px`,
        whiteSpace: "pre-wrap",
        outline,
      }}
    >
      {text.split("\n").map((line, i) => (
        <span key={i}>{line || " "}</span>
      ))}
    </div>
  );
}

/* ------------------------------ Helpers ------------------------------ */

function bulletMarker(
  style: EditableField["style"]["bulletStyle"],
  index: number,
): string {
  switch (style) {
    case "1.":
      return `${index + 1}.`;
    case "–":
      return "–";
    case "none":
      return "";
    case "•":
    default:
      return "•";
  }
}

/* ------------------------------ Rate table ------------------------------ */

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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div style={{ fontWeight: 700 }}>{row.label}</div>
            {row.sub && (
              <div style={{ fontWeight: weight, opacity: 0.95 }}>{row.sub}</div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              fontWeight: weight,
            }}
          >
            {row.rates.map((r, j) => (
              <div key={j}>{r || " "}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
