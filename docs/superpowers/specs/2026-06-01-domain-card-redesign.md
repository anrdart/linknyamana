# DomainCard Redesign — Header-First Layout

**Date:** 2026-06-01
**Status:** Approved design, pending implementation plan

## Problem

In the current `DomainCard` (`src/components/DomainCard.tsx`), the domain **name and URL** sit in the left column of a single flex row that also holds the status dot, a spinner, response-time text, SSL icon, expiry badge, status badge, and the admin action buttons. With `min-w-0 flex-1 truncate`, the name/URL get squeezed and truncated because the badges and action buttons compete for the same horizontal space — the most important information (which site this is) is the hardest to read.

## Goal

Give the domain name and URL their own full-width row at the top of the card so they're always readable, and reflow everything else into a tidy second row below.

## Design

### Card structure (CardContent → three vertical sections)

**Section 1 — Header (name + URL), full width:**
- Domain name: `font-medium text-sm truncate` (full card width available).
- URL: `text-xs text-muted-foreground truncate`.
- "Deep checked: <time ago>" line: kept as-is when `domain.lastDeepChecked` exists (`text-[10px]`).
- **No status dot, no spinner.** The checking state is already conveyed by the card's `animate-shimmer` and the amber "Checking..." status badge — the dot and `Loader2` spinner are redundant and removed.

**Section 2 — Info + actions row (`flex items-center justify-between gap-2`):**
- Left group (`flex flex-wrap items-center gap-1.5`): response time (`<ms>`), expiry badge, status badge, and the SSL icon when present. Same badge components/variants as today, just relocated.
- Right group — admin actions (only when `isStaffwebdev`):
  - **Desktop (`sm+`):** inline archive / edit / delete buttons, hover-revealed via `opacity-0 group-hover:opacity-100 transition-opacity` on a `hidden sm:flex` container. (`Card` already has the `group` class.)
  - **Mobile (`<sm`):** a kebab button (`MoreVertical` icon) shown via `sm:hidden`; tapping it opens a Radix dropdown menu with the same three actions (Pindah Arsip / Edit / Hapus). Delete keeps its `window.confirm` guard.

**Section 3 — WordPress progress:** the existing `cms !== 'custom'` progress block, unchanged, below the info row.

### Checking state

Card keeps `animate-shimmer` while `domain.status === 'checking'`; the status badge reads "Checking..." (amber). No dot, no spinner.

### New component

`src/components/ui/dropdown-menu.tsx` — a thin wrapper around `@radix-ui/react-dropdown-menu`, mirroring the pattern of the existing `src/components/ui/dialog.tsx` (exports `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`). New dependency: `@radix-ui/react-dropdown-menu`.

### Visual reference (mobile)

```
┌─────────────────────────────────┐
│ Qurban Cibubur Jaya Makmur      │
│ https://qurbancibubur.com       │
│                                 │
│ 120ms  183d left  Online     ⋯  │
│ ─────────────────────────────── │
│ ✓ 5/23 steps              22%   │
│ ▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░    │
└─────────────────────────────────┘
```

Desktop differs only in the right side of the info row: the kebab is hidden and the three action icons appear on card hover.

## Files Changed

| File | Change |
|---|---|
| `src/components/ui/dropdown-menu.tsx` | **new** — Radix dropdown-menu wrapper |
| `src/components/DomainCard.tsx` | restructure CardContent into header / info+actions / progress; remove status dot + `Loader2` spinner; add kebab dropdown for mobile actions |
| `package.json` | add `@radix-ui/react-dropdown-menu` |

## Out of Scope (YAGNI)

- The SSL icon block (`sslInfo`) is dead code today — `sslExpiryDate` is never passed from `Dashboard`. Left untouched; not removed and not wired up.
- No change to card colors, archived-state styling, or the progress bar.
- No change to `Dashboard` grid or how cards are mapped.

## Verification

- `npm run build` passes (no TS/build errors).
- Manual visual check (dev server) at 375px and 1280px:
  - Name + URL on their own top row, fully readable (no truncation from competing badges at typical widths).
  - No status dot or spinner; checking state shows shimmer + amber "Checking..." badge.
  - Desktop: action icons appear on card hover; kebab hidden.
  - Mobile: kebab visible; tapping opens dropdown with Arsip / Edit / Hapus; delete still confirms.
