/**
 * Single source of truth for the 12 Parkwell sign templates.
 *
 * v2 changes vs v1:
 * - Every sign has editable fields (v1 only had three).
 * - New field types: headline, body, list (bullets), qr-image.
 * - Each field carries its own bgColor so the renderer doesn't infer.
 * - Each template ships a `sizes` array — square signs get square options,
 *   non-square signs get a fixed dropdown that preserves the aspect ratio.
 *
 * Coordinate system: bbox.x/y/w/h are normalized 0..1 fractions of the source
 * image dimensions. Top-left origin. fontSize is a fraction of sign HEIGHT.
 */

export type FieldType =
  | "text"
  | "headline"
  | "body"
  | "list"
  | "rate-table"
  | "qr-image"
  | "arrow-direction"
  | "location-name" // v1 alias — same as headline
  | "messaging"; // v1 alias — same as body

export type ArrowDirection = "right" | "down" | "left" | "up";

/** Single row in a rate-table field. Left column = label (bold) + sub; right column = rates list. */
export type RateRow = { label: string; sub: string; rates: string[] };

export type EditableField = {
  id: string;
  label: string;
  type: FieldType;
  /** Normalized bbox (0..1, top-left origin). */
  bbox: { x: number; y: number; w: number; h: number };
  /** Default value displayed until the user edits. Strings for text/headline/body, string[] for list. */
  placeholder: string | string[];
  /** rate-table only: starting rows shown until the user edits (overrides the global default). */
  defaultRows?: RateRow[];
  style: {
    color: string;
    /** Background fill that masks the underlying placeholder pixels. */
    bgColor: string;
    fontWeight: 400 | 500 | 600 | 700 | 800;
    /** Font size as a fraction of sign HEIGHT. */
    fontSize: number;
    align?: "left" | "center" | "right";
    valign?: "top" | "center" | "bottom";
    lineHeight?: number;
    transform?: "uppercase" | "none";
    /** Rate-table only: column split (0..1). */
    columnSplit?: number;
    /** List only: bullet style. */
    bulletStyle?: "•" | "–" | "1." | "none";
    /** Italic for footnotes etc. */
    italic?: boolean;
  };
  constraints?: { maxChars?: number; maxRows?: number; maxItems?: number };
};

export type SignCategory =
  | "scan-to-pay"
  | "rate-sign"
  | "directional"
  | "reserved"
  | "informational";

export type SignSize = { widthIn: number; heightIn: number; label?: string };

export type SignTemplate = {
  id: string;
  number: string;
  name: string;
  description: string;
  category: SignCategory;
  sourceImage: string;
  /** Aspect ratio (w / h) — matches source PNG. */
  aspectRatio: number;
  /** Common physical dimensions offered. First is default. */
  sizes: SignSize[];
  /** Materials this sign can be ordered in. */
  materials: string[];
  /** Editable fields. v2: every template has at least one. */
  editableFields: EditableField[];
  rationale?: string;
};

/* ------------------------------------------------------------------------- */
/* Common color palette (used in field bgColor)                              */
/* ------------------------------------------------------------------------- */

const C = {
  blue: "#19B2EC",
  ink: "#0A202E",
  white: "#FFFFFF",
  red: "#EB5466",
  yellow: "#D9CA23",
  green: "#2EB298",
} as const;

/* ------------------------------------------------------------------------- */
/* Standard size sets                                                        */
/* ------------------------------------------------------------------------- */

const sizeSet = (defaults: SignSize, multipliers: number[]): SignSize[] =>
  multipliers.map((m) => {
    const w = Math.round(defaults.widthIn * m);
    const h = Math.round(defaults.heightIn * m);
    return { widthIn: w, heightIn: h, label: `${w}" × ${h}"` };
  });

/** Square sizes with the given side lengths (in inches). */
const squareSizes = (sides: number[]): SignSize[] =>
  sides.map((s) => ({ widthIn: s, heightIn: s, label: `${s}" × ${s}"` }));

/* ------------------------------------------------------------------------- */
/* Sign #1 — Scan to Pay Standard                                            */
/* ------------------------------------------------------------------------- */

const SIGN_01: SignTemplate = {
  id: "scan-to-pay-standard",
  number: "01",
  name: "Scan to Pay — Standard",
  description:
    "Primary payment sign. Large QR code, clear scan-to-pay call to action, the no-app-needed promise.",
  category: "scan-to-pay",
  sourceImage: "/sign-templates/01-scan-to-pay-standard.png",
  aspectRatio: 2880 / 4320,
  sizes: sizeSet({ widthIn: 18, heightIn: 27 }, [
    0.67, 0.89, 1.0, 1.33, 1.67, 2.0, 2.22, 2.67, 3.33,
  ]),
  materials: ["Vinyl", "Coroplast", "Aluminium", "Dibond", "PVC"],
  editableFields: [
    // Sign #1 is QR-only: PAY HERE headline, SCAN TO PAY caption, and the
    // no-app-needed message are all canonical and locked. The user only
    // uploads a QR code; everything else is baked into the PNG.
    {
      id: "qrCode",
      label: "QR code",
      type: "qr-image",
      // Square in pixel space (1595×1595 of 2880×4320). Pixel-scan found:
      //   white card     x=0.202..0.798, y=0.211..0.580 (1715×1595)
      //   QR pattern     x=0.226..0.774, y=0.226..0.565 (≈1577×1465)
      // bbox = white card height (1595) squared, centered on the card so
      // a square QR upload replaces the canonical pattern cleanly while
      // leaving the white card edges and the "SCAN TO PAY" label below it
      // visible (label sits at y≈0.65 inside the dark outer frame).
      bbox: { x: 0.223, y: 0.211, w: 0.554, h: 0.369 },
      placeholder: "",
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 400,
        fontSize: 0.02,
      },
    },
  ],
};

/* ------------------------------------------------------------------------- */
/* Sign #2 — Scan to Pay Validation                                          */
/* ------------------------------------------------------------------------- */

const SIGN_02: SignTemplate = {
  id: "scan-to-pay-validation",
  number: "02",
  name: "Scan to Pay — Validation",
  description:
    "For environments with frequent validated parkers (hotels, office tenants). Numbered steps + validation footnote.",
  category: "scan-to-pay",
  sourceImage: "/sign-templates/02-scan-to-pay-validation.png",
  aspectRatio: 3600 / 2400,
  sizes: sizeSet({ widthIn: 24, heightIn: 16 }, [
    0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 3.0,
  ]),
  materials: ["Vinyl", "Coroplast", "Aluminium", "Dibond", "PVC"],
  editableFields: [
    // Sign #2 is QR-only: PAY HERE headline, SCAN TO PAY caption, numbered
    // steps, and validation footnote are all canonical and locked. The user
    // only uploads a QR code; everything else is baked into the PNG.
    {
      id: "qrCode",
      label: "QR code",
      type: "qr-image",
      // Square-in-pixel-space (738×738 of 3600×2400). Pixel-scan found:
      //   white card     x=0.059..0.330, y=0.323..0.624
      //   QR pattern     x=0.068..0.262, y=0.335..0.612 (≈698×664)
      // The bbox covers the QR pattern with a tight margin so a square QR
      // upload (white-bg, black squares) replaces canonical pixels cleanly
      // while leaving the white card frame and "SCAN TO PAY" label visible.
      bbox: { x: 0.0625, y: 0.3275, w: 0.205, h: 0.3075 },
      placeholder: "",
      style: { color: C.ink, bgColor: C.white, fontWeight: 400, fontSize: 0.02 },
    },
  ],
};

/* ------------------------------------------------------------------------- */
/* Sign #3 — Standard Rate Sign                                              */
/* ------------------------------------------------------------------------- */

const SIGN_03: SignTemplate = {
  id: "standard-rate",
  number: "03",
  name: "Standard Rate Sign",
  description:
    "Primary entrance rate sign. Welcome banner, full rate breakdown, and additional messaging.",
  category: "rate-sign",
  sourceImage: "/sign-templates/03-standard-rate.png",
  aspectRatio: 3360 / 5280,
  sizes: sizeSet({ widthIn: 24, heightIn: 36 }, [
    0.5, 0.67, 0.83, 1.0, 1.17, 1.33, 1.5, 1.67, 2.0,
  ]),
  materials: ["Vinyl", "Coroplast", "Aluminium", "Dibond", "PVC"],
  editableFields: [
    {
      id: "locationName",
      label: "Location name",
      type: "headline",
      // PNG white "WELCOME TO LOCATION NAME" band: cover the full band.
      bbox: { x: 0.04, y: 0.015, w: 0.92, h: 0.16 },
      placeholder: "WELCOME TO\nLOCATION NAME",
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 700,
        fontSize: 0.044,
        align: "center",
        valign: "center",
        lineHeight: 1.05,
        transform: "uppercase",
      },
      constraints: { maxChars: 28, maxRows: 2 },
    },
    {
      id: "rateTitle",
      label: "Rate section title",
      type: "headline",
      // PNG green "PARKING RATES" strip.
      bbox: { x: 0.04, y: 0.175, w: 0.92, h: 0.095 },
      placeholder: "PARKING RATES",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 700,
        fontSize: 0.042,
        align: "center",
        valign: "center",
        transform: "uppercase",
      },
      constraints: { maxChars: 22, maxRows: 1 },
    },
    {
      id: "rateTable",
      label: "Parking rates",
      type: "rate-table",
      // Cover the full 3-row rate table area.
      bbox: { x: 0.04, y: 0.278, w: 0.92, h: 0.39 },
      placeholder: "",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 400,
        fontSize: 0.027,
        align: "left",
        valign: "top",
        lineHeight: 1.25,
        columnSplit: 0.43,
      },
      constraints: { maxRows: 6 },
    },
    {
      id: "additional",
      label: "Additional messaging",
      type: "body",
      // PNG 3-line additional messaging block.
      bbox: { x: 0.05, y: 0.68, w: 0.9, h: 0.15 },
      placeholder:
        "$35 lost ticket fee.\nNew day starts at 5am.\nEvent rates may apply.",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 400,
        fontSize: 0.025,
        align: "center",
        valign: "top",
        lineHeight: 1.35,
      },
      constraints: { maxRows: 4 },
    },
  ],
  rationale:
    "Welcome and PARKING RATES top priority. Largest numbers for pricing. Plain language: 'hours' not 'hrs'.",
};

/* ------------------------------------------------------------------------- */
/* Sign #4 — Valet Podium Rate Sign                                          */
/* ------------------------------------------------------------------------- */

const SIGN_04: SignTemplate = {
  id: "valet-podium-rate",
  number: "04",
  name: "Valet Podium Rate Sign",
  description:
    "Property name in the dark header, tiered rates below, and a validated-rate panel.",
  category: "rate-sign",
  sourceImage: "/sign-templates/04-valet-podium-rate.png",
  aspectRatio: 2880 / 3840,
  sizes: sizeSet({ widthIn: 18, heightIn: 24 }, [
    0.67, 0.83, 1.0, 1.17, 1.33, 1.5, 1.67, 2.0, 2.5,
  ]),
  materials: ["Coroplast", "Aluminium", "Dibond", "PVC"],
  editableFields: [
    {
      id: "propertyName",
      label: "Property name",
      type: "headline",
      // Top half of the white property header band.
      bbox: { x: 0.03, y: 0.03, w: 0.94, h: 0.105 },
      placeholder: "PROPERTY",
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 700,
        fontSize: 0.06,
        align: "center",
        valign: "center",
        transform: "uppercase",
      },
      constraints: { maxChars: 16, maxRows: 1 },
    },
    {
      id: "propertySubtitle",
      label: "Property subtitle",
      type: "text",
      // Lower half of the white property header band where "DENVER" / city sits.
      bbox: { x: 0.03, y: 0.135, w: 0.94, h: 0.05 },
      placeholder: "CITY",
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 500,
        fontSize: 0.022,
        align: "center",
        valign: "center",
        transform: "uppercase",
      },
      constraints: { maxChars: 24, maxRows: 1 },
    },
    {
      id: "rateTitle",
      label: "Rate section title",
      type: "headline",
      // PNG "VALET PARKING RATES" strip — give it a comfortable band.
      bbox: { x: 0.03, y: 0.198, w: 0.94, h: 0.105 },
      placeholder: "VALET PARKING RATES",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 700,
        fontSize: 0.044,
        align: "center",
        valign: "center",
        transform: "uppercase",
      },
      constraints: { maxChars: 24 },
    },
    {
      id: "valetRates",
      label: "Valet rates",
      // Structured 2-column grid — same renderer as Sign #3's rate table so
      // user-typed prices and durations stay aligned to the canonical layout.
      // label = price (left col, bold), rates[0] = duration (right col).
      type: "rate-table",
      bbox: { x: 0.05, y: 0.305, w: 0.9, h: 0.235 },
      placeholder: "",
      defaultRows: [
        { label: "$20", sub: "", rates: ["0-4 hour"] },
        { label: "$32", sub: "", rates: ["4-8 hours"] },
        { label: "$53", sub: "", rates: ["8+ hours"] },
        { label: "$53", sub: "", rates: ["Overnight"] },
      ],
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 700,
        fontSize: 0.038,
        align: "left",
        valign: "center",
        lineHeight: 1.2,
        // Narrow price column on the left.
        columnSplit: 0.22,
      },
      constraints: { maxRows: 6 },
    },
    // The validated section is enclosed in a white-stroke frame in the canonical
    // PNG (top y≈0.542, bottom y≈0.777, left x≈0.069, right x≈0.93). Every
    // field below sits STRICTLY INSIDE that frame so the bg-fill never paints
    // over the white frame outline. Price + duration and the two locations
    // are split into separate left/right fields so they can be edited cell-by-
    // cell, matching the canonical 2-column layout.
    {
      id: "validatedTitle",
      label: "Validated header",
      type: "headline",
      bbox: { x: 0.10, y: 0.560, w: 0.80, h: 0.055 },
      placeholder: "VALIDATED RATE",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 700,
        fontSize: 0.033,
        align: "center",
        valign: "center",
        transform: "uppercase",
      },
      constraints: { maxChars: 22 },
    },
    {
      id: "validatedRatePrice",
      label: "Validated price",
      type: "text",
      bbox: { x: 0.10, y: 0.620, w: 0.36, h: 0.055 },
      placeholder: "$12",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 700,
        fontSize: 0.036,
        align: "left",
        valign: "center",
      },
      constraints: { maxChars: 8 },
    },
    {
      id: "validatedRateDuration",
      label: "Validated duration",
      type: "text",
      bbox: { x: 0.50, y: 0.620, w: 0.40, h: 0.055 },
      placeholder: "0-4 hours",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 400,
        fontSize: 0.030,
        align: "left",
        valign: "center",
      },
      constraints: { maxChars: 18 },
    },
    {
      id: "validatedLocationLeft",
      label: "Validated location (left)",
      type: "text",
      bbox: { x: 0.10, y: 0.685, w: 0.40, h: 0.060 },
      placeholder: "• Tavernetta",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 400,
        fontSize: 0.028,
        align: "left",
        valign: "center",
      },
      constraints: { maxChars: 24 },
    },
    {
      id: "validatedLocationRight",
      label: "Validated location (right)",
      type: "text",
      bbox: { x: 0.50, y: 0.685, w: 0.40, h: 0.060 },
      placeholder: "• Sunday Vinyl",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 400,
        fontSize: 0.028,
        align: "left",
        valign: "center",
      },
      constraints: { maxChars: 24 },
    },
  ],
};

/* ------------------------------------------------------------------------- */
/* Sign #5 — Marquee with Rates (square)                                     */
/* ------------------------------------------------------------------------- */

const SIGN_05: SignTemplate = {
  id: "marquee-rates",
  number: "05",
  name: "Marquee with Rates",
  description:
    "Large entrance/marquee sign. PUBLIC PARKING headline, P-mark, rate strip in the Ink wave footer.",
  category: "rate-sign",
  sourceImage: "/sign-templates/05-marquee-rates.png",
  aspectRatio: 1,
  sizes: squareSizes([24, 30, 36, 42, 48, 54, 60, 72, 84, 96]),
  materials: ["Aluminium", "Dibond"],
  editableFields: [
    {
      id: "headline",
      label: "Headline (right of P-mark)",
      type: "headline",
      // PNG "PUBLIC PARKING" — cover the full 2-line block height.
      // Left edge starts after the P-mark right edge (canonical x≈0.35) so
      // the bg-fill never paints over the logo.
      // valign="top" pins the headline's top edge to the bbox top so user-typed
      // content (1 line or 2 lines) always starts at the same Y position as
      // canonical "PUBLIC" — short replacements don't shift up.
      bbox: { x: 0.37, y: 0.16, w: 0.6, h: 0.30 },
      placeholder: "PUBLIC\nPARKING",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 800,
        fontSize: 0.13,
        align: "left",
        valign: "top",
        transform: "uppercase",
        lineHeight: 1.0,
      },
      constraints: { maxChars: 18, maxRows: 2 },
    },
    // Rate strip — canonical Ink strip has thin top + bottom horizontal lines
    // bracketing the content (no vertical divider). Bboxes sit STRICTLY
    // INSIDE those lines (y: 0.84..0.95) so the open-frame stays intact when
    // user values overlay. Price cells right-aligned, duration cells use
    // body type so long text wraps to 2 lines like canonical.
    {
      id: "rateLeftPrice",
      label: "Left rate — price",
      type: "text",
      bbox: { x: 0.03, y: 0.84, w: 0.22, h: 0.11 },
      placeholder: "$10",
      style: {
        color: C.white,
        bgColor: C.ink,
        fontWeight: 800,
        fontSize: 0.08,
        align: "right",
        valign: "center",
        lineHeight: 1.0,
      },
      constraints: { maxChars: 6 },
    },
    {
      id: "rateLeftDuration",
      label: "Left rate — duration",
      type: "body",
      bbox: { x: 0.25, y: 0.84, w: 0.24, h: 0.11 },
      placeholder: "Per Day",
      style: {
        color: C.white,
        bgColor: C.ink,
        fontWeight: 500,
        fontSize: 0.036,
        align: "left",
        valign: "center",
        lineHeight: 1.1,
      },
      constraints: { maxChars: 20, maxRows: 2 },
    },
    {
      id: "rateRightPrice",
      label: "Right rate — price",
      type: "text",
      bbox: { x: 0.50, y: 0.84, w: 0.22, h: 0.11 },
      placeholder: "$5",
      style: {
        color: C.white,
        bgColor: C.ink,
        fontWeight: 800,
        fontSize: 0.08,
        align: "right",
        valign: "center",
        lineHeight: 1.0,
      },
      constraints: { maxChars: 6 },
    },
    {
      id: "rateRightDuration",
      label: "Right rate — duration",
      type: "body",
      bbox: { x: 0.72, y: 0.84, w: 0.25, h: 0.11 },
      placeholder: "Nights & Weekends",
      style: {
        color: C.white,
        bgColor: C.ink,
        fontWeight: 500,
        fontSize: 0.036,
        align: "left",
        valign: "center",
        lineHeight: 1.1,
      },
      constraints: { maxChars: 24, maxRows: 2 },
    },
  ],
};

/* ------------------------------------------------------------------------- */
/* Sign #5b — Marquee, no rates (Public Parking only)                        */
/* ------------------------------------------------------------------------- */

const SIGN_05B: SignTemplate = {
  id: "marquee-no-rates",
  number: "05b",
  name: "Marquee — Public Parking",
  description:
    "Square marquee variant without the rate strip. Same P-mark and headline as #5, for lots where rates aren't shown on the marquee.",
  category: "rate-sign",
  sourceImage: "/sign-templates/05b-marquee-no-rates.png",
  aspectRatio: 1,
  sizes: squareSizes([24, 30, 36, 42, 48, 54, 60, 72, 84, 96]),
  materials: ["Aluminium", "Dibond"],
  editableFields: [
    {
      id: "headline",
      label: "Headline (right of P-mark)",
      type: "headline",
      // PNG "PUBLIC PARKING" (cropped from #5, shifted down on the 5b canvas).
      // Bbox left edge starts AFTER the P-mark right edge (measured x=0.350)
      // and valign="top" pins typed content to the same line as canonical
      // "PUBLIC" so short replacements don't drift up.
      bbox: { x: 0.37, y: 0.39, w: 0.6, h: 0.25 },
      placeholder: "PUBLIC\nPARKING",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 800,
        fontSize: 0.13,
        align: "left",
        valign: "top",
        transform: "uppercase",
        lineHeight: 1.0,
      },
      constraints: { maxChars: 18, maxRows: 2 },
    },
  ],
  rationale:
    "Cropped from #5 above the rate strip and squared with parkwell-blue padding. No stretching of brand elements.",
};

/* ------------------------------------------------------------------------- */
/* Sign #6 — Promotional Rate Windmaster                                     */
/* ------------------------------------------------------------------------- */

const SIGN_06: SignTemplate = {
  id: "promotional-rate-windmaster",
  number: "06",
  name: "Promotional Rate Windmaster",
  description:
    "Event/promo signage with a single oversized price. Drop-in for event days.",
  category: "rate-sign",
  sourceImage: "/sign-templates/06-promotional-rate-windmaster.png",
  aspectRatio: 3360 / 5280,
  sizes: sizeSet({ widthIn: 24, heightIn: 36 }, [
    0.5, 0.67, 0.83, 1.0, 1.17, 1.33, 1.5, 1.67, 2.0,
  ]),
  materials: ["Coroplast", "PVC"],
  editableFields: [
    {
      id: "headline",
      label: "Headline",
      type: "headline",
      // PNG "EVENT PARKING" sits next to the P-mark (right edge x=0.337).
      // Canonical 2-line block: "EVENT" cap-line y=0.106, "PARKING" baseline
      // y=0.237. Bbox covers that full vertical extent and `valign:"center"`
      // anchors typed content to the same visual center — single-line or
      // double-line replacements both sit in the same band as canonical.
      bbox: { x: 0.36, y: 0.10, w: 0.60, h: 0.14 },
      placeholder: "EVENT\nPARKING",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 800,
        fontSize: 0.07,
        align: "left",
        valign: "center",
        transform: "uppercase",
        lineHeight: 1.0,
      },
      constraints: { maxChars: 18, maxRows: 2 },
    },
    {
      id: "price",
      label: "Headline price",
      type: "headline",
      // The oversized "$10" PNG numeral block.
      bbox: { x: 0.05, y: 0.295, w: 0.9, h: 0.35 },
      placeholder: "$10",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 800,
        fontSize: 0.22,
        align: "center",
        valign: "center",
        lineHeight: 1.0,
      },
      constraints: { maxChars: 6, maxRows: 1 },
    },
    {
      id: "additional",
      label: "Additional messaging",
      type: "body",
      // PNG "Additional / Messaging" block — 2 canonical lines, cap-line
      // y=0.663, baseline y=0.741. Bbox padded by 0.01 above and 0.015
      // below to fully mask the canonical caps + the "g" descenders so the
      // placeholder never peeks through behind typed content.
      bbox: { x: 0.05, y: 0.653, w: 0.9, h: 0.103 },
      placeholder: "Additional Messaging",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 700,
        fontSize: 0.034,
        align: "center",
        valign: "center",
        lineHeight: 1.3,
      },
      constraints: { maxRows: 3 },
    },
  ],
};

/* ------------------------------------------------------------------------- */
/* Sign #7 — Directional Windmaster                                          */
/* ------------------------------------------------------------------------- */

const SIGN_07: SignTemplate = {
  id: "directional-windmaster",
  number: "07",
  name: "Directional Windmaster",
  description:
    "Wayfinding sign with welcome banner and a chevron arrow pointing to the lot.",
  category: "directional",
  sourceImage: "/sign-templates/07-directional-windmaster.png",
  aspectRatio: 3360 / 5280,
  sizes: sizeSet({ widthIn: 24, heightIn: 36 }, [
    0.5, 0.67, 0.83, 1.0, 1.17, 1.33, 1.5, 1.67, 2.0,
  ]),
  materials: ["Coroplast", "PVC"],
  editableFields: [
    {
      id: "locationName",
      label: "Welcome banner",
      type: "headline",
      // PNG white welcome banner — give it the full top white band.
      bbox: { x: 0.04, y: 0.015, w: 0.92, h: 0.205 },
      placeholder: "WELCOME TO\nLOCATION NAME",
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 700,
        fontSize: 0.05,
        align: "center",
        valign: "center",
        transform: "uppercase",
        lineHeight: 1.05,
      },
      constraints: { maxChars: 28, maxRows: 2 },
    },
    {
      id: "arrowDirection",
      label: "Arrow direction",
      type: "arrow-direction",
      // Square-in-pixel-space bbox covering the canonical chevron region
      // (canonical: x≈0.344..0.661, y≈0.512..0.702 — ~1064×1003px).
      // Slightly oversized so rotations to up/down don't reveal canonical edges.
      bbox: { x: 0.30, y: 0.485, w: 0.40, h: 0.255 },
      placeholder: "right",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 700,
        fontSize: 0,
      },
    },
    {
      id: "directionLabel",
      label: "Direction label",
      type: "headline",
      // PNG "PUBLIC PARKING" — top edge raised to fully cover the cap-line of
      // "PUBLIC" so the canonical letters don't peek above the overlay.
      bbox: { x: 0.04, y: 0.215, w: 0.92, h: 0.305 },
      placeholder: "PUBLIC\nPARKING",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 800,
        fontSize: 0.11,
        align: "center",
        valign: "center",
        transform: "uppercase",
        lineHeight: 1.0,
      },
      constraints: { maxChars: 18, maxRows: 2 },
    },
  ],
};

/* ------------------------------------------------------------------------- */
/* Sign #8 — Delineator (very tall narrow)                                   */
/* ------------------------------------------------------------------------- */

const SIGN_08: SignTemplate = {
  id: "delineator",
  number: "08",
  name: "Delineator Sign",
  description:
    "Tall narrow lane-side sign. Chevron above, vertical word stack on Parkwell Blue.",
  category: "directional",
  sourceImage: "/sign-templates/08-delineator.png",
  aspectRatio: 960 / 3000,
  sizes: sizeSet({ widthIn: 6, heightIn: 18 }, [
    0.67, 1.0, 1.33, 1.67, 2.0, 2.33, 2.67, 3.0, 4.0,
  ]),
  materials: ["Aluminium"],
  editableFields: [
    {
      id: "arrowDirection",
      label: "Arrow direction",
      type: "arrow-direction",
      // Canonical chevron at top of sign: x≈0.31..0.73, y≈0.03..0.17.
      // Square-in-pixel-space bbox (480×510px) for clean rotation.
      bbox: { x: 0.25, y: 0.02, w: 0.5, h: 0.17 },
      placeholder: "right",
      style: {
        color: C.white,
        bgColor: C.ink,
        fontWeight: 700,
        fontSize: 0,
      },
    },
    {
      id: "directionWord",
      label: "Vertical direction word",
      type: "text",
      // The PNG has the canonical "ENTER" letters painted out (cleaned to
      // parkwell-blue) so this bbox can sit cleanly inside the blue panel
      // without touching the wave above.
      bbox: { x: 0.05, y: 0.30, w: 0.9, h: 0.65 },
      placeholder: "ENTER",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 800,
        fontSize: 0.085,
        align: "center",
        valign: "center",
        transform: "uppercase",
        lineHeight: 1.05,
      },
      constraints: { maxChars: 8, maxRows: 1 },
    },
  ],
  rationale:
    "Each letter renders on its own row vertically — the renderer splits the word automatically.",
};

/* ------------------------------------------------------------------------- */
/* Sign #9a/b/c — Reserved variants (square)                                 */
/* ------------------------------------------------------------------------- */

const RESERVED_SIZES = squareSizes([12, 18, 24, 30, 36, 42, 48]);

const SIGN_09A: SignTemplate = {
  id: "reserved-24-7",
  number: "09a",
  name: "Reserved Parking 24/7",
  description: "Standard reserved-spot sign. Bold three-line headline + small violator notice.",
  category: "reserved",
  sourceImage: "/sign-templates/09a-reserved-24-7.png",
  aspectRatio: 1,
  sizes: RESERVED_SIZES,
  materials: ["Aluminium", "Coroplast"],
  editableFields: [
    {
      id: "headline",
      label: "Headline (3 lines)",
      type: "headline",
      // 3-line headline block — cover generously.
      bbox: { x: 0.03, y: 0.04, w: 0.94, h: 0.55 },
      placeholder: "RESERVED\nPARKING\n24/7",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 800,
        fontSize: 0.13,
        align: "center",
        valign: "center",
        transform: "uppercase",
        lineHeight: 1.05,
      },
      constraints: { maxChars: 30, maxRows: 4 },
    },
    {
      id: "violatorNotice",
      label: "Violator notice",
      type: "body",
      // Top edge raised to fully cover the canonical "Violators will be cited"
      // first-line cap-height; bottom stays clear of the wave footer.
      bbox: { x: 0.04, y: 0.565, w: 0.92, h: 0.17 },
      placeholder:
        "Violators will be cited and/or towed at vehicle owner's expense",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 400,
        fontSize: 0.04,
        align: "center",
        valign: "center",
        lineHeight: 1.3,
      },
      constraints: { maxRows: 3 },
    },
  ],
};

const SIGN_09B: SignTemplate = {
  ...SIGN_09A,
  id: "no-hotel-parking",
  number: "09b",
  name: "No Hotel Parking 24/7",
  description: "Variant for tenant lots that exclude hotel guests.",
  sourceImage: "/sign-templates/09b-no-hotel-parking.png",
  editableFields: [
    {
      ...SIGN_09A.editableFields[0],
      placeholder: "NO HOTEL\nPARKING\n24/7",
    },
    SIGN_09A.editableFields[1],
  ],
};

const SIGN_09C: SignTemplate = {
  id: "attention-tenants",
  number: "09c",
  name: "Attention — Tenants Only",
  description: "Soft-warning variant for tenant/visitor-only lots.",
  category: "reserved",
  sourceImage: "/sign-templates/09c-attention-tenants.png",
  aspectRatio: 1,
  sizes: RESERVED_SIZES,
  materials: ["Aluminium", "Coroplast"],
  editableFields: [
    {
      id: "headline",
      label: "Headline",
      type: "headline",
      bbox: { x: 0.03, y: 0.04, w: 0.94, h: 0.22 },
      placeholder: "ATTENTION:",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 800,
        fontSize: 0.13,
        align: "center",
        valign: "center",
        transform: "uppercase",
      },
      constraints: { maxChars: 16, maxRows: 1 },
    },
    {
      id: "body",
      label: "Body message",
      type: "body",
      bbox: { x: 0.03, y: 0.25, w: 0.94, h: 0.24 },
      placeholder: "Parking for tenants and\ntenant visitors only",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 500,
        fontSize: 0.06,
        align: "center",
        valign: "center",
        lineHeight: 1.2,
      },
      constraints: { maxRows: 3 },
    },
    {
      id: "violatorNotice",
      label: "Violator notice",
      type: "body",
      bbox: { x: 0.04, y: 0.55, w: 0.92, h: 0.135 },
      placeholder:
        "Violators will be cited and/or towed at vehicle owner's expense",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 400,
        fontSize: 0.04,
        align: "center",
        valign: "center",
        lineHeight: 1.3,
      },
      constraints: { maxRows: 3 },
    },
  ],
};

/* ------------------------------------------------------------------------- */
/* Sign #10 — Limit of Liability                                             */
/* ------------------------------------------------------------------------- */

const SIGN_10: SignTemplate = {
  id: "limit-of-liability",
  number: "10",
  name: "Limit of Liability & Facility Rules",
  description:
    "Required legal notice. Dark header with the P-mark, full liability copy and facility rules below.",
  category: "informational",
  sourceImage: "/sign-templates/10-limit-of-liability.png",
  aspectRatio: 2160 / 2880,
  sizes: sizeSet({ widthIn: 18, heightIn: 24 }, [
    0.67, 0.83, 1.0, 1.17, 1.33, 1.5, 1.67, 2.0,
  ]),
  materials: ["Aluminium", "Dibond"],
  editableFields: [
    // Title ("LIMIT OF LIABILITY & FACILITY RULES") and the liability
    // paragraph are LOCKED — they're legal-required content baked into the
    // PNG and must not change between locations. Only the facility-rules
    // bullet list is editable.
    {
      id: "facilityRules",
      label: "Facility rules (bullets)",
      type: "list",
      bbox: { x: 0.04, y: 0.50, w: 0.92, h: 0.48 },
      placeholder: [
        "Skateboarding, rollerblading, bicycle riding or similar activities are strictly prohibited.",
        "Garage ramp is for vehicles only. Pedestrians should not walk up or down them.",
        "Consumption of alcohol or drugs on the premises is prohibited.",
        "Garage is smoke free. Smoking or vaping is prohibited.",
        "No vehicle is permitted to park over 48 hours without written permission from owner/manager.",
        "Failure to obtain permission will result in towing of vehicle at owners expense.",
        "Parking in more than one parking space is prohibited. Violators will be cited and/or towed at owners expense.",
        "Repair and maintenance and/or washing of vehicles is prohibited.",
      ],
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 400,
        fontSize: 0.022,
        align: "left",
        valign: "top",
        lineHeight: 1.4,
        bulletStyle: "•",
      },
      constraints: { maxItems: 12 },
    },
  ],
};

/* ------------------------------------------------------------------------- */
/* Sign #11 — Enforcement Warning (RED header)                               */
/* ------------------------------------------------------------------------- */

const SIGN_11: SignTemplate = {
  id: "enforcement-warning",
  number: "11",
  name: "Enforcement Warning",
  description:
    "Payment-required notice on Parkwell Red header. Reserved for high-enforcement lots.",
  category: "informational",
  sourceImage: "/sign-templates/11-enforcement-warning.png",
  aspectRatio: 2880 / 4320,
  sizes: sizeSet({ widthIn: 18, heightIn: 27 }, [
    0.67, 0.89, 1.0, 1.33, 1.67, 2.0, 2.22, 2.67, 3.33,
  ]),
  materials: ["Aluminium", "Dibond"],
  editableFields: [
    // Every bbox is pixel-scanned to match the canonical text band exactly
    // so that user-typed content lands in the same visual position as the
    // canonical placeholder. Taller-than-canonical bboxes were causing
    // typed text to drift lower (valign:center).
    //
    // Canonical text bands (PNG y-norm):
    //   "PAYMENT IS"    line 1   y=0.054..0.083
    //   "REQUIRED 24/7" line 2   y=0.106..0.135
    //   header total             y=0.054..0.135
    //   lead line                y=0.223..0.256
    //   para 1 (2 lines)         y=0.306..0.371
    //   para 2 (2 lines)         y=0.428..0.501
    //   para 3 (5 lines)         y=0.550..0.738
    //   para 4 (4 lines)         y=0.794..0.942
    {
      id: "header",
      label: "Red header",
      type: "headline",
      // Bbox centered on the canonical text band (center y=0.094) with
      // ±0.055 margin so descenders / antialiased edges of canonical
      // "PAYMENT IS / REQUIRED 24/7" can't peek through. Left starts at
      // x=0.28 to clear the P-mark icon.
      bbox: { x: 0.28, y: 0.040, w: 0.70, h: 0.108 },
      placeholder: "PAYMENT IS\nREQUIRED 24/7",
      style: {
        color: C.white,
        bgColor: C.red,
        fontWeight: 700,
        fontSize: 0.045,
        align: "left",
        valign: "center",
        transform: "uppercase",
        lineHeight: 1.05,
      },
      constraints: { maxChars: 40, maxRows: 2 },
    },
    {
      id: "leadLine",
      label: "Bolded lead line",
      type: "headline",
      bbox: { x: 0.04, y: 0.213, w: 0.92, h: 0.054 },
      placeholder: "No free parking any time.",
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 700,
        fontSize: 0.034,
        align: "center",
        valign: "center",
      },
      constraints: { maxChars: 50, maxRows: 1 },
    },
    // Body is split into 4 separately-editable paragraphs. Each bbox is
    // pinned to its canonical text band so typed content lands where the
    // placeholder visually sits.
    {
      id: "bodyPara1",
      label: "Paragraph 1",
      type: "body",
      bbox: { x: 0.04, y: 0.292, w: 0.92, h: 0.094 },
      placeholder:
        "Payment is required to avoid additional fees & penalties.",
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 400,
        fontSize: 0.032,
        align: "center",
        valign: "center",
        lineHeight: 1.4,
      },
    },
    {
      id: "bodyPara2",
      label: "Paragraph 2",
      type: "body",
      bbox: { x: 0.04, y: 0.414, w: 0.92, h: 0.102 },
      placeholder:
        "This lot is monitored 24/7 by license plate reading technology.",
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 400,
        fontSize: 0.032,
        align: "center",
        valign: "center",
        lineHeight: 1.4,
      },
    },
    {
      id: "bodyPara3",
      label: "Paragraph 3",
      type: "body",
      bbox: { x: 0.04, y: 0.536, w: 0.92, h: 0.216 },
      placeholder:
        "Failure to pay for parking will result in a violation notice with corresponding fee sent to vehicle owner's address. This is in addition to the parking fee.",
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 400,
        fontSize: 0.032,
        align: "center",
        valign: "center",
        lineHeight: 1.4,
      },
    },
    {
      id: "bodyPara4",
      label: "Paragraph 4",
      type: "body",
      bbox: { x: 0.04, y: 0.780, w: 0.92, h: 0.176 },
      placeholder:
        "Please note that if payment is not made within 30 days, all fees will be referred to a registered debt collection agency.",
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 400,
        fontSize: 0.032,
        align: "center",
        valign: "center",
        lineHeight: 1.4,
      },
    },
  ],
};

/* ------------------------------------------------------------------------- */
/* Sign #12 — Compliance Sign                                                */
/* ------------------------------------------------------------------------- */

const SIGN_12: SignTemplate = {
  id: "compliance",
  number: "12",
  name: "Compliance Sign",
  description:
    "Comprehensive lot-rules sign. Hours, payment, liability, violations, contact in a tidy 2x3 grid.",
  category: "informational",
  sourceImage: "/sign-templates/12-compliance.png",
  aspectRatio: 2160 / 2880,
  sizes: sizeSet({ widthIn: 18, heightIn: 24 }, [
    0.67, 0.83, 1.0, 1.17, 1.33, 1.5, 1.67, 2.0,
  ]),
  materials: ["Aluminium", "Dibond"],
  editableFields: [
    // PARKING RATES is the only editable cell. Property name, address,
    // hours, payment forms, payment instructions, limit-of-liability,
    // violations, and contact info are all locked and rendered straight
    // from the brand-guide PNG.
    //
    // Cell measurements (pixel-scanned, normalised):
    //   Column divider at x = 0.481.
    //   Row 1/2 divider at y = 0.316, row 2/3 at y = 0.526.
    //   "PARKING RATES" header underline ends at y ≈ 0.345.
    //   Three canonical rate rows at y = 0.370, 0.418, 0.463.
    //
    // The rate cell is rendered as a structured rate-table so price and
    // days are separate fields per row. Bbox pinned a safe margin inside
    // every border so the bg-fill cannot touch a divider line.
    {
      id: "rateTable",
      label: "Parking rates",
      type: "rate-table",
      // The bbox must FULLY cover the canonical 3 rate rows AND clear the
      // surrounding dividers. Canonical text bands (pixel-scanned):
      //   row 1 ($10.00 WEEKDAY RATE) y=0.367..0.380
      //   row 2 ($5.00 NIGHTS)        y=0.411..0.424
      //   row 3 ($5.00 WEEKENDS)      y=0.456..0.469
      //   "PARKING RATES" underline    y=0.345
      //   row 2/3 divider              y=0.526
      //   column divider               x=0.481
      // bbox: top covers row 1 with 12px margin, bottom 16-screen-px above
      // divider, right 16-screen-px left of column divider.
      bbox: { x: 0.07, y: 0.355, w: 0.385, h: 0.145 },
      placeholder: "",
      defaultRows: [
        { label: "$10.00", sub: "", rates: ["WEEKDAY RATE"] },
        { label: "$5.00", sub: "", rates: ["NIGHTS"] },
        { label: "$5.00", sub: "", rates: ["WEEKENDS"] },
      ],
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 500,
        fontSize: 0.022,
        align: "left",
        valign: "center",
        lineHeight: 1.3,
        // Narrow price ($X.XX) column on the left so the days column has
        // enough room for "WEEKDAY RATE" on one line.
        columnSplit: 0.30,
      },
      constraints: { maxRows: 5 },
    },
  ],
};

/* ------------------------------------------------------------------------- */
/* Export                                                                    */
/* ------------------------------------------------------------------------- */

export const SIGN_TEMPLATES: SignTemplate[] = [
  SIGN_01,
  SIGN_02,
  SIGN_03,
  SIGN_04,
  SIGN_05,
  SIGN_05B,
  SIGN_06,
  SIGN_07,
  SIGN_08,
  SIGN_09A,
  SIGN_09B,
  SIGN_09C,
  SIGN_10,
  SIGN_11,
  SIGN_12,
];

export const TEMPLATES_BY_ID: Record<string, SignTemplate> = Object.fromEntries(
  SIGN_TEMPLATES.map((t) => [t.id, t]),
);

export const CATEGORY_LABELS: Record<SignCategory, string> = {
  "scan-to-pay": "Scan to Pay",
  "rate-sign": "Rate Signs",
  directional: "Directional & Wayfinding",
  reserved: "Reserved",
  informational: "Informational",
};

export function templatesByCategory() {
  const groups: Record<SignCategory, SignTemplate[]> = {
    "scan-to-pay": [],
    "rate-sign": [],
    directional: [],
    reserved: [],
    informational: [],
  };
  for (const t of SIGN_TEMPLATES) groups[t.category].push(t);
  return groups;
}

/** Default = first entry in `sizes`. */
export function defaultSize(template: SignTemplate): SignSize {
  return template.sizes[0];
}

/** Square if aspect ratio is exactly 1.0. */
export function isSquare(template: SignTemplate): boolean {
  return Math.abs(template.aspectRatio - 1.0) < 0.001;
}
