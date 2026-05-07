/**
 * Single source of truth for the 12 Parkwell sign templates.
 *
 * Each template references its base artwork (extracted from the brand guide
 * pptx) and declares the editable fields (if any) that managers can fill in.
 *
 * Coordinate system for editable field bboxes is normalized to the source
 * image: x, y, width, height are all 0..1 fractions of the image dimensions.
 * The renderer multiplies by the rendered preview dimensions at draw time.
 */

export type FieldType = "text" | "rate-table" | "messaging" | "location-name";

export type EditableField = {
  id: string;
  label: string;
  type: FieldType;
  /** Normalized bbox: x, y, width, height all in 0..1. Top-left origin. */
  bbox: { x: number; y: number; w: number; h: number };
  /** Default placeholder shown until the manager edits. */
  placeholder: string;
  /** Visual style hints for the rendered text. */
  style: {
    color: string;
    fontWeight: 400 | 500 | 600 | 700 | 800;
    /** Font size as a fraction of sign HEIGHT (matches pptx pt sizing). */
    fontSize: number;
    align?: "left" | "center" | "right";
    valign?: "top" | "center" | "bottom";
    /** Line height multiplier. */
    lineHeight?: number;
    transform?: "uppercase" | "none";
    /** For rate-table fields, the column split (0..1) within the bbox. */
    columnSplit?: number;
  };
  /** Optional: max characters or rows to enforce brand clarity. */
  constraints?: { maxChars?: number; maxRows?: number };
};

export type SignCategory =
  | "scan-to-pay"
  | "rate-sign"
  | "directional"
  | "reserved"
  | "informational";

export type SignTemplate = {
  id: string;
  number: string;
  name: string;
  description: string;
  category: SignCategory;
  /** Path under /public to the source artwork. */
  sourceImage: string;
  /** Aspect ratio (w / h) — matches the source PNG's pixel ratio. */
  aspectRatio: number;
  /** Common physical dimensions offered for ordering. */
  defaultDimensions: { widthIn: number; heightIn: number };
  /** Materials this sign can be ordered in. */
  materials: string[];
  /** Editable fields (empty = fixed-art, ordered as-is). */
  editableFields: EditableField[];
  /** "How we do it" rationale from the brand guide. */
  rationale?: string;
};

const RATE_PLACEHOLDER = `WEEKDAYS\t$10 first 2 hours
5am-4pm\t$5 hourly thereafter
\t$25 maximum
WEEKNIGHTS\t$15 flat rate
4pm-5am\t
WEEKENDS\t$15 flat rate
5am-5am\t`;

export const SIGN_TEMPLATES: SignTemplate[] = [
  {
    id: "scan-to-pay-standard",
    number: "01",
    name: "Scan to Pay — Standard",
    description:
      "Primary payment sign. Large QR code, clear scan-to-pay call to action, the no-app-needed promise.",
    category: "scan-to-pay",
    sourceImage: "/sign-templates/01-scan-to-pay-standard.png",
    aspectRatio: 2880 / 4320,
    defaultDimensions: { widthIn: 18, heightIn: 27 },
    materials: ["Vinyl", "Coroplast", "Aluminium", "Dibond", "PVC"],
    editableFields: [],
    rationale:
      "QR takes prominence; PAY HERE is biggest message. Plain language, no abbreviations. White Montserrat on Parkwell Blue.",
  },
  {
    id: "scan-to-pay-validation",
    number: "02",
    name: "Scan to Pay — High Validation",
    description:
      "For environments with frequent validated parkers (hotels, office tenants). Numbered steps, validation footnote.",
    category: "scan-to-pay",
    sourceImage: "/sign-templates/02-scan-to-pay-validation.png",
    aspectRatio: 3600 / 2400,
    defaultDimensions: { widthIn: 24, heightIn: 16 },
    materials: ["Vinyl", "Coroplast", "Aluminium", "Dibond", "PVC"],
    editableFields: [],
    rationale:
      "Landscape format with numbered steps so first-time parkers can self-serve.",
  },
  {
    id: "standard-rate",
    number: "03",
    name: "Standard Rate Sign",
    description:
      "Primary entrance rate sign. Welcome to {LOCATION NAME}, full rate breakdown, additional messaging.",
    category: "rate-sign",
    sourceImage: "/sign-templates/03-standard-rate.png",
    aspectRatio: 3360 / 5280,
    defaultDimensions: { widthIn: 24, heightIn: 36 },
    materials: ["Vinyl", "Coroplast", "Aluminium", "Dibond", "PVC"],
    editableFields: [
      {
        id: "locationName",
        label: "Location name",
        type: "location-name",
        bbox: { x: 0.07, y: 0.026, w: 0.86, h: 0.13 },
        placeholder: "LOCATION NAME",
        style: {
          color: "#0A202E",
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
        id: "rateTable",
        label: "Parking rates",
        type: "rate-table",
        bbox: { x: 0.07, y: 0.288, w: 0.86, h: 0.36 },
        placeholder: RATE_PLACEHOLDER,
        style: {
          color: "#FFFFFF",
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
        type: "messaging",
        bbox: { x: 0.1, y: 0.69, w: 0.8, h: 0.12 },
        placeholder:
          "$35 lost ticket fee.\nNew day starts at 5am.\nEvent rates may apply.",
        style: {
          color: "#FFFFFF",
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
      "Welcome and PARKING RATES top priority. Largest numbers for pricing — most important info for parkers. Plain language: 'hours' not 'hrs'.",
  },
  {
    id: "valet-podium-rate",
    number: "04",
    name: "Valet Podium Rate Sign",
    description:
      "Customizable for the property name (Ink header) plus tiered rates and a validated rate panel.",
    category: "rate-sign",
    sourceImage: "/sign-templates/04-valet-podium-rate.png",
    aspectRatio: 2880 / 3840,
    defaultDimensions: { widthIn: 18, heightIn: 24 },
    materials: ["Coroplast", "Aluminium", "Dibond", "PVC"],
    editableFields: [
      {
        id: "propertyName",
        label: "Property name",
        type: "text",
        bbox: { x: 0.05, y: 0.04, w: 0.9, h: 0.14 },
        placeholder: "PROPERTY NAME",
        style: {
          color: "#0A202E",
          fontWeight: 700,
          fontSize: 0.05,
          align: "center",
          valign: "center",
          lineHeight: 1.05,
          transform: "uppercase",
        },
        constraints: { maxChars: 16, maxRows: 1 },
      },
    ],
    rationale:
      "Property name in Ink on white at top, valet rates in white on Parkwell Blue, validated panel highlighted with white outline.",
  },
  {
    id: "marquee-rates",
    number: "05",
    name: "Marquee with Rates",
    description:
      "Large entrance/marquee sign. PUBLIC PARKING headline, P-mark, rate strip in the Ink wave footer.",
    category: "rate-sign",
    sourceImage: "/sign-templates/05-marquee-rates.png",
    aspectRatio: 1,
    defaultDimensions: { widthIn: 36, heightIn: 36 },
    materials: ["Aluminium", "Dibond"],
    editableFields: [],
    rationale: "P-mark + PUBLIC PARKING for instant recognition; rate strip kept short.",
  },
  {
    id: "promotional-rate-windmaster",
    number: "06",
    name: "Promotional Rate Windmaster",
    description:
      "Event/promo signage with a single oversized price. Drop-in for event days.",
    category: "rate-sign",
    sourceImage: "/sign-templates/06-promotional-rate-windmaster.png",
    aspectRatio: 3360 / 5280,
    defaultDimensions: { widthIn: 24, heightIn: 36 },
    materials: ["Coroplast", "PVC"],
    editableFields: [],
    rationale: "Single dominant price. Additional messaging plain and short.",
  },
  {
    id: "directional-windmaster",
    number: "07",
    name: "Directional Windmaster",
    description:
      "Wayfinding sign with welcome banner and a chevron arrow pointing to the lot.",
    category: "directional",
    sourceImage: "/sign-templates/07-directional-windmaster.png",
    aspectRatio: 3360 / 5280,
    defaultDimensions: { widthIn: 24, heightIn: 36 },
    materials: ["Coroplast", "PVC"],
    editableFields: [
      {
        id: "locationName",
        label: "Location name",
        type: "location-name",
        bbox: { x: 0.07, y: 0.03, w: 0.86, h: 0.16 },
        placeholder: "LOCATION NAME",
        style: {
          color: "#0A202E",
          fontWeight: 700,
          fontSize: 0.05,
          align: "center",
          valign: "center",
          lineHeight: 1.05,
          transform: "uppercase",
        },
        constraints: { maxChars: 28, maxRows: 2 },
      },
    ],
    rationale: "PUBLIC PARKING + chevron most important. Welcome reassures the right place.",
  },
  {
    id: "delineator",
    number: "08",
    name: "Delineator Sign",
    description:
      "Tall narrow lane-side sign. Chevron above, vertical ENTER stack on Parkwell Blue.",
    category: "directional",
    sourceImage: "/sign-templates/08-delineator.png",
    aspectRatio: 960 / 3000,
    defaultDimensions: { widthIn: 6, heightIn: 18 },
    materials: ["Aluminium"],
    editableFields: [],
    rationale: "Vertical ENTER reads at lane speed; chevron + Ink top builds brand.",
  },
  {
    id: "reserved-24-7",
    number: "09a",
    name: "Reserved Parking 24/7",
    description: "Standard reserved-spot sign. Bold three-line headline + small violator notice.",
    category: "reserved",
    sourceImage: "/sign-templates/09a-reserved-24-7.png",
    aspectRatio: 1,
    defaultDimensions: { widthIn: 12, heightIn: 12 },
    materials: ["Aluminium", "Coroplast"],
    editableFields: [],
  },
  {
    id: "no-hotel-parking",
    number: "09b",
    name: "No Hotel Parking 24/7",
    description: "Variant for tenant lots that exclude hotel guests.",
    category: "reserved",
    sourceImage: "/sign-templates/09b-no-hotel-parking.png",
    aspectRatio: 1,
    defaultDimensions: { widthIn: 12, heightIn: 12 },
    materials: ["Aluminium", "Coroplast"],
    editableFields: [],
  },
  {
    id: "attention-tenants",
    number: "09c",
    name: "Attention — Tenants Only",
    description: "Soft-warning variant for tenant/visitor-only lots.",
    category: "reserved",
    sourceImage: "/sign-templates/09c-attention-tenants.png",
    aspectRatio: 1,
    defaultDimensions: { widthIn: 12, heightIn: 12 },
    materials: ["Aluminium", "Coroplast"],
    editableFields: [],
  },
  {
    id: "limit-of-liability",
    number: "10",
    name: "Limit of Liability & Facility Rules",
    description:
      "Required notice. Ink header with the P-mark, full liability copy and facility rules below.",
    category: "informational",
    sourceImage: "/sign-templates/10-limit-of-liability.png",
    aspectRatio: 2160 / 2880,
    defaultDimensions: { widthIn: 18, heightIn: 24 },
    materials: ["Aluminium", "Dibond"],
    editableFields: [],
  },
  {
    id: "enforcement-warning",
    number: "11",
    name: "Enforcement Warning",
    description:
      "Payment-required notice on Parkwell Red header. Reserved for high-enforcement lots.",
    category: "informational",
    sourceImage: "/sign-templates/11-enforcement-warning.png",
    aspectRatio: 2880 / 4320,
    defaultDimensions: { widthIn: 18, heightIn: 27 },
    materials: ["Aluminium", "Dibond"],
    editableFields: [],
  },
  {
    id: "compliance",
    number: "12",
    name: "Compliance Sign",
    description:
      "Comprehensive lot-rules sign. Hours, payment, liability, violations, contact in a tidy 2x3 grid.",
    category: "informational",
    sourceImage: "/sign-templates/12-compliance.png",
    aspectRatio: 2160 / 2880,
    defaultDimensions: { widthIn: 18, heightIn: 24 },
    materials: ["Aluminium", "Dibond"],
    editableFields: [],
  },
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
