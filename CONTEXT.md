# Parkwell Signs v2 — Session Context

> Read this before doing anything. Captures where we are, what works, what's
> been decided, and how to pick up. Updated each working session.

---

## Project map

```
Joels/
├── parkwell-signs/         v1 working copy. DO NOT TOUCH from a v2 session.
├── v1/                     v1 frozen 1.0.0 release snapshot. DO NOT TOUCH.
├── v2/                     ← WE ARE HERE — the v2 redesign branch
└── _brand/                 brand-guide pptx extraction (logos, signs)
```

The v2 GitHub repo is `winstoneathena-beep/signs-park-v2` (private).
The v1 GitHub repo is `winstoneathena-beep/signs-park` (private, untouched).

---

## Active workflow rules (from the user)

1. **Local-first.** The user wants to iterate locally and confirm visually
   before any `git push`. Don't push to GitHub unless they say so.
2. **No proactive commits.** Save changes to disk. Don't `git commit` without
   explicit user request.
3. **v1 is frozen** — `parkwell-signs/` and `v1/` are off-limits in v2 work.
4. **Build/lint discipline.** After meaningful edits, run `npm run lint` and
   `npm run build`. Both must be clean.

---

## Dev server

```bash
cd "/Users/winstoneopanga/Documents/Joel x Winstone/Joels/v2"
PORT=3001 npm run dev
```

Port 3001 keeps it separate from the v1 dev server on port 3000.

If hot reload misbehaves (Turbopack sometimes pins parse errors from
mid-edit saves):

```bash
/usr/sbin/lsof -ti:3001 | xargs kill -9
rm -rf .next
PORT=3001 npm run dev
```

---

## Architecture (what makes v2 v2)

### Sign rendering model

Source PNG (extracted at print resolution from the brand-guide pptx) is the
visual ground truth. We never reconstruct sign artwork in code. The renderer
overlays editable text fields on top using normalized 0..1 bbox coordinates.

**Empty fields render NOTHING** — the PNG with its brand-guide canonical
content shows through. Only when the user types/uploads does an overlay
appear with a `bgColor` fill that masks the underlying PNG content.

The user's strong preference: when the editor is in its empty/initial state,
the preview should look like the brand-guide reference. Editing affordance
is in the right column (input fields with placeholders), not in the preview.

### Field types (`lib/sign-templates.ts`)

- `text` / `headline` — single-line or short multi-line title text
- `body` / `messaging` — multi-line paragraph
- `list` — bullet list with `bulletStyle: "•" | "–" | "1." | "none"`
- `rate-table` — structured rate rows (label / sub / rates[])
- `qr-image` — user-uploadable image, square-fits the bbox

Each field has `style.bgColor` so the renderer doesn't infer color
inappropriately. Field values default empty for text types so the PNG
shows through; pre-filled with placeholder for `list` and `rate-table`
since those have structural defaults.

### Auto-fit text (`components/sign/SignPreview.tsx` → `TextOverlay`)

Default text/headline/body fields use **real DOM measurement + `transform:
scale()`** to fit content into the bbox. Direct DOM mutation in
`useLayoutEffect` (no React state, no flash). Floor at 40% scale.

Pattern:
```ts
useLayoutEffect(() => {
  const el = innerRef.current;
  if (!el) return;
  el.style.transform = "scale(1)";
  const rect = el.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    const availW = px.width * 0.94;
    const availH = px.height * 0.92;
    const scale = Math.max(0.4, Math.min(1, availW / rect.width, availH / rect.height));
    el.style.transform = `scale(${scale})`;
  }
}, [text, baseFontSize, px.width, px.height, ...]);
```

Lists still use the `autoFit` character-width estimation helper at the
bottom of the file (less critical since list items wrap individually).
Rate-table doesn't auto-fit.

### QR upload (signs #1 and #2)

Square-in-pixel-space bboxes so square QR uploads fit exactly:

- **Sign #1**: `bbox: { x: 0.202, y: 0.217, w: 0.595, h: 0.397 }` (1715×1715 px, perfect alignment with the PNG's white QR area inside the dark rounded container)
- **Sign #2**: `bbox: { x: 0.078, y: 0.330, w: 0.205, h: 0.308 }` (738×738 px, manually fitted)
- Sign #2 caption bbox was off (y=0.83, outside container). Now at y=0.65 inside the container, just below the QR.

When QR is uploaded, `<img>` with `objectFit: contain` fills the bbox; bg
fill (white) masks the original PNG QR placeholder.

### Brand assets (locked, don't touch)

- `bg-parkwell-blue` `#19B2EC`
- `text-ink` / `bg-ink` `#0A202E`
- Wave footer (in PNG and as SVG component)
- Parkwell wordmark (lowercase "p + parkwell" lockup, white)
- Chevron
- Montserrat font

The lowercase logo `parkwell-logo-white.png` (white-on-transparent) lives
at `public/brand/`. Driven via CSS `mask-image` so the same source renders
in any brand color (`<Logo tone="white|ink|current" />`).

### Onboarding gate

`components/site/OnboardingGate.tsx` redirects unauthenticated visitors to
`/welcome`. Roles are **Requester** and **Approver** (v1's three-role
system collapsed). Approver = full access including approve + mark-as-ordered.
The session and onboarded flag live in localStorage via `lib/orders.ts`.

---

## Sign template inventory

13 templates total in `lib/sign-templates.ts`:

| ID | # | Name | Editable fields |
|---|---|---|---|
| `scan-to-pay-standard` | 01 | Scan to Pay — Standard | headline, qrCode, qrCaption, body |
| `scan-to-pay-validation` | 02 | Scan to Pay — Validation | headline, qrCode, qrCaption, steps, footnote |
| `standard-rate` | 03 | Standard Rate Sign | locationName, rateTitle, rateTable, additional |
| `valet-podium-rate` | 04 | Valet Podium Rate | propertyName, propertySubtitle, rateTitle, valetRates (body), validatedTitle, validatedRate, validatedLocations |
| `marquee-rates` | 05 | Marquee with Rates | headline, rateLeft, rateRight |
| `marquee-no-rates` | 05b | **Marquee — Public Parking** ← added in v2 | headline only |
| `promotional-rate-windmaster` | 06 | Promotional Rate Windmaster | headline, price, additional |
| `directional-windmaster` | 07 | Directional Windmaster | locationName, directionLabel |
| `delineator` | 08 | Delineator | directionWord (vertical letter stack) |
| `reserved-24-7` | 09a | Reserved Parking 24/7 | headline, violatorNotice |
| `no-hotel-parking` | 09b | No Hotel Parking 24/7 | headline, violatorNotice |
| `attention-tenants` | 09c | Attention — Tenants Only | headline, body, violatorNotice |
| `limit-of-liability` | 10 | Limit of Liability | title, liabilityBody, facilityRules (list) |
| `enforcement-warning` | 11 | Enforcement Warning | header (RED bg), leadLine, body |
| `compliance` | 12 | Compliance Sign | propertyName, propertyAddress, hoursContent, paymentContent (list), ratesContent (body), instructionsContent, liabilityContent, violationsContent |

Square signs (use `squareSizes`): #5, #5b, #9a/b/c.
All others use `sizeSet` with proportional multipliers from a default size.

### Sign #5b creation

Was created in v2 by cropping `05-marquee-rates.png` at y=1900 (above the
white divider line), then padding the top with parkwell-blue to make it a
true 2400×2400 square. **No vertical stretching** — brand elements (P-mark,
parkwell logo wordmark) keep original proportions. There's now ~21% of
empty parkwell-blue at the top of the sign by design; gives the marquee
breathing room.

---

## Recent user feedback / decisions log

In rough order. Each entry = a turning point that should NOT be
re-litigated without checking with the user first.

1. **Welcome page is a hard gate.** First-time visitors must pick a role
   before accessing anything. Two roles only: Requester / Approver.
2. **Approver gets mark-as-ordered.** v1's separate Admin role is gone.
3. **Approval modal is full-screen on mobile, max-w-6xl on desktop, with
   sticky action footer.** Buttons must be visible without scrolling.
4. **Make every sign editable.** Not just #3, #4, #7 — all of them. But
   keep brand colors / fonts / wave / logo locked.
5. **For empty fields, render no overlay.** PNG shows through. Earlier
   attempts at faded placeholders rendered on top of bg fills, causing
   "overlay on top of overlay" artifacts on most signs (#1, #2, #4, #5,
   #6, #7, #8, #9a/b/c, all informationals). Empty = nothing → fixed.
6. **Auto-fit text via DOM measurement, not character estimation.** First
   attempt used a character-width-ratio estimator; user said "still scales
   wrongly". Now uses `getBoundingClientRect()` + `transform: scale()`.
7. **No font-size control for users.** Auto-fit handles it. Adding a
   font-size dropdown was rejected as "more clutter, lets users break the
   design".
8. **Square-in-pixel-space QR bbox.** v1's QR bbox was 1670×1382 (not
   square). Square QR uploads were getting either distorted or
   contained-with-margin. Now exactly square.
9. **Sign #5b was added** as a Marquee variant without rate strip. Square,
   one editable field (the headline). Previously asked to be "kinda like
   you're cutting sign no 5 from the bottom white horizontal line".

---

## What's known to still be off

Things flagged by the user or noticed but not fully resolved:

- **Sign #2 QR bbox is approximate.** Pillow detection had threshold
  issues; current values are manual estimates. May need pixel-tweaking
  after live verification.
- **Sign #2 caption position** moved from y=0.83 → y=0.65, but exact
  placement vs the SCAN TO PAY text in the PNG hasn't been visually
  verified by the user.
- **Some signs have many editable fields** (#4 Valet, #12 Compliance) —
  bboxes were defined by visual inspection of the PNG. If a specific field
  looks off, the bbox needs to be tightened against the PNG content.
- **Lists still use character-width estimation, not DOM measurement.** Not
  yet ported to the same approach as `<TextOverlay>`. If list-fitting
  drifts on signs with long bullets (#10 Limit of Liability), port the
  same useLayoutEffect + transform: scale pattern.

---

## Things explicitly NOT to do

- **Don't add font-size pickers** to the editor.
- **Don't render placeholder text on top of the PNG** when fields are
  empty. PNG shows through, period.
- **Don't recompose any sign artwork in SVG/JSX.** PNGs are ground truth.
- **Don't reintroduce v1's admin role.** Two roles only.
- **Don't push to GitHub** without an explicit "push" from the user.
- **Don't auto-stretch the source PNGs** to force aspect ratios. Pad with
  brand-blue or use a different size set.

---

## Useful commands

```bash
# Quality gates after edits
cd "/Users/winstoneopanga/Documents/Joel x Winstone/Joels/v2"
npm run lint
npm run build

# Visual debug — render bboxes on a sign PNG
python3 << 'PY'
from PIL import Image, ImageDraw
img = Image.open("public/sign-templates/01-scan-to-pay-standard.png").copy()
W, H = img.size
draw = ImageDraw.Draw(img)
# bbox = (x_norm, y_norm, w_norm, h_norm)
draw.rectangle(
    (int(0.202*W), int(0.217*H), int((0.202+0.595)*W), int((0.217+0.397)*H)),
    outline=(0,255,0), width=14,
)
img.save("/tmp/debug.png")
PY

# Hard restart dev server with cache clear
/usr/sbin/lsof -ti:3001 | xargs kill -9
rm -rf .next
PORT=3001 npm run dev
```

---

## Pickup checklist for next session

1. Read this file and `AGENTS.md`.
2. Run `git log --oneline -10` in `v2/` to see recent commits.
3. Check `git status` for uncommitted local changes (should usually be
   none unless we left something mid-iteration).
4. Start the dev server: `PORT=3001 npm run dev`.
5. Ask the user where we left off if not obvious from this file.
