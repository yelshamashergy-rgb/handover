# Handover — Off-Plan Property Tracker

A local-first web app for UAE/GCC off-plan property investors to map out payment
plans, watch equity build, model true costs, and project returns — all the way to
handover. Built web-first, structured to wrap into a native iOS app with minimal rework.

Brand: deep emerald + brass, `Fraunces` + `Inter`. Tagline: *From booking to keys.*
See [APPSTORE.md](APPSTORE.md) for store listing copy.

**Live:** https://yelshamashergy-rgb.github.io/handover/
Auto-deploys from `main` via GitHub Actions (`.github/workflows/deploy.yml`).

## What it does

- **Portfolio dashboard** — roll-up across all properties: total committed, equity
  paid, remaining, projected gain, and the single next payment due anywhere.
- **Payment Plan Architect** — describe a plan (down %, installment % × count,
  frequency, optional 4% DLD fee) and it generates the full dated schedule. Handover
  absorbs the rounding remainder so the plan always balances to the price.
- **Property detail** — vertical payment timeline (tap to mark paid/unpaid), a
  bespoke SVG **equity-build-up curve** (equity paid vs. planned-to-handover, with a
  "today" marker), and key stats.
- **Return projector** — drag sliders for appreciation and rental yield; projected
  value, capital gain, gross rent, and net yield update live and save automatically.
- **UAE true-cost engine** — purchase fee-stack (4% DLD, Oqood, admin) and resale cost
  stack (agency+VAT, NOC, trustee, Oqood transfer) from static rate tables (Dubai /
  Abu Dhabi). Shows real cash-to-acquire, not just the headline price.
- **Resale / flip P&L** — eligibility gate at the developer's 30–40%-paid threshold,
  resale premium, seller costs, net profit, and return on cash invested.
- **Document vault** — store SPA / Oqood / NOC / escrow receipts (files in IndexedDB),
  with an Oqood-vs-SPA reconciliation checklist and expiry-driven reminders.
- **Upcoming deadlines** — portfolio-wide view of payments + document expiries.
- **Cross-property comparison** table and **plan templates** (1% monthly, 50/50, 60/40, 80/20).
- **Smart PDF import** — read a developer payment-plan PDF entirely on-device (pdf.js,
  lazy-loaded) and turn it into an editable schedule. On-device LLM (`@Generable` /
  WebLLM) is the native-iOS upgrade path.
- **Freemium gate** — 1 property free, then a one-time Pro unlock (stubbed for IAP).
- **Light + dark** themes, fully responsive, keyboard-accessible.

Feature priorities were set by a multi-source benchmark of off-plan investor needs and
competitor gaps (Stessa/Landlord Studio are US-rental-oriented; Off Plan Bazaar / Dubai
REST cover discovery & government, not personal post-purchase tracking).

## Design system

Quiet-luxury / private-banking. Warm ivory + ink, **deep emerald** primary, **brass**
for value. `Fraunces` serif for headings & figures, `Inter` for UI with tabular
numerals on all money. Tokens live as CSS variables in `src/index.css` and are mapped
into Tailwind v4 via `@theme inline`, so theming is one attribute swap (`data-theme`).

## Architecture

```
src/
  lib/        types, formatting, payment math, projection, localStorage repo, sample
  ui/         icons (SVG, no emoji) + primitives (Button, Card, Badge, …)
  components/ EquityChart, Timeline, RoiProjector, PropertyForm, Modal, UpgradeModal, Layout
  pages/      Dashboard, PropertyDetail
  store.tsx   React context over the repository; persists on change
```

- **100% local, no backend.** All data lives in `localStorage` behind a single
  `repo` boundary (`src/lib/storage.ts`). Nothing leaves the device.
- **No chart library** — the equity curve is hand-rolled SVG.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to dist/
```

## Path to iOS

The app is a self-contained SPA with `HashRouter` and zero server calls, so
[Capacitor](https://capacitorjs.com) can wrap the exact `dist/` build:

```bash
npm i @capacitor/core @capacitor/ios && npx cap init
npm run build && npx cap add ios && npx cap open ios
```

Everything that becomes native is already isolated behind a boundary, so it's a swap
not a refactor:

1. **Storage + iCloud backup** (the chosen data-safety approach — no accounts, no
   backend). Two boundaries to swap:
   - `src/lib/storage.ts` (`repo`) — the only place app data is read/written. Swap
     `localStorage` for **`@capacitor/preferences`** (stored in native `UserDefaults`,
     which is included in the device's **iCloud backup**) so changing phones restores
     everything. Do **not** mark it excluded-from-backup.
   - `src/lib/filestore.ts` — document file blobs (IndexedDB on web). Swap for
     **`@capacitor/filesystem`** writing to a backed-up directory (e.g. `Directory.Data`).
   Net effect: device-change recovery for free via Apple, data stays private on-device.
   (Web keeps the manual Settings → Export/Restore backup as its safety net.)
2. **Notifications** — real local reminders (payment due, NOC expiry, Oqood window) via
   `@capacitor/local-notifications`. The web build shows due-soon indicators only.
3. **PDF import** — optionally upgrade the heuristic parser to Apple Foundation Models
   (`@Generable`) on-device. The current pdf.js path keeps working as a fallback.

> Data-strategy decision (2026-06): use **iCloud / native device backup**, not
> accounts/cloud-sync. Keeps the app zero-maintenance, zero-liability, and fully private
> — the core of the passive-income model. Revisit opt-in Supabase only if real demand for
> cross-device/web sync appears post-launch.
