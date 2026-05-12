# Parkwell Signs v2 — Session Context

> Read this before doing anything. Captures where we are, what works, what's
> been decided, and how to pick up. Updated each working session. Last update:
> 2026-05-12.

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
- `body` / `messaging` — multi-line paragraph (wraps inside bbox)
- `list` — bullet list with `bulletStyle: "•" | "–" | "1." | "none"`
- `rate-table` — structured rate rows (label / sub / rates[])
- `qr-image` — user-uploadable image, scales-to-fit the bbox

Each field has `style.bgColor` so the renderer doesn't infer color
inappropriately. Field values default empty for text types so the PNG
shows through.

### Locking fields (introduced 2026-05-12)

To "lock" a field — make it non-editable, show only the canonical PNG
content — simply **remove it from the template's `editableFields` array**.
The form input disappears, no overlay renders, and the PNG canonical text
shows through. Used for legal-required content that must not vary per
location (e.g. Sign #10 title/liability paragraph, Sign #12 hours/payment/
liability/contact).

### Auto-fit text (`components/sign/SignPreview.tsx` → `TextOverlay`)

Default text/headline/body fields use **real DOM measurement + `transform:
scale()`** to fit content into the bbox. Direct DOM mutation in
`useLayoutEffect` (no React state, no flash). **No scale floor** — text
shrinks as much as needed to stay inside the bbox. Tiny text is better
than text overflowing into a neighbouring cell.

Body fields use `whiteSpace: "pre-wrap"` + bounded `maxWidth` so long
paragraphs reflow inside the bbox. Headlines stay `whiteSpace: "pre"` —
never break inside a word (prevents "PUBLIC PARKING" → "PUBLIC / PARKIN /
G"). The `wrap` prop on `TextOverlay` controls this; `FieldOverlay`
passes `wrap={type === "body" || type === "messaging"}`.

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
    const scale = Math.min(1, availW / rect.width, availH / rect.height);
    el.style.transform = `scale(${scale})`;
  }
}, [text, baseFontSize, px.width, px.height, ...]);
```

### ListOverlay (separate from TextOverlay)

Lists use the same DOM-measurement shrink-to-fit, but with `whiteSpace:
"normal"` + `wordBreak: "break-word"` + bounded `width` so long bullet
items can wrap. The old `whiteSpace: "pre"` made items render
microscopically because the natural width was unbounded — fixed
2026-05-11. `ListOverlay` still has a 0.4 scale floor (kept for
readability of bullet items); lower if bullets ever overflow.

### QR upload

Uploaded QR `<img>` uses `width: 100%, height: 100%, objectFit: contain`
inside a flex-centered overlay div with `box-sizing: border-box` and
`overflow: hidden`. This guarantees the image scales DOWN (or up) to fit
the bbox regardless of how large the user's upload is — even 3000×3000.
Padding inside the bbox = 4% of width/height.

Square-in-pixel-space bboxes so square QR uploads fit exactly:

- **Sign #1**: `bbox: { x: 0.202, y: 0.217, w: 0.595, h: 0.397 }`
  (1715×1715 px, aligned to the PNG's white QR area)
- **Sign #2**: `bbox: { x: 0.078, y: 0.330, w: 0.205, h: 0.308 }`
  (738×738 px)

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

### Edit Sign navigation (`components/dashboard/OrderDetailDialog.tsx`)

`editSign()` only calls `router.push('/create?template=...&order=...')` —
**not** `onOpenChange(false)`. The parent's `onOpenChange` does a
`router.replace('/dashboard/orders')` which races with and cancels the
push, leaving the user stranded. The dialog unmounts when the route
changes, so explicit close isn't needed.

---

## Sign template inventory

15 templates total in `lib/sign-templates.ts` (Sign #5b is the v2 addition).

| ID | # | Name | Editable fields |
|---|---|---|---|
| `scan-to-pay-standard` | 01 | Scan to Pay — Standard | headline, qrCode, qrCaption, body |
| `scan-to-pay-validation` | 02 | Scan to Pay — Validation | headline, qrCode, qrCaption, steps, footnote |
| `standard-rate` | 03 | Standard Rate Sign | locationName, rateTitle, rateTable, additional |
| `valet-podium-rate` | 04 | Valet Podium Rate | propertyName, propertySubtitle, rateTitle, valetRates, validatedTitle, validatedRate, validatedLocations |
| `marquee-rates` | 05 | Marquee with Rates | headline, rateLeft, rateRight |
| `marquee-no-rates` | 05b | Marquee — Public Parking *(v2 addition)* | headline only |
| `promotional-rate-windmaster` | 06 | Promotional Rate Windmaster | headline, price, additional |
| `directional-windmaster` | 07 | Directional Windmaster | locationName, directionLabel |
| `delineator` | 08 | Delineator | directionWord (vertical letter stack) |
| `reserved-24-7` | 09a | Reserved Parking 24/7 | headline, violatorNotice |
| `no-hotel-parking` | 09b | No Hotel Parking 24/7 | headline, violatorNotice |
| `attention-tenants` | 09c | Attention — Tenants Only | headline, body, violatorNotice |
| `limit-of-liability` | 10 | Limit of Liability | **facilityRules only** *(title + liabilityBody locked)* |
| `enforcement-warning` | 11 | Enforcement Warning | header, leadLine, bodyPara1, bodyPara2, bodyPara3, bodyPara4 |
| `compliance` | 12 | Compliance Sign | **ratesContent + violationsContent only** *(everything else locked)* |

Square signs (use `squareSizes`): #5, #5b, #9a/b/c.
All others use `sizeSet` with proportional multipliers from a default size.

### Sign #5b creation

Created in v2 by cropping `05-marquee-rates.png` at y=1900 (above the
white divider line), then padding the top with parkwell-blue to make it
a true 2400×2400 square. **No vertical stretching** — brand elements
(P-mark, parkwell logo wordmark) keep original proportions. ~21% of
empty parkwell-blue at the top by design.

---

## PNG asset state

The 14 source PNGs in `public/sign-templates/` are:

| File | State | Notes |
|---|---|---|
| `01-scan-to-pay-standard.png` | **cleaned** | Bottom body caption painted blue at y=0.695–0.835 (canonical "No need to download an app…" removed). Bbox places user input in the same spot. |
| `02-scan-to-pay-validation.png` | **cleaned** | Footnote band painted blue at y=0.735–0.795 (canonical "*60-minute validated parking…" removed). |
| `03-standard-rate.png` | original | — |
| `04-valet-podium-rate.png` | original | — |
| `05-marquee-rates.png` | original | — |
| `05b-marquee-no-rates.png` | **derived** | Cropped from #5 at y=1900, padded top with parkwell-blue to 2400×2400. |
| `06-promotional-rate-windmaster.png` | original | — |
| `07-directional-windmaster.png` | original | — |
| `08-delineator.png` | **cleaned** | Canonical "ENTER" letters painted out (parkwell-blue) so the editable bbox can sit safely below the wave without flattening the wave shape. |
| `09a-reserved-24-7.png` | original | — |
| `09b-no-hotel-parking.png` | original | — |
| `09c-attention-tenants.png` | original | — |
| `10-limit-of-liability.png` | original | — |
| `11-enforcement-warning.png` | original | — |
| `12-compliance.png` | original | — |

If anything ever breaks: every original lives at
`_brand/source/brand-guide/ppt/media/image{46,49,48,50,51,52,53,54,55,56,57,58,59,60}.png`
(the 14 images map in that order to signs #1, #2, #3, #4, #5, #6, #7, #8,
#9a, #9b, #9c, #10, #11, #12 by file-size match — see
`/tmp/bbox_debug.py` or pick by aspect ratio).

---

## Recent user feedback / decisions log

In rough chronological order. Each entry = a turning point that should
NOT be re-litigated without checking with the user first.

1. **Welcome page is a hard gate.** First-time visitors must pick a role
   before accessing anything. Two roles only: Requester / Approver.
2. **Approver gets mark-as-ordered.** v1's separate Admin role is gone.
3. **Approval modal is full-screen on mobile, max-w-6xl on desktop, with
   sticky action footer.** Buttons must be visible without scrolling.
4. **Make every sign editable.** Not just #3, #4, #7 — all of them. But
   keep brand colors / fonts / wave / logo locked.
5. **For empty fields, render no overlay.** PNG shows through. Earlier
   attempts at faded placeholders rendered on top of bg fills, causing
   "overlay on top of overlay" artifacts. Empty = nothing → fixed.
6. **Auto-fit text via DOM measurement.** First attempt used a
   character-width-ratio estimator; user said "still scales wrongly".
   Now uses `getBoundingClientRect()` + `transform: scale()`.
7. **No font-size control for users.** Auto-fit handles it. A font-size
   dropdown was rejected as "more clutter, lets users break the design".
8. **Square-in-pixel-space QR bbox.** v1's QR bbox was 1670×1382 (not
   square) — uploads got distorted. Now exactly square (1715×1715 for
   #1, 738×738 for #2).
9. **Sign #5b was added** as a Marquee variant without rate strip.
   Square, one editable field (the headline).
10. **2026-05-11: Bboxes must FULLY contain PNG canonical text.** The
    earlier "render nothing when empty + bbox over text" model breaks
    when the bbox is smaller than the underlying PNG text — pixels of
    PNG text leak around the bbox edge. Bboxes were re-tuned to cover
    every canonical content region with a small safety margin.
11. **2026-05-11: List shrink-to-fit floor was broken.** `whiteSpace:
    "pre"` made long bullet items have unbounded natural width, causing
    `scale → 0.4 (floor) → microscopic text` (visible on Sign #10).
    Fixed: `whiteSpace: "normal"` + bounded `width` + `wordBreak:
    "break-word"`.
12. **2026-05-11: Headline wrapping must NEVER break inside a word.**
    `whiteSpace: "pre-wrap"` was breaking "PUBLIC PARKING" into "PUBLIC
    / PARKIN / G". Reverted to `"pre"` for headlines; body fields keep
    `"pre-wrap"` (long paragraphs need to wrap).
13. **2026-05-11: TextOverlay scale floor removed entirely.** Was 0.4 —
    long content overflowed bboxes on Sign #2/#12. No floor now: tiny
    text is acceptable, overflow is not.
14. **2026-05-11: QR scaling fix.** Large QR uploads weren't shrinking.
    Changed from `maxWidth/maxHeight: 100%` to `width: 100% + height:
    100% + objectFit: contain`.
15. **2026-05-11: PNG cleaning for problematic signs.** Signs #1
    (bottom body), #2 (footnote), #8 (ENTER letters) had their canonical
    text painted out so bboxes don't have to be pixel-perfect to mask.
16. **2026-05-12: Edit Sign no-op fixed.** `editSign()` was calling
    `router.push` then `onOpenChange(false)`, and `onOpenChange` did a
    `router.replace('/dashboard/orders')` that cancelled the push.
    Solution: don't close the dialog — the route change unmounts it.
17. **2026-05-12: Sign #10 lockdown.** Title and liability paragraph are
    NOT editable (legal-required canonical content). Only the
    facility-rules bullet list remains editable.
18. **2026-05-12: Sign #12 lockdown.** Only `ratesContent` (PARKING
    RATES cell) and `violationsContent` (VIOLATIONS cell) are editable.
    Property name, address, hours, payment forms, payment instructions,
    limit-of-liability, and contact info all show from the PNG canonical
    and cannot be changed.
19. **2026-05-12: Sign #12 bbox containment.** The two editable bboxes
    must stay strictly inside their grid cells — the column divider is
    at x ≈ 0.481, so LEFT bboxes stop at ~x=0.465, RIGHT bboxes start
    at ~x=0.515. Top edges sit just below each section's underline so
    the canonical first line can't peek above the bg-fill.

---

## What's known to still be off

Things flagged or noticed but not fully resolved:

- **Sign #2 QR bbox is approximate.** Pillow detection had threshold
  issues; current values are manual estimates. May need pixel-tweaking
  after live verification.
- **Sign #4 (Valet Podium) and Sign #11 (Enforcement) bboxes have NOT
  been individually pixel-verified** against PNG text positions. If a
  specific field looks off, scan with the `bbox_debug.py` pattern (see
  below) and tighten.
- **Sign #9a / #9b violator-notice bg-fill** is parkwell-blue, same as
  PNG bg. Any sub-pixel color mismatch would show as a faint rectangle
  outline. Hasn't been reported as a problem but worth a visual check.
- **Sign #12 LEFT cells (Hours, Payment Forms, Liability, Contact) are
  locked to "Parkwell, LLC" / "2332 15th Street" / etc.** If the user
  ever needs different property values for compliance signs at other
  locations, those fields will need to be re-promoted to editable.
- **ListOverlay still has a 0.4 scale floor.** Removed from TextOverlay
  but kept for lists for readability. If a list ever overflows, drop or
  lower it.

---

## Things explicitly NOT to do

- **Don't add font-size pickers** to the editor.
- **Don't render placeholder text on top of the PNG** when fields are
  empty. PNG shows through, period.
- **Don't recompose any sign artwork in SVG/JSX.** PNGs are ground truth.
- **Don't reintroduce v1's admin role.** Two roles only.
- **Don't push to GitHub** without an explicit "push" from the user.
- **Don't auto-stretch the source PNGs** to force aspect ratios. Pad
  with brand-blue or use a different size set.
- **Don't restore Sign #10's title or liability paragraph as editable.**
  Legal-required content, locked deliberately.
- **Don't restore Sign #12's locked cells as editable** without asking.
  Only RATES and VIOLATIONS are user-controlled per current decision.

---

## Useful commands

```bash
# Quality gates after edits
cd "/Users/winstoneopanga/Documents/Joel x Winstone/Joels/v2"
npm run lint
npm run build

# Visual debug — render a bbox on a sign PNG
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

# Pixel-scan a PNG to locate text bands (use when bbox alignment looks off)
python3 << 'PY'
from PIL import Image
img = Image.open("public/sign-templates/12-compliance.png").convert("RGB")
W, H = img.size
def dark(p): return p[0] < 100 and p[1] < 100 and p[2] < 100
prev = 0
for y in range(H):
    cnt = sum(1 for x in range(W) if dark(img.getpixel((x, y))))
    if cnt > 30 and prev <= 30: print(f"  start y={y} ({y/H:.4f}) cnt={cnt}")
    if cnt <= 30 and prev > 30: print(f"  end   y={y} ({y/H:.4f})")
    prev = cnt
PY

# Restore a sign PNG from the original brand-guide source
# Map (by aspect/filesize): 46→#1, 47→unused, 48→#3, 49→#2, 50→#4,
# 51→#5, 52→#6, 53→#7, 54→#8, 55→#9a, 56→#9b, 57→#9c, 58→#10, 59→#11, 60→#12
cp "../_brand/source/brand-guide/ppt/media/image60.png" \
   "public/sign-templates/12-compliance.png"

# Hard restart dev server with cache clear
/usr/sbin/lsof -ti:3001 | xargs kill -9
rm -rf .next
PORT=3001 npm run dev
```

---

## Pickup checklist for next session

1. Read this file and `AGENTS.md` (`AGENTS.md` is the "this is NOT the
   Next.js you know" warning — check `node_modules/next/dist/docs/`
   before writing routing/server code).
2. Run `git log --oneline -10` in `v2/` to see recent commits.
3. Run `git status` to check for uncommitted local changes.
4. Start the dev server: `PORT=3001 npm run dev`.
5. If the user is mid-task on a specific sign, scan the PNG with the
   pixel-scan recipe above to verify bbox alignment against the
   canonical text positions before making edits.
6. Ask the user where we left off if not obvious from the above and
   from `git log`.

---

## Where we left off (2026-05-12)

Last user action: **tightened Sign #12 ratesContent + violationsContent
bboxes** so they stay strictly inside their grid cells with margin on
all sides. Bboxes confirmed via Python simulation render — both fit
inside the PARKING RATES and VIOLATIONS cells without overflowing into
neighbours or onto divider lines.

- `ratesContent`: `x=0.045, y=0.353, w=0.42, h=0.165`
- `violationsContent`: `x=0.515, y=0.553, w=0.44, h=0.40`

Lint + build clean. Dev server on port 3001 returning 200 for all
`/create?template=*` routes.

No known open bugs. Next likely topics: ordering flow polish, PDF /
spec-sheet export verification, or another round of visual testing
across signs we haven't deeply re-verified (#3, #4, #5, #6, #7, #11).
