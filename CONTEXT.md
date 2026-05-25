# Parkwell Signs v3 — Session Context

> Read this before doing anything. Captures where v3 is, what's been
> decided, and how to pick up cold. Updated each working session.
> Last update: 2026-05-13.

---

## Project map

```
Joels/
├── parkwell-signs/   v1 working copy. DO NOT TOUCH.
├── v1/               v1 frozen 1.0.0. DO NOT TOUCH.
├── v2/               v2 redesign branch. DO NOT TOUCH from a v3 session.
├── v3/               ← WE ARE HERE
└── _brand/           brand-guide pptx extraction (logos, signs)
```

- **GitHub remote:** `winstoneathena-beep/signs-park-official` (private)
- **Branch:** `main` tracking `origin/main`
- **Last pushed commit:** `adbc5f8` *Templates page: rebrand heading to "Approved templates"*
- **Vercel:** repo is Vercel-ready (Next.js 16, Node ≥20, no env vars,
  no `vercel.json` needed). Not yet deployed.

---

## Active workflow rules (from the user)

1. **Local-first.** Iterate locally and confirm visually before pushing.
   Don't push unless the user says so.
2. **No proactive commits.** Save changes to disk. Don't `git commit`
   without explicit user request.
3. **v1 and v2 are frozen** — only edit v3.
4. **Build/lint discipline.** After meaningful edits, `npm run lint`
   should report only the 4 pre-existing issues
   (`OnboardingGate.tsx`, `welcome/page.tsx`, `SignPreview.tsx`). Any
   new lint error is yours.
5. **Don't reference "the plan" in questions** before approval. Use
   `AskUserQuestion` for branch points, `ExitPlanMode` for plan sign-off.

---

## Dev server

```bash
cd "/Users/winstoneopanga/Documents/Joel x Winstone/Joels/v3"
PORT=3000 npm run dev
```

If Turbopack pins a stale parse error or images don't refresh:

```bash
/usr/sbin/lsof -ti:3000 | xargs kill -9
rm -rf .next
PORT=3000 npm run dev
```

---

## Architecture (unchanged from v2 — see commit history if you need detail)

- **PNG-as-ground-truth.** Each sign template is a PNG; user input
  renders as CSS overlays with `bgColor` masks. Empty fields render
  nothing → canonical PNG shows through.
- **Auto-fit text** via DOM measurement + `transform: scale()` in
  `useLayoutEffect` (no React state, no flash).
- **Field types** in `lib/sign-templates.ts`: `text`, `headline`,
  `body`, `list`, `rate-table`, `qr-image`, `arrow-direction`.
- **Locking a field** = remove it from the template's `editableFields`
  array. Form input disappears, PNG canonical shows through.
- **Orders persist to localStorage** (`parkwell.orders.v1`). No backend
  yet — see "TeamHub direction" below for the path off localStorage.
- **Brand assets locked:** `bg-parkwell-blue #19B2EC`, ink `#0A202E`,
  wave footer, lowercase parkwell wordmark, chevron, Montserrat font.

---

## Sign template inventory (15 templates)

| ID | # | Name | Editable fields |
|---|---|---|---|
| `scan-to-pay-standard` | 01 | Scan to Pay — Standard | **qrCode only** *(headline/caption/body locked)* |
| `scan-to-pay-validation` | 02 | Scan to Pay — Validation | **qrCode only** *(headline/steps/footnote locked)* |
| `standard-rate` | 03 | Standard Rate Sign | locationName, rateTitle, rateTable, additional |
| `valet-podium-rate` | 04 | Valet Podium Rate | propertyName, propertySubtitle, rateTitle, valetRates (rate-table), validatedTitle, validatedRatePrice, validatedRateDuration, validatedLocationLeft, validatedLocationRight |
| `marquee-rates` | 05 | Marquee with Rates | headline, rateLeftPrice, rateLeftDuration, rateRightPrice, rateRightDuration |
| `marquee-no-rates` | 05b | Marquee — Public Parking | headline only |
| `promotional-rate-windmaster` | 06 | Promotional Rate Windmaster | headline, price, additional |
| `directional-windmaster` | 07 | Directional Windmaster | locationName, directionLabel, arrowDirection |
| `delineator` | 08 | Delineator | directionWord, arrowDirection |
| `reserved-24-7` | 09a | Reserved Parking 24/7 | headline, violatorNotice |
| `no-hotel-parking` | 09b | No Hotel Parking 24/7 | headline, violatorNotice |
| `attention-tenants` | 09c | Attention — Tenants Only | headline, body, violatorNotice |
| `limit-of-liability` | 10 | Limit of Liability | **facilityRules only** *(title + liabilityBody locked)* |
| `enforcement-warning` | 11 | Enforcement Warning | header, leadLine, bodyPara1, bodyPara2, bodyPara3, bodyPara4 |
| `compliance` | 12 | Compliance Sign | **rateTable only** *(everything else locked incl. violations)* |

Square signs (use `squareSizes`): #5, #5b, #9a/b/c.

---

## Order flow (v3 additions)

`Order` type (`lib/orders.ts`):

```ts
type Order = {
  id, templateId, status, values, specs,
  location: string,        // required at order time
  siteNumber: string,      // required at order time — for expense coding
  createdBy, createdAt, updatedAt, approval?
}
```

- **SpecsStep** in `components/sign/SignEditor.tsx` has a "Location &
  Site #" card with two required inputs. Inline errors on blur. Next
  button disabled until both filled.
- Legacy localStorage orders are backfilled to `siteNumber: ""` on
  read so older saves don't crash the dialog.
- Site # surfaces in: Review step summary, OrderDetailDialog Specs
  section, spec-sheet PDF rows.

---

## Recent user feedback / decisions log

In rough chronological order. Each entry = a turning point that should
NOT be re-litigated without checking with the user first.

### v2 carryovers (decisions that still apply)

1. Welcome page is a hard gate. Two roles only: Requester / Approver.
2. Approver gets mark-as-ordered (no separate Admin role).
3. Empty fields render NOTHING. PNG shows through.
4. Auto-fit text via DOM measurement, no scale floor for text.
5. No font-size control for users — auto-fit handles it.
6. Square-in-pixel-space QR bboxes so square uploads fit exactly.
7. Bboxes must FULLY contain canonical PNG text so pixels don't leak.

### v3 decisions (2026-05-13)

8. **Signs #1, #2 locked to QR-only.** Headlines, captions, body text,
   numbered steps, footnote are all canonical. Only the QR upload is
   editable. Bboxes square in pixel space, sized to sit inside the
   white QR card so the dark rounded frame + "SCAN TO PAY" label stay
   visible. Sign #1: `{x:0.223, y:0.211, w:0.554, h:0.369}` (1595×1595
   px). Sign #2: `{x:0.0625, y:0.3275, w:0.205, h:0.3075}` (738×738 px).
9. **Sign #4 validated section split** into 5 fields (validatedTitle,
   validatedRatePrice, validatedRateDuration, validatedLocationLeft,
   validatedLocationRight) all contained inside the canonical white
   frame. Valet rates upgraded to rate-table.
10. **Sign #5/#5b headline anchored** with `valign: top` so it doesn't
    drift up when typed. Rate strip split into price+days cells inside
    the canonical "half-open" boundary.
11. **Sign #6 anchored** to pixel-scanned canonical positions
    (`valign: center`); placeholder no longer bleeds through behind
    typed content; headline doesn't overlap the P-mark.
12. **Signs #7/#8 arrow direction control** using extracted canonical
    chevron PNG (`public/brand/chevron-pair.png`) with CSS rotation.
    4-button toggle (up/right/down/left) in editor. **No custom SVG**
    — the user rejected that hard; canonical pixels only.
13. **Sign #11 (Enforcement Warning) bboxes** anchored to canonical
    text bands with ±0.010 margin so descenders don't bleed:
    - header `{y:0.040, h:0.108}` (was 0.025, 0.165 → drifted ~14px low)
    - leadLine `{y:0.213, h:0.054}`
    - bodyPara1 `{y:0.292, h:0.094}` — fontSize bumped 0.026→0.032 so
      typed text wraps at same break points as canonical
    - bodyPara2 `{y:0.414, h:0.102}`
    - bodyPara3 `{y:0.536, h:0.216}`
    - bodyPara4 `{y:0.780, h:0.176}`
14. **Sign #12 (Compliance) lockdown tightened.** Violations is now
    LOCKED. Only `rateTable` is editable — converted from a single
    body field to structured rate-table so each row has separate price
    + days fields. Bbox `{x:0.07, y:0.355, w:0.385, h:0.145}` with
    safety margin from every divider (column at x=0.481, row 2/3 at
    y=0.526, PARKING RATES underline at y=0.345). `columnSplit: 0.30`
    so "WEEKDAY RATE" stays on one line.
15. **Location and Site # are mandatory** on every order. Cannot
    submit/review until both filled. Used for expense coding +
    delivery. See "Order flow" section above.
16. **Templates page heading** rebranded from
    "Fifteen templates. Every Parkwell scenario." →
    "Approved templates. Every Parkwell scenario." Drops the count
    so the headline doesn't drift when templates are added/retired.

### GitHub housekeeping (2026-05-13)

17. All repos except the public profile README (`winstoneathena-beep`)
    flipped to PRIVATE. `signs-park`, `signs-park-v2`,
    `signs-park-official`, `park`, `sop` are all private.
18. Profile README scrubbed of "What I'm working on" section (it
    referenced private repos). Force-pushed orphan to rewrite history;
    GitHub's GC didn't expunge the orphaned commit immediately — user
    handled the cleanup themselves.

---

## TeamHub direction (architecture discussion 2026-05-13)

User is planning a portal at `app.goparkwell.com` (or similar) that
gates by `@goparkwell.com` email, hosts multiple internal tools (Signs
is one, more coming), with per-station director permissions.

**Recommended path** (not yet started):

1. Restructure v3 into a **Turborepo monorepo**: `apps/signs`,
   `apps/teamhub`, `packages/auth`, `packages/ui`. Each app deploys
   to its own Vercel project on its own subdomain.
2. **Auth: Clerk** (~$25/mo at scale, free tier covers MVP). Email
   domain allowlist, organizations, role-based access baked in.
3. **DB: Neon Postgres + Drizzle ORM** for the user→tool→station
   permission matrix. Replaces the localStorage session/orders.
4. **Domains:** `app.goparkwell.com` → TeamHub,
   `signs.goparkwell.com` → Signs app. Subdomains of the existing
   domain — don't buy a separate `teamhub.com`.
5. **Order:** stand up TeamHub first with minimal data, migrate Signs
   off localStorage in a second pass.

**Explicitly NOT to do:**

- Don't build TeamHub as a route inside Signs (`/teamhub`). Couples
  them, every deploy ships both.
- Don't roll your own auth.
- Don't buy a separate `teamhub.com` — subdomain is the right call.

User has NOT given the go-ahead to start this; needs to decide on
Clerk vs. Auth.js + Google Workspace SSO first.

---

## Things explicitly NOT to do

- **Don't add font-size pickers** to the editor.
- **Don't render placeholder text on top of the PNG** when fields are
  empty. PNG shows through, period.
- **Don't recompose any sign artwork in SVG/JSX.** PNGs are ground
  truth. The chevron rotation on #7/#8 uses the extracted PNG —
  re-derive that, don't draw a new chevron.
- **Don't reintroduce v1's admin role.** Two roles only.
- **Don't push to GitHub** without an explicit "push" from the user.
- **Don't auto-stretch the source PNGs** to force aspect ratios. Pad
  with brand-blue or use a different size set.
- **Don't restore Sign #10's title or liability paragraph as editable.**
  Legal-required content, locked deliberately.
- **Don't restore Sign #12's locked cells as editable** without asking.
  Only `rateTable` is user-controlled per current decision.
- **Don't make Location or Site # optional again.** Both are required
  for expense coding and delivery.

---

## Useful commands

```bash
# Quality gates after edits
cd "/Users/winstoneopanga/Documents/Joel x Winstone/Joels/v3"
npm run lint
npm run build

# Visual debug — render a bbox on a sign PNG
python3 << 'PY'
from PIL import Image, ImageDraw
img = Image.open("public/sign-templates/12-compliance.png").copy()
W, H = img.size
draw = ImageDraw.Draw(img)
draw.rectangle(
    (int(0.07*W), int(0.355*H), int((0.07+0.385)*W), int((0.355+0.145)*H)),
    outline=(0,255,0), width=14,
)
img.save("/tmp/debug.png")
PY

# Pixel-scan a PNG to locate text bands
python3 << 'PY'
from PIL import Image
img = Image.open("public/sign-templates/11-enforcement-warning.png").convert("RGB")
W, H = img.size
def dark(p): return p[0] < 100 and p[1] < 100 and p[2] < 100
prev = 0
for y in range(H):
    cnt = sum(1 for x in range(W) if dark(img.getpixel((x, y))))
    if cnt > 30 and prev <= 30: print(f"  start y={y} ({y/H:.4f})")
    if cnt <= 30 and prev > 30: print(f"  end   y={y} ({y/H:.4f})")
    prev = cnt
PY

# Restore a sign PNG from the brand-guide source
# Map: image46→#1, 47→unused, 48→#3, 49→#2, 50→#4, 51→#5, 52→#6,
#      53→#7, 54→#8, 55→#9a, 56→#9b, 57→#9c, 58→#10, 59→#11, 60→#12
cp "../_brand/source/brand-guide/ppt/media/image49.png" \
   "public/sign-templates/02-scan-to-pay-validation.png"

# Hard restart dev server with cache clear
/usr/sbin/lsof -ti:3000 | xargs kill -9
rm -rf .next
PORT=3000 npm run dev
```

---

## Pickup checklist for next session

1. Read this file and `AGENTS.md` (the "this is NOT the Next.js you
   know" warning).
2. `git log --oneline -10` to see recent commits.
3. `git status` to check for uncommitted changes.
4. Start the dev server: `PORT=3000 npm run dev`.
5. If mid-task on a specific sign, scan the PNG with the pixel-scan
   recipe above before adjusting bboxes.
6. Ask the user where to pick up if not obvious from `git log`.

---

## Where we left off (2026-05-13)

All recent work is pushed. `git status` is clean. Last three commits:

- `adbc5f8` Templates page: rebrand heading to "Approved templates"
- `94a3c2a` Require Location + Site # on every order
- `5429910` Sign #11 + #12 — anchor bboxes to canonical text bands

**Open conversations:**

- TeamHub portal architecture — user is weighing Clerk vs. Auth.js +
  Google SSO. Hasn't picked yet. Doesn't want to be coupled with Signs.
- Visual re-verification still pending on signs #3, #9a, #9b, #9c, #10
  (per inventory above — these were either v2-era locks or not
  re-checked in v3 yet).

**No known bugs** at the time of writing. `npm run lint` reports the
same 4 pre-existing issues (`OnboardingGate.tsx` setState-in-effect,
`welcome/page.tsx` setState-in-effect, `SignPreview.tsx` two warnings)
— don't waste time on those unless the user asks.
