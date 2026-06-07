# Design Review: Handover

**Date**: 2026-06-07
**URL**: http://localhost:5173 / https://yelshamashergy-rgb.github.io/handover/
**Reviewer lens**: visual quality, mobile (375–480px), light + dark

## Overall impression

Clean, consistent, and genuinely app-like after the shell rebuild. Palette, type
pairing, card system, and dark-mode parity are strong. The main weakness is
**hierarchy on Home** (no focal point — squint test fails) and **thin interaction
polish** (state changes are colour-only, little press feedback/motion). It reads
"well-made developer app" — a hero moment and motion would push it to "designed."

## Findings

### High
- **No hero on Home / weak hierarchy** — the portfolio card is four equal-weight
  metrics stacked; nothing dominates. For a premium tracker the *equity story*
  should be the focal point. → Add a hero: large equity figure + a circular equity
  ring, with Committed / Remaining / Projected gain demoted to a compact supporting row.

### Medium
- **Interaction polish is thin** (emil/impeccable lens) — bottom-nav items and pill
  tabs change colour only; no press-scale, no animated active indicator. → Add
  `active:scale` press feedback on nav items + pills; smooth (150–200ms) transitions.
- **Pill tab touch target** ~32px tall (py-2), under the 44px guideline. → bump padding.
- **Stat treatment inconsistency** — Home metrics use icon+label; property-detail
  stats use label only. Minor, but unify the visual language. → low priority.

### Low
- **Detail subtitle wraps to two lines** on narrow screens (developer · area · type ·
  handover). Acceptable; could shorten or allow wrap gracefully.
- **`SettingsModal.tsx` is now dead code** (replaced by the Settings page). Remove.
- Next-payment link inside the summary is subtle; fine.

## What looks good (preserve)
- Emerald/brass/ivory palette and **dark-mode parity** — both themes premium, no
  invisible elements.
- **Fraunces + Inter** with tabular numerals — money never jitters.
- Floating **bottom tab bar** with raised center +, safe-area aware — the strongest
  app signal.
- **Pill sub-tabs**, 2×2 stat cards, consistent 16px card radius + single shadow scale.
- Upcoming page grouped-by-month list — clean rhythm.

## Top 3 fixes
1. **Home hero with an equity ring** — biggest visual-impact change; gives the app a focal "moment".
2. **Interaction/motion polish** — press-scale + smooth active states on nav and pills.
3. **Touch targets + remove dead `SettingsModal`** — quick correctness/cleanup.
