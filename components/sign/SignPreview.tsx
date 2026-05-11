"use client";

import { forwardRef, useLayoutEffect, useRef } from "react";
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
          forExport={forExport}
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
  forExport,
}: {
  field: EditableField;
  value: string | string[] | RateRow[] | undefined;
  width: number;
  height: number;
  showZones: boolean;
  forExport: boolean;
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

  /* Decide whether to render an overlay at all. Empty fields render nothing —
     the underlying PNG (which has the brand-guide canonical content) shows
     through. Only when the user has typed/uploaded do we render the overlay
     with bg fill that masks the PNG. */
  const hasValue = (() => {
    if (type === "qr-image") return typeof value === "string" && value.length > 0;
    if (type === "rate-table")
      return (
        Array.isArray(value) &&
        value.length > 0 &&
        typeof value[0] === "object"
      );
    if (type === "list")
      return (
        Array.isArray(value) &&
        (value as unknown[]).some(
          (v) => typeof v === "string" && (v as string).length > 0,
        )
      );
    return typeof value === "string" && value.length > 0;
  })();

  if (!hasValue) {
    // Show a thin outline in editor mode (showZones=true on step 1) so the
    // user knows where the editable region sits, without painting over PNG.
    return showZones && !forExport ? (
      <div
        style={{
          position: "absolute",
          ...px,
          outline: "1px dashed rgba(255,255,255,0.45)",
          outlineOffset: "-1px",
          pointerEvents: "none",
        }}
        aria-hidden
      />
    ) : null;
  }

  /* QR image — uploaded; replace the PNG placeholder with the user's image. */
  if (type === "qr-image") {
    const src = value as string;
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
          zIndex: 10,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
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
          zIndex: 10,
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
    const list = (value as string[]).filter(
      (v) => typeof v === "string" && v.length > 0,
    );
    return (
      <ListOverlay
        items={list}
        px={px}
        baseFontSize={fontSize}
        style={style}
        outline={outline}
      />
    );
  }

  /* Vertical word stack — Delineator */
  if (field.id === "directionWord") {
    const text = (value as string).toUpperCase();
    const letters = text.split("");
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
          zIndex: 10,
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

  /* Default: text / headline / body — only reached when hasValue is true. */
  const text = value as string;

  return (
    <TextOverlay
      text={text}
      px={px}
      baseFontSize={fontSize}
      style={style}
      outline={outline}
    />
  );
}

/* ----------------------- TextOverlay (shrink-to-fit) ----------------------- */

/**
 * Renders text inside a fixed bbox. The text starts at `baseFontSize` (the
 * brand-correct size for that field). After mount, we measure the content's
 * natural width/height and apply a CSS `transform: scale(...)` so it fits
 * inside the bbox, anchored to the field's alignment. No React state — we
 * mutate the element style directly inside useLayoutEffect, which runs before
 * paint, so there's no flash on each keystroke.
 */
function TextOverlay({
  text,
  px,
  baseFontSize,
  style,
  outline,
}: {
  text: string;
  px: { left: number; top: number; width: number; height: number };
  baseFontSize: number;
  style: EditableField["style"];
  outline?: string;
}) {
  const innerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    // Reset for measurement, then scale to fit. Direct mutation — no React
    // state, so no extra render cycle and no flash.
    el.style.transform = "scale(1)";
    const rect = el.getBoundingClientRect();
    const naturalW = rect.width;
    const naturalH = rect.height;
    if (naturalW > 0 && naturalH > 0) {
      const availW = px.width * 0.94;
      const availH = px.height * 0.92;
      const scale = Math.max(
        0.4,
        Math.min(1, availW / naturalW, availH / naturalH),
      );
      el.style.transform = `scale(${scale})`;
    }
    // Re-runs whenever any of these change.
  }, [text, baseFontSize, px.width, px.height, style.lineHeight, style.fontWeight]);

  const align = style.align ?? "center";
  const valign = style.valign ?? "center";

  const justifyContent =
    align === "center"
      ? "center"
      : align === "right"
        ? "flex-end"
        : "flex-start";
  const alignItems =
    valign === "top"
      ? "flex-start"
      : valign === "bottom"
        ? "flex-end"
        : "center";
  const transformOrigin =
    align === "center"
      ? "center center"
      : align === "right"
        ? "right center"
        : "left center";

  return (
    <div
      style={{
        position: "absolute",
        ...px,
        background: style.bgColor,
        display: "flex",
        alignItems,
        justifyContent,
        padding: `${px.height * 0.04}px ${px.width * 0.03}px`,
        overflow: "hidden",
        outline,
        zIndex: 10,
      }}
    >
      <div
        ref={innerRef}
        style={{
          color: style.color,
          fontFamily: "var(--font-sans)",
          fontSize: baseFontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight ?? 1.15,
          textTransform: style.transform ?? "none",
          fontStyle: style.italic ? "italic" : "normal",
          textAlign: align,
          whiteSpace: "pre",
          transformOrigin,
        }}
      >
        {text}
      </div>
    </div>
  );
}

/* ------------------------------ Helpers ------------------------------ */

/* ----------------------- ListOverlay (shrink-to-fit) ----------------------- */

/** Same shrink-to-fit treatment as TextOverlay, but for bullet lists. */
function ListOverlay({
  items,
  px,
  baseFontSize,
  style,
  outline,
}: {
  items: string[];
  px: { left: number; top: number; width: number; height: number };
  baseFontSize: number;
  style: EditableField["style"];
  outline?: string;
}) {
  const innerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    el.style.transform = "scale(1)";
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const availW = px.width * 0.94;
      const availH = px.height * 0.92;
      const scale = Math.max(
        0.4,
        Math.min(1, availW / rect.width, availH / rect.height),
      );
      el.style.transform = `scale(${scale})`;
    }
  }, [items, baseFontSize, px.width, px.height, style.lineHeight, style.fontWeight]);

  const align = style.align ?? "left";
  const valign = style.valign ?? "center";
  const justifyContent =
    align === "center"
      ? "center"
      : align === "right"
        ? "flex-end"
        : "flex-start";
  const alignItems =
    valign === "top"
      ? "flex-start"
      : valign === "bottom"
        ? "flex-end"
        : "center";
  const transformOrigin =
    align === "center"
      ? "center center"
      : align === "right"
        ? "right center"
        : "left center";

  return (
    <div
      style={{
        position: "absolute",
        ...px,
        background: style.bgColor,
        display: "flex",
        alignItems,
        justifyContent,
        padding: `${px.height * 0.04}px ${px.width * 0.03}px`,
        overflow: "hidden",
        outline,
        zIndex: 10,
      }}
    >
      <div
        ref={innerRef}
        style={{
          color: style.color,
          fontFamily: "var(--font-sans)",
          fontSize: baseFontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight ?? 1.35,
          textAlign: align,
          textTransform: style.transform ?? "none",
          fontStyle: style.italic ? "italic" : "normal",
          whiteSpace: "pre",
          transformOrigin,
          display: "inline-block",
        }}
      >
        {items.map((item, i) => (
          <div key={i} style={{ whiteSpace: "pre", lineHeight: "inherit" }}>
            <span
              aria-hidden
              style={{
                display: "inline-block",
                opacity: 0.95,
                marginRight: `${baseFontSize * 0.4}px`,
                minWidth:
                  style.bulletStyle === "1." ? `${baseFontSize * 1.1}px` : "auto",
              }}
            >
              {bulletMarker(style.bulletStyle, i)}
            </span>
            <span>{item || " "}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
