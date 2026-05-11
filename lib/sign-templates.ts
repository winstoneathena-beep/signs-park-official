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
  | "location-name" // v1 alias — same as headline
  | "messaging"; // v1 alias — same as body

export type EditableField = {
  id: string;
  label: string;
  type: FieldType;
  /** Normalized bbox (0..1, top-left origin). */
  bbox: { x: number; y: number; w: number; h: number };
  /** Default value displayed until the user edits. Strings for text/headline/body, string[] for list. */
  placeholder: string | string[];
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
    {
      id: "headline",
      label: "Top headline",
      type: "headline",
      bbox: { x: 0.05, y: 0.025, w: 0.9, h: 0.085 },
      placeholder: "PAY HERE",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 800,
        fontSize: 0.075,
        align: "center",
        valign: "center",
        transform: "uppercase",
        lineHeight: 1.0,
      },
      constraints: { maxChars: 12, maxRows: 1 },
    },
    {
      id: "qrCode",
      label: "QR code",
      type: "qr-image",
      // Square in pixel space (1715×1715) so a square upload fills exactly.
      bbox: { x: 0.202, y: 0.217, w: 0.595, h: 0.397 },
      placeholder: "",
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 400,
        fontSize: 0.02,
      },
    },
    {
      id: "qrCaption",
      label: "QR caption",
      type: "headline",
      bbox: { x: 0.13, y: 0.55, w: 0.74, h: 0.07 },
      placeholder: "SCAN TO PAY",
      style: {
        color: C.white,
        bgColor: C.ink,
        fontWeight: 700,
        fontSize: 0.04,
        align: "center",
        valign: "center",
        transform: "uppercase",
      },
      constraints: { maxChars: 16, maxRows: 1 },
    },
    {
      id: "body",
      label: "Bottom messaging",
      type: "body",
      bbox: { x: 0.07, y: 0.66, w: 0.86, h: 0.13 },
      placeholder:
        "No need to download an app.\nEnter license plate, payment info, and be on your way.",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 500,
        fontSize: 0.025,
        align: "center",
        valign: "top",
        lineHeight: 1.35,
      },
      constraints: { maxRows: 4 },
    },
  ],
};

/* ------------------------------------------------------------------------- */
/* Sign #2 — Scan to Pay High Validation                                     */
/* ------------------------------------------------------------------------- */

const SIGN_02: SignTemplate = {
  id: "scan-to-pay-validation",
  number: "02",
  name: "Scan to Pay — High Validation",
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
    {
      id: "headline",
      label: "Headline",
      type: "headline",
      bbox: { x: 0.05, y: 0.05, w: 0.9, h: 0.22 },
      placeholder: "PAY HERE",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 800,
        fontSize: 0.18,
        align: "center",
        valign: "center",
        transform: "uppercase",
      },
      constraints: { maxChars: 14, maxRows: 1 },
    },
    {
      id: "qrCode",
      label: "QR code",
      type: "qr-image",
      // Square in pixel space (~738×738) so square QR upload fits.
      bbox: { x: 0.078, y: 0.330, w: 0.205, h: 0.308 },
      placeholder: "",
      style: { color: C.ink, bgColor: C.white, fontWeight: 400, fontSize: 0.02 },
    },
    {
      id: "qrCaption",
      label: "QR caption",
      type: "headline",
      // Inside the rounded dark container, just below the QR.
      bbox: { x: 0.06, y: 0.65, w: 0.24, h: 0.07 },
      placeholder: "SCAN TO PAY",
      style: {
        color: C.white,
        bgColor: C.ink,
        fontWeight: 700,
        fontSize: 0.06,
        align: "center",
        valign: "center",
        transform: "uppercase",
      },
      constraints: { maxChars: 16 },
    },
    {
      id: "steps",
      label: "Numbered steps",
      type: "list",
      bbox: { x: 0.36, y: 0.32, w: 0.6, h: 0.5 },
      placeholder: [
        "Park and then scan the QR code",
        "Enter your information and start session",
        "Enter validation code (if provided during visit*)",
        "Drive out when you’re done with your visit",
      ],
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 500,
        fontSize: 0.05,
        align: "left",
        valign: "center",
        lineHeight: 1.3,
        bulletStyle: "1.",
      },
      constraints: { maxItems: 6 },
    },
    {
      id: "footnote",
      label: "Footnote",
      type: "body",
      bbox: { x: 0.36, y: 0.85, w: 0.6, h: 0.08 },
      placeholder: "*60-minute validated parking for tenant visitors",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 500,
        fontSize: 0.04,
        align: "center",
        valign: "center",
        italic: true,
      },
      constraints: { maxChars: 90, maxRows: 1 },
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
    "Primary entrance rate sign. Welcome to {LOCATION NAME}, full rate breakdown, additional messaging.",
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
      bbox: { x: 0.07, y: 0.026, w: 0.86, h: 0.13 },
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
      bbox: { x: 0.07, y: 0.18, w: 0.86, h: 0.08 },
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
      bbox: { x: 0.07, y: 0.288, w: 0.86, h: 0.36 },
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
      bbox: { x: 0.1, y: 0.69, w: 0.8, h: 0.12 },
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
    "Customizable for the property name (Ink header) plus tiered rates and a validated rate panel.",
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
      bbox: { x: 0.05, y: 0.04, w: 0.9, h: 0.09 },
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
      bbox: { x: 0.05, y: 0.13, w: 0.9, h: 0.04 },
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
      bbox: { x: 0.05, y: 0.21, w: 0.9, h: 0.08 },
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
      label: "Valet rates (one per line: PRICE   DURATION)",
      type: "body",
      bbox: { x: 0.1, y: 0.31, w: 0.8, h: 0.21 },
      placeholder:
        "$20    0-4 hour\n$32    4-8 hours\n$53    8+ hours\n$53    Overnight",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 700,
        fontSize: 0.038,
        align: "left",
        valign: "center",
        lineHeight: 1.35,
      },
      constraints: { maxRows: 6 },
    },
    {
      id: "validatedTitle",
      label: "Validated header",
      type: "headline",
      bbox: { x: 0.1, y: 0.555, w: 0.8, h: 0.06 },
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
      id: "validatedRate",
      label: "Validated rate price",
      type: "text",
      bbox: { x: 0.1, y: 0.62, w: 0.8, h: 0.06 },
      placeholder: "$12   0-4 hours",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 700,
        fontSize: 0.034,
        align: "center",
        valign: "center",
      },
      constraints: { maxChars: 30 },
    },
    {
      id: "validatedLocations",
      label: "Validated locations",
      type: "list",
      bbox: { x: 0.1, y: 0.69, w: 0.8, h: 0.06 },
      placeholder: ["Tavernetta", "Sunday Vinyl"],
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 400,
        fontSize: 0.026,
        align: "center",
        valign: "center",
        bulletStyle: "•",
      },
      constraints: { maxItems: 4 },
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
      bbox: { x: 0.36, y: 0.1, w: 0.6, h: 0.32 },
      placeholder: "PUBLIC\nPARKING",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 800,
        fontSize: 0.13,
        align: "left",
        valign: "center",
        transform: "uppercase",
        lineHeight: 1.0,
      },
      constraints: { maxChars: 18, maxRows: 2 },
    },
    {
      id: "rateLeft",
      label: "Left rate cell",
      type: "text",
      bbox: { x: 0.04, y: 0.83, w: 0.46, h: 0.13 },
      placeholder: "$10 Per Day",
      style: {
        color: C.white,
        bgColor: C.ink,
        fontWeight: 700,
        fontSize: 0.06,
        align: "center",
        valign: "center",
      },
      constraints: { maxChars: 18 },
    },
    {
      id: "rateRight",
      label: "Right rate cell",
      type: "text",
      bbox: { x: 0.5, y: 0.83, w: 0.46, h: 0.13 },
      placeholder: "$5 Nights & Weekends",
      style: {
        color: C.white,
        bgColor: C.ink,
        fontWeight: 700,
        fontSize: 0.05,
        align: "center",
        valign: "center",
      },
      constraints: { maxChars: 22 },
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
      bbox: { x: 0.36, y: 0.31, w: 0.6, h: 0.32 },
      placeholder: "PUBLIC\nPARKING",
      style: {
        color: C.white,
        bgColor: C.blue,
        fontWeight: 800,
        fontSize: 0.13,
        align: "left",
        valign: "center",
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
      bbox: { x: 0.32, y: 0.05, w: 0.6, h: 0.18 },
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
      bbox: { x: 0.1, y: 0.31, w: 0.8, h: 0.32 },
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
      bbox: { x: 0.1, y: 0.66, w: 0.8, h: 0.13 },
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
      bbox: { x: 0.07, y: 0.03, w: 0.86, h: 0.16 },
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
      id: "directionLabel",
      label: "Direction label",
      type: "headline",
      bbox: { x: 0.07, y: 0.27, w: 0.86, h: 0.25 },
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
      id: "directionWord",
      label: "Vertical direction word",
      type: "text",
      bbox: { x: 0.05, y: 0.4, w: 0.9, h: 0.55 },
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
      bbox: { x: 0.05, y: 0.06, w: 0.9, h: 0.5 },
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
      bbox: { x: 0.08, y: 0.6, w: 0.84, h: 0.12 },
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
      bbox: { x: 0.05, y: 0.06, w: 0.9, h: 0.18 },
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
      bbox: { x: 0.05, y: 0.27, w: 0.9, h: 0.2 },
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
      bbox: { x: 0.08, y: 0.55, w: 0.84, h: 0.12 },
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
    "Required notice. Ink header with the P-mark, full liability copy and facility rules below.",
  category: "informational",
  sourceImage: "/sign-templates/10-limit-of-liability.png",
  aspectRatio: 2160 / 2880,
  sizes: sizeSet({ widthIn: 18, heightIn: 24 }, [
    0.67, 0.83, 1.0, 1.17, 1.33, 1.5, 1.67, 2.0,
  ]),
  materials: ["Aluminium", "Dibond"],
  editableFields: [
    // Header bbox starts AFTER the P-mark icon (around x=0.30) so the bg-fill
    // mask doesn't clip the icon when the user types.
    {
      id: "title",
      label: "Header title",
      type: "headline",
      bbox: { x: 0.30, y: 0.04, w: 0.66, h: 0.13 },
      placeholder: "LIMIT OF LIABILITY\n& FACILITY RULES",
      style: {
        color: C.white,
        bgColor: C.ink,
        fontWeight: 700,
        fontSize: 0.04,
        align: "left",
        valign: "center",
        transform: "uppercase",
        lineHeight: 1.1,
      },
      constraints: { maxChars: 60, maxRows: 2 },
    },
    {
      id: "liabilityBody",
      label: "Liability paragraph",
      type: "body",
      bbox: { x: 0.06, y: 0.2, w: 0.88, h: 0.27 },
      placeholder:
        "Parkwell, LLC, the property owner(s) and their agents, employees or affiliates do not guard or assume care, custody or control of your vehicle or its contents and is not responsible for fire, theft, damage or loss. Any vehicle parked at this facility is parked at the vehicle owner's sole risk. By parking in this facility, you accept this contract and agree to abide by the posted rules in the facility. If you do not accept all or part of this contract, you may leave within 10 minutes at no charge. Failure to abide by the posted rules and applicable parking laws and ordinances may result in a fine, citation or towing. No employee may modify or waive any part of this contract.",
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 400,
        fontSize: 0.022,
        align: "left",
        valign: "top",
        lineHeight: 1.35,
      },
    },
    {
      id: "facilityRules",
      label: "Facility rules (bullets)",
      type: "list",
      bbox: { x: 0.06, y: 0.49, w: 0.88, h: 0.49 },
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
    // Red header bbox starts AFTER the P-mark icon so the bg-fill mask
    // doesn't clip the icon when the user types.
    {
      id: "header",
      label: "Red header",
      type: "headline",
      bbox: { x: 0.32, y: 0.05, w: 0.64, h: 0.13 },
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
      bbox: { x: 0.07, y: 0.215, w: 0.86, h: 0.055 },
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
    // Body is split into 4 separately-editable paragraphs. Each fits into
    // its own visible section in the PNG (blank lines between).
    {
      id: "bodyPara1",
      label: "Paragraph 1",
      type: "body",
      bbox: { x: 0.07, y: 0.305, w: 0.86, h: 0.095 },
      placeholder:
        "Payment is required to avoid additional fees & penalties.",
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 400,
        fontSize: 0.026,
        align: "center",
        valign: "center",
        lineHeight: 1.4,
      },
    },
    {
      id: "bodyPara2",
      label: "Paragraph 2",
      type: "body",
      bbox: { x: 0.07, y: 0.420, w: 0.86, h: 0.085 },
      placeholder:
        "This lot is monitored 24/7 by license plate reading technology.",
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 400,
        fontSize: 0.026,
        align: "center",
        valign: "center",
        lineHeight: 1.4,
      },
    },
    {
      id: "bodyPara3",
      label: "Paragraph 3",
      type: "body",
      bbox: { x: 0.07, y: 0.535, w: 0.86, h: 0.190 },
      placeholder:
        "Failure to pay for parking will result in a violation notice with corresponding fee sent to vehicle owner's address. This is in addition to the parking fee.",
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 400,
        fontSize: 0.026,
        align: "center",
        valign: "center",
        lineHeight: 1.4,
      },
    },
    {
      id: "bodyPara4",
      label: "Paragraph 4",
      type: "body",
      bbox: { x: 0.07, y: 0.755, w: 0.86, h: 0.210 },
      placeholder:
        "Please note that if payment is not made within 30 days, all fees will be referred to a registered debt collection agency.",
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 400,
        fontSize: 0.026,
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
    {
      id: "propertyName",
      label: "Property / company name",
      type: "headline",
      bbox: { x: 0.05, y: 0.025, w: 0.9, h: 0.06 },
      placeholder: "Parkwell, LLC",
      style: {
        color: C.white,
        bgColor: C.ink,
        fontWeight: 700,
        fontSize: 0.034,
        align: "center",
        valign: "center",
      },
      constraints: { maxChars: 30 },
    },
    {
      id: "propertyAddress",
      label: "Property address",
      type: "text",
      bbox: { x: 0.05, y: 0.085, w: 0.9, h: 0.05 },
      placeholder: "2332 15th Street",
      style: {
        color: C.white,
        bgColor: C.ink,
        fontWeight: 600,
        fontSize: 0.028,
        align: "center",
        valign: "center",
      },
      constraints: { maxChars: 40 },
    },
    // Row 1 — bboxes fit INSIDE each box's content area below the section
    // header ("HOURS OF OPERATION", "FORMS OF PAYMENT ACCEPTED") which stays
    // baked into the PNG. Same for all later rows.
    {
      id: "hoursContent",
      label: "Hours of operation",
      type: "body",
      bbox: { x: 0.06, y: 0.205, w: 0.42, h: 0.085 },
      placeholder: "PUBLIC PARKING\nOPEN DAILY 24/7",
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 500,
        fontSize: 0.022,
        align: "center",
        valign: "center",
        lineHeight: 1.4,
      },
    },
    {
      id: "paymentContent",
      label: "Forms of payment",
      type: "list",
      bbox: { x: 0.52, y: 0.205, w: 0.42, h: 0.085 },
      placeholder: ["CREDIT/DEBIT CARD", "NO CASH"],
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 500,
        fontSize: 0.022,
        align: "left",
        valign: "center",
        bulletStyle: "•",
        lineHeight: 1.4,
      },
    },
    // Row 2
    {
      id: "ratesContent",
      label: "Parking rates",
      type: "body",
      bbox: { x: 0.06, y: 0.385, w: 0.42, h: 0.10 },
      placeholder:
        "$10.00    WEEKDAY RATE\n$5.00     NIGHTS\n$5.00     WEEKENDS",
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 500,
        fontSize: 0.022,
        align: "left",
        valign: "center",
        lineHeight: 1.55,
      },
    },
    {
      id: "instructionsContent",
      label: "Payment instructions",
      type: "body",
      bbox: { x: 0.52, y: 0.385, w: 0.42, h: 0.10 },
      placeholder:
        "PAY BY PHONE BY SCANNING THE QR CODE LOCATED THROUGHOUT THE FACILITY. NO FREE PARKING ANYTIME. DO NOT PAY ATTENDANT. NO IN & OUT.",
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 500,
        fontSize: 0.022,
        align: "center",
        valign: "center",
        lineHeight: 1.35,
      },
    },
    // Row 3 — liability split into its two visible sub-sections so the
    // "CONTACT PARKWELL:" subheader stays as part of the PNG.
    {
      id: "liabilityContent",
      label: "Limit of liability paragraph",
      type: "body",
      bbox: { x: 0.06, y: 0.61, w: 0.42, h: 0.175 },
      placeholder:
        "LOCK YOUR CAR AND STORE VALUABLES OUT OF SIGHT. CHARGE IS FOR PARKING SPACES ONLY. PARKWELL AND ITS AFFILIATES NOT RESPONSIBLE FOR THEFT, FIRE, DAMAGE OR INJURY TO ANY PERSON OR PROPERTY.",
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 500,
        fontSize: 0.02,
        align: "center",
        valign: "top",
        lineHeight: 1.4,
      },
    },
    {
      id: "contactContent",
      label: "Contact Parkwell info",
      type: "body",
      bbox: { x: 0.06, y: 0.835, w: 0.42, h: 0.13 },
      placeholder:
        "720-504-3620\n2546 15th St, DENVER CO 80211\nccnparking@goparkwell.com\nWWW.GOPARKWELL.COM",
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 500,
        fontSize: 0.02,
        align: "center",
        valign: "top",
        lineHeight: 1.45,
      },
    },
    {
      id: "violationsContent",
      label: "Violations content",
      type: "body",
      bbox: { x: 0.52, y: 0.61, w: 0.42, h: 0.355 },
      placeholder:
        "PAID PARKING IS STRICTLY ENFORCED 24/7. NOTICES/FINES ARE ISSUED FOR NON-PAYMENT, EXCEEDING ALLOTTED TIME, OR PARKING IN UNAUTHORIZED SPACES. WE RESERVE THE RIGHT TO TOW FOR UNAUTHORIZED PARKING. FEES & ESCALATIONS: $45 IF PAID WITHIN 14 DAYS, $95 IF PAID AFTER. TO DISPUTE A VIOLATION, EMAIL NOTICES@GOPARKWELL.COM",
      style: {
        color: C.ink,
        bgColor: C.white,
        fontWeight: 500,
        fontSize: 0.02,
        align: "center",
        valign: "top",
        lineHeight: 1.4,
      },
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
