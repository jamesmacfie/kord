# Design — Kord

A locked design system for the Kord app. Every app surface should read this file
before adding page-level UI. The system is for a working practice app, not a
marketing site.

## Genre
Atmospheric app, restrained for daily music practice.

## Macrostructure family
- Marketing pages: none currently.
- App pages: Workbench. Dense controls sit beside or below the live practice
  artifact. The chord diagram, generated loop, timer, and coverage panels carry
  the interface.
- Content pages: Long Document only if future help or release notes are added.

## Theme
- `--color-paper`   oklch(13.5% 0.018 268)
- `--color-paper-2` oklch(16.5% 0.021 268)
- `--color-paper-3` oklch(20.5% 0.025 268)
- `--color-ink`     oklch(94% 0.012 104)
- `--color-ink-2`   oklch(77% 0.02 108)
- `--color-rule`    oklch(31% 0.03 268)
- `--color-accent`  oklch(78% 0.16 148)
- `--color-focus`   oklch(84% 0.15 148)

## Typography
- Display: Tomorrow, weight 700, normal.
- Body: Manrope, weight 400.
- Mono: Geist Mono or JetBrains Mono fallback, for future technical labels only.
- Display tracking: 0.
- Type scale anchor: app headings use fixed rem steps, not viewport-scaled type.

## Spacing
4-point named scale. Values live in `tokens.css`; app CSS uses named tokens.

## Motion
- Easings: `--ease-out`, `--ease-in`, `--ease-in-out`.
- Reveal pattern: none for tab changes; state feedback only.
- Reduced-motion fallback: transitions collapse to 150 ms.

## Microinteractions stance
- Silent success. Visible state changes are the confirmation.
- Hover has a focus equivalent.
- Pressed controls move 1 px; focus rings appear instantly.
- Bottom tab dock on mobile keeps section switching thumb-reachable.

## CTA voice
- Primary action: accent fill, compact rectangle, verb-first labels.
- Secondary action: dark inset surface with a clear border.

## Per-page allowances
- App pages must not use hero enrichment. Function carries the page.
- Semantic chord colours are allowed for interval roles only.

## What pages MUST share
- The Kord wordmark treatment.
- Dark practice-room paper and electric green accent.
- Tomorrow display with Manrope body.
- Compact app-workbench spacing.
- Mobile bottom tab dock for the primary four app sections.

## What pages MAY differ on
- Panel density.
- Data visualisation layout.
- Whether a control column is sticky on desktop.

## Exports

### tokens.css
See `tokens.css` at the project root.
