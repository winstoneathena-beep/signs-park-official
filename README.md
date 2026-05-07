# Parkwell Signs — v2.0.0 (redesign)

Working branch for the v2 redesign of the Parkwell Signs platform.

> **Status:** redesign-in-progress. v2 starts as an exact copy of [v1.0.0](../v1/) and will diverge from there. Don't merge changes back into `v1/` — that snapshot is frozen as the v1 release. Don't merge changes into `../parkwell-signs/` either — that's the active v1 working copy. **All redesign work happens in this folder.**

## Why v2 exists

v1 shipped the core flow — welcome gate, sign creator, approval workflow, role-aware dashboards — and proved the architectural bet that the brand-guide pptx artwork can be the visual ground truth (with editable fields overlaid). v2 keeps that foundation and rethinks the rest of the experience.

The redesign brief and decisions live alongside this repo's commits as we go. This README will be updated when the redesign direction firms up.

## Inherited from v1

Everything in v1 carries over as the starting point:

- **Welcome gate** with role selection (Requester / Approver)
- **Marketing pages** — Home, Sign Library, About, Contact
- **Sign creator** — three-step flow with PNG / PDF / spec-sheet downloads
- **Approval workflow** — pending → approved → ordered with edit-in-place
- **Order database** — searchable orders table + detail dialog
- **Mobile-responsive** layouts
- **12 brand-approved sign templates** as print-resolution PNGs

See [v1's README](../v1/README.md) for the full v1 feature list.

## Stack (carried from v1)

- Next.js 16.2.5 (App Router) with Turbopack
- React 19.2.4
- Tailwind CSS 4 — tokens in `app/globals.css`
- shadcn/ui on Radix primitives (radix base, nova preset)
- `motion` 12 for animation
- `html-to-image` + `jspdf` for client-side sign export
- `next-themes` for light/dark mode
- localStorage-backed order/session store

Pinned to **Node 22** via `.nvmrc`.

## Local development

```bash
cd v2
nvm use                # picks up .nvmrc → Node 22
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). First visit redirects to `/welcome` to pick a role.

```bash
npm run build          # production build
npm run lint           # eslint — must be clean
npm start              # serve the production build
```

## Project structure

Same layout as v1 — see [v1's README](../v1/README.md) for the full tree. Anything that drifts during the redesign will be documented here.

## Brand tokens

Direct utilities, all wired in `app/globals.css`:

| Token | HEX |
|---|---|
| `bg-parkwell-blue` | `#19B2EC` |
| `text-ink` / `bg-ink` | `#0A202E` |
| `text-ocean` | `#2C586D` |
| `text-parkwell-green` | `#2EB298` |
| `text-parkwell-yellow` | `#D9CA23` |
| `text-parkwell-red` | `#EB5466` |

`font-sans` resolves to **Montserrat** via `next/font`.

## Roles & permissions

| Capability | Requester | Approver |
|---|:-:|:-:|
| Browse sign library | ✓ | ✓ |
| Create + customize signs | ✓ | ✓ |
| Download proofs (PNG / PDF / spec sheet) | ✓ | ✓ |
| Submit for approval | ✓ | ✓ |
| View all orders | ✓ | ✓ |
| Approve / request revision | — | ✓ |
| Edit a pending sign in place | — | ✓ |
| Mark approved order as ordered | — | ✓ |

## Repo + deploy

This folder is its own GitHub repo (separate from the v1 repo at `signs-park`) and deploys to its own Vercel project. v1 stays live at its existing URL while v2 evolves at a separate preview URL — only when v2 is ready to take over does it become the production target.

## Diff from v1 at branch time

- `package.json` `name` → `parkwell-signs-v2`, `version` → `2.0.0`
- `package-lock.json` regenerated cleanly
- This README

Everything else is byte-identical to v1 at snapshot. The redesign begins from here.
