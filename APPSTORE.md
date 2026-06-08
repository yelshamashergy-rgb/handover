# Handover — Brand & App Store kit

## Brand

- **Name:** Handover
- **Tagline:** *From booking to keys.*
- **Personality:** quiet-luxury / private-banking. Calm, precise, premium, private.
- **Logo:** brass key with a hexagonal bow on deep emerald (`public/icon.svg`).
- **Palette:**
  - Emerald (primary) `#0E5C4A` · deep `#0A3A2E`
  - Brass (accent / value) `#A37C3C` · light `#EBCD86`
  - Ivory (surface) `#F6F2EA` · ink `#1B1813`
- **Type:** Fraunces (display / figures) · Inter (UI, tabular numerals).

> Availability still to be confirmed by reserving the name in App Store Connect and a
> trademark check. "Handover" is descriptive (weakly protectable, easy to use).

---

## App Store listing

**App name (≤30):**
`Handover: Off-Plan Tracker`

**Subtitle (≤30):**
`Off-plan payments to keys`

**Promotional text (≤170):**
Plan every installment, see your true cost after DLD & Oqood fees, track equity to
handover, and know the moment you can resell — all private, all on your device.

**Keywords (≤100, no spaces):**
`off-plan,Dubai,property,DLD,Oqood,payment plan,handover,equity,ROI,UAE,investment,resale,real estate`

**Description:**

Handover is the private companion for off-plan property owners in the UAE.

Buying off-plan means years of installments, fees, and deadlines spread across
spreadsheets and developer PDFs. Handover puts it all in one place — and never sends
your data anywhere. Everything lives on your device.

• PAYMENT PLANS — Build your schedule in seconds from a template (1% monthly, 50/50,
  60/40, 80/20) or import a developer PDF. See every due date and tick payments off.

• TRUE COST — Know what you’ll really pay: 4% DLD, Oqood, and admin fees on top of the
  price, with rate tables for Dubai, Abu Dhabi, Sharjah and Ras Al Khaimah.

• EQUITY & RETURN — Watch equity build to handover, and model appreciation and rental
  yield to project your return.

• RESALE & FLIP — See the moment you cross your developer’s resale threshold, and your
  net profit after selling costs.

• DOCUMENT VAULT — Keep your SPA, Oqood, NOC and receipts together, with an Oqood-vs-SPA
  reconciliation checklist and expiry reminders.

• PORTFOLIO — Roll up committed capital, equity, and the next payment due across every
  property, and compare them side by side.

Private by design. No account, no cloud, no tracking.

Handover is an organisational tool, not financial or legal advice. Verify fees and
rules with the relevant authority.

**What’s New (1.0):**
First release. Payment-plan tracking, UAE true-cost modelling, equity & ROI, resale
P&L, document vault, and on-device PDF import.

---

## Pricing

- **Free:** 1 property, full feature set.
- **Handover Pro:** unlimited properties — **one-time $14.99** (no subscription).
  (Benchmark: Stessa/Landlord Studio sit at ~$12–28/mo; a one-time unlock is the
  differentiator for a private, set-and-forget tool.)

## Pre-submission checklist (Apple) — do these at the Capacitor/iOS stage

**Hard blockers (will cause rejection if skipped):**
1. **In-App Purchase for Pro (Guideline 3.1.1).** The "Pro" unlock currently flips a
   local flag (a placeholder). Before submission it MUST be a real **StoreKit**
   Non-Consumable:
   - Create the product in App Store Connect; **read the localized price from StoreKit**
     (don't hardcode "$14.99").
   - Wire it in `store.tsx → unlockPro` via a Capacitor StoreKit bridge
     (`@capacitor-community/in-app-purchases` or RevenueCat).
   - Add a **"Restore Purchases"** button (required for non-consumables) — natural home is
     the Settings → Plan card.
   - Entitlement comes only from the verified transaction (the backup file no longer
     carries `pro`, so there's no bypass).
2. **Privacy policy URL** — already published at `/privacy.html`
   (e.g. `https://handover-offplan.netlify.app/privacy.html`). Enter it in App Store Connect.
   App Privacy: **Data Not Collected** (accurate — no network, no analytics).
3. **App icon** — the 1024 marketing icon is now flat RGB (no alpha). ✓

**Info.plist (set during the Capacitor wrap):**
- `ITSAppUsesNonExemptEncryption = false` (only standard HTTPS/`randomUUID`; avoids the
  export-compliance prompt every build).
- Usage strings only if you add native Camera/Filesystem later. The current document
  attach uses a plain file input → no photo/camera string needed.
- If you add `@capacitor/local-notifications` for real reminders, add the permission flow
  (and only then can the listing claim push/local reminders).

**N/A (confirmed):** account deletion 5.1.1 (no accounts), App Tracking Transparency
(no IDFA/analytics), external-payment links (none).

## Screenshot captions

1. Every payment, from booking to keys.
2. Your true cost — after DLD, Oqood & fees.
3. Watch your equity build to handover.
4. Know the moment you can resell.
5. SPA, Oqood & NOC — private, on your device.
6. Project your return.
