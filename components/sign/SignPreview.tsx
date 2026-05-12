"use client";

import { forwardRef, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import type {
  SignTemplate,
  EditableField,
  ArrowDirection,
  RateRow,
} from "@/lib/sign-templates";
import { cn } from "@/lib/utils";

const ARROW_DIRECTIONS: ArrowDirection[] = ["right", "down", "left", "up"];

function isArrowDirection(v: unknown): v is ArrowDirection {
  return typeof v === "string" && (ARROW_DIRECTIONS as string[]).includes(v);
}

export type { RateRow };

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

  /* Has the user typed/uploaded anything for this field? */
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

  /* Arrow direction — chevron arrow that the user can rotate. The bg-fill
     masks the canonical PNG chevron; an SVG chevron stack is overlaid on top,
     rotated to the user's chosen direction. Always renders (even at default)
     because the canonical chevron sits permanently in the PNG and the user
     needs to be able to flip its direction at any time. */
  if (type === "arrow-direction") {
    const dirRaw = typeof value === "string" ? value : undefined;
    const dir: ArrowDirection = isArrowDirection(dirRaw)
      ? dirRaw
      : isArrowDirection(field.placeholder)
        ? (field.placeholder as ArrowDirection)
        : "right";
    return (
      <ArrowDirectionOverlay
        direction={dir}
        px={px}
        style={style}
        outline={outline}
      />
    );
  }

  /* QR is special — the placeholder is an image baked into the PNG, not text.
     Empty = let the PNG QR show through. Uploaded = our overlay. */
  if (type === "qr-image") {
    if (!hasValue) return null;
    const src = value as string;
    const padPct = 4;
    return (
      <div
        style={{
          position: "absolute",
          ...px,
          background: style.bgColor,
          outline,
          // Pad inside the bbox so the uploaded image doesn't touch the edges.
          // Using px values keeps it consistent regardless of bbox aspect.
          padding: `${(px.height * padPct) / 100}px ${(px.width * padPct) / 100}px`,
          boxSizing: "border-box",
          overflow: "hidden",
          zIndex: 10,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="QR code"
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            // contain → preserve aspect ratio; the image scales DOWN (or up)
            // to fit the bbox no matter what dimensions the user uploaded.
            objectFit: "contain",
          }}
          draggable={false}
        />
      </div>
    );
  }

  /* Rate table — empty = let the PNG rate table show through. */
  if (type === "rate-table") {
    if (!hasValue) return null;
    const rows = value as RateRow[];
    return (
      <RateTableOverlay
        rows={rows}
        px={px}
        baseFontSize={fontSize}
        columnSplit={style.columnSplit ?? 0.43}
        style={style}
        outline={outline}
      />
    );
  }

  /* List — empty = let the PNG list show through. */
  if (type === "list") {
    if (!hasValue) return null;
    const items = (value as string[]).filter(
      (v) => typeof v === "string" && v.length > 0,
    );
    return (
      <ListOverlay
        items={items}
        px={px}
        baseFontSize={fontSize}
        style={style}
        outline={outline}
      />
    );
  }

  /* Vertical word stack — Delineator. Empty = PNG shows through.
     Uses the same shrink-to-fit pattern as TextOverlay so a long word
     ("ENTER", "EXIT", "VALET") fits no matter the bbox height. */
  if (field.id === "directionWord") {
    if (!hasValue) return null;
    const letters = (value as string).toUpperCase().split("");
    return (
      <DirectionWordOverlay
        letters={letters}
        px={px}
        baseFontSize={fontSize}
        style={style}
        outline={outline}
      />
    );
  }

  /* Default: text / headline / body. Empty = PNG shows through. */
  if (!hasValue) return null;

  const isBody = type === "body" || type === "messaging";
  return (
    <TextOverlay
      text={value as string}
      px={px}
      baseFontSize={fontSize}
      style={style}
      outline={outline}
      wrap={isBody}
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
  opacity = 1,
  wrap = false,
}: {
  text: string;
  px: { left: number; top: number; width: number; height: number };
  baseFontSize: number;
  style: EditableField["style"];
  outline?: string;
  opacity?: number;
  /** Paragraph wrap mode: pre-wrap with maxWidth so long lines reflow inside
   *  the bbox. Use for body/paragraph fields. Headlines stay nowrap (pre). */
  wrap?: boolean;
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
      // No artificial floor — letting text shrink as much as needed is the
      // only way to guarantee it stays inside the bbox for very long content
      // (Sign #12 cells, long paragraphs). Tiny text is still better than
      // text overflowing into a neighbouring cell.
      const scale = Math.min(1, availW / naturalW, availH / naturalH);
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
          // Body wraps inside the bbox (pre-wrap + maxWidth). Headlines keep
          // explicit line breaks but never split inside a word (pre, no max).
          whiteSpace: wrap ? "pre-wrap" : "pre",
          ...(wrap ? { maxWidth: px.width * 0.94 } : {}),
          transformOrigin,
          opacity,
        }}
      >
        {text}
      </div>
    </div>
  );
}

/* ------------------------------ Helpers ------------------------------ */

/* ----------------------- DirectionWordOverlay ----------------------- */
/**
 * Vertical letter stack with scale-to-fit. Each letter renders on its own
 * row. The column is measured after mount and scaled down (never up) so all
 * letters of any word — 3-letter "EXIT", 5-letter "ENTER", 8-letter "ENTRANCE"
 * — fit inside the bbox without clipping.
 */
function DirectionWordOverlay({
  letters,
  px,
  baseFontSize,
  style,
  outline,
}: {
  letters: string[];
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
      const availW = px.width * 0.9;
      const availH = px.height * 0.94;
      const scale = Math.min(1, availW / rect.width, availH / rect.height);
      el.style.transform = `scale(${scale})`;
    }
  }, [letters.join(""), baseFontSize, px.width, px.height, style.fontWeight]);

  return (
    <div
      style={{
        position: "absolute",
        ...px,
        background: style.bgColor,
        color: style.color,
        fontFamily: "var(--font-sans)",
        fontWeight: style.fontWeight,
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        outline,
        zIndex: 10,
      }}
    >
      <div
        ref={innerRef}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontSize: baseFontSize,
          lineHeight: 1.0,
          transformOrigin: "center center",
        }}
      >
        {letters.map((l, i) => (
          <span key={i} style={{ display: "block", lineHeight: 1.0 }}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ----------------------- ArrowDirectionOverlay ----------------------- */
/**
 * Brand chevron arrow that can be rotated to any of the four cardinal
 * directions. The bg-fill masks the canonical PNG chevron and an inline SVG
 * is drawn on top, rotated as a whole so the chevron always points where the
 * user chose. The chevron stack matches the brand chevron asset
 * (`public/brand/chevron-blue.svg`) — two stacked triangular wedges.
 */
function ArrowDirectionOverlay({
  direction,
  px,
  style,
  outline,
}: {
  direction: ArrowDirection;
  px: { left: number; top: number; width: number; height: number };
  style: EditableField["style"];
  outline?: string;
}) {
  // Map direction → rotation. Default "right" aligns with the canonical PNG.
  const angle = { right: 0, down: 90, left: 180, up: 270 }[direction];
  return (
    <div
      style={{
        position: "absolute",
        ...px,
        background: style.bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        outline,
        // High zIndex so it sits above the PNG chevron + above other overlays.
        zIndex: 11,
      }}
    >
      <div
        style={{
          width: "92%",
          height: "92%",
          transform: `rotate(${angle}deg)`,
          transformOrigin: "center center",
          // GPU-friendly hint — sharper rotated SVG on retina previews.
          willChange: "transform",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ChevronStackSvg color={style.color} />
      </div>
    </div>
  );
}

/**
 * Brand chevron — the literal pixels lifted from the canonical sign PNG
 * (`public/brand/chevron-pair.png`, white chevron pair on transparent bg).
 * No redrawing — direction changes are pure CSS rotation of this image, so
 * the brand asset stays 1:1 identical in every direction.
 *
 * NOTE: `color` is intentionally ignored — the PNG is pre-rendered white,
 * which is what Signs #07 and #08 require. If a future sign needs a tinted
 * chevron we can apply a CSS `mask-image` filter at that point.
 */
function ChevronStackSvg({ color: _color }: { color: string }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/brand/chevron-pair.png"
      alt=""
      draggable={false}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        display: "block",
        userSelect: "none",
      }}
    />
  );
}

/* ----------------------- ListOverlay (shrink-to-fit) ----------------------- */

/** Same shrink-to-fit treatment as TextOverlay, but for bullet lists. */
function ListOverlay({
  items,
  px,
  baseFontSize,
  style,
  outline,
  opacity = 1,
}: {
  items: string[];
  px: { left: number; top: number; width: number; height: number };
  baseFontSize: number;
  style: EditableField["style"];
  outline?: string;
  opacity?: number;
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
          // Long bullet items must wrap so the natural width stays bounded
          // (otherwise shrink-to-fit floors at 40% and items render tiny).
          whiteSpace: "normal",
          wordBreak: "break-word",
          width: px.width * 0.94,
          transformOrigin,
          opacity,
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              lineHeight: "inherit",
              display: "flex",
              alignItems: "baseline",
              gap: `${baseFontSize * 0.4}px`,
              marginBottom: `${baseFontSize * 0.15}px`,
            }}
          >
            <span
              aria-hidden
              style={{
                flex: "0 0 auto",
                opacity: 0.95,
                minWidth:
                  style.bulletStyle === "1." ? `${baseFontSize * 1.1}px` : "auto",
              }}
            >
              {bulletMarker(style.bulletStyle, i)}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>{item || " "}</span>
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

/* ----------------------- RateTableOverlay ----------------------- */
/**
 * Wraps the structured 2-column RateTable in a masked, clipped, scale-to-fit
 * container — the same treatment that keeps TextOverlay clean. Without this,
 * row content can overflow the bbox (each row's content + padding may exceed
 * the flex share of bbox height) and bleed into neighbouring fields.
 */
function RateTableOverlay({
  rows,
  px,
  baseFontSize,
  columnSplit,
  style,
  outline,
}: {
  rows: RateRow[];
  px: { left: number; top: number; width: number; height: number };
  baseFontSize: number;
  columnSplit: number;
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
      const availW = px.width * 0.96;
      const availH = px.height * 0.96;
      const scale = Math.min(1, availW / rect.width, availH / rect.height);
      el.style.transform = `scale(${scale})`;
    }
  }, [rows, baseFontSize, px.width, px.height, style.fontWeight]);

  return (
    <div
      style={{
        position: "absolute",
        ...px,
        background: style.bgColor,
        color: style.color,
        fontFamily: "var(--font-sans)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        outline,
        zIndex: 10,
      }}
    >
      <div
        ref={innerRef}
        style={{
          width: px.width,
          transformOrigin: "center center",
        }}
      >
        <RateTable
          rows={rows}
          fontSize={baseFontSize}
          columnSplit={columnSplit}
          color={style.color}
          weight={style.fontWeight}
        />
      </div>
    </div>
  );
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
  // No `height: 100%` / `flex: 1` on rows — they take natural content height.
  // The wrapping RateTableOverlay measures the resulting natural height and
  // scales the whole table down to fit the bbox if needed.
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: `${columnSplit * 100}% ${(1 - columnSplit) * 100}%`,
            padding: `${fontSize * 0.45}px 0`,
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
