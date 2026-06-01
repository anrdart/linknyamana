# Responsive Design Improvements — LinkNyaMana Dashboard

**Date:** 2026-06-01
**Status:** Approved design, pending implementation plan

## Goal

Make the dashboard responsive-friendly across four device classes, all equally important:

- **Wide / ultra-wide monitors** (≥1440px, ≥1920px)
- **Tablet** (768–1023px)
- **Normal phones** (360–430px)
- **Small phones** (≤360px)

## Stack Context

- Astro 6 + React 19 + Tailwind v4 (single-page dashboard rendered via `AppShell client:load`).
- Theme handling already uses `localStorage` + class toggle on `documentElement`, with an inline anti-flash script in `Layout.astro`. The sidebar collapse state follows the same pattern.
- Tailwind default breakpoints are sufficient: `sm=640 md=768 lg=1024 xl=1280 2xl=1536`. Ultra-wide uses the arbitrary variant `min-[1920px]:`. No custom breakpoints added.
- No test runner installed. Verification = `npm run build` passes (no TS/build errors) + manual visual check at 320 / 375 / 768 / 1024 / 1440 / 1920 px.

## Approach

Targeted, per-component refactor (not container queries). The problems are viewport-level (sidebar layout, grid columns, global padding), so media-query / viewport breakpoints are the right tool. Each change is isolated and reviewable per breakpoint.

## Design

### 1. Sidebar tri-state + hybrid toggle

The sidebar has three modes driven by viewport width:

| Viewport            | Mode    | Behavior                                                  |
|---------------------|---------|----------------------------------------------------------|
| `<768px` (phone)    | Overlay | Hamburger → slide-in full `w-64`, backdrop (current)     |
| `768–1023px` (`md`) | Rail    | Permanent, narrow `w-16`, icons only + hover tooltips     |
| `≥1024px` (`lg+`)   | Full    | Permanent `w-64` (current)                                |

**Hybrid toggle:**
- A collapse/expand button lives in the sidebar.
- State `sidebarCollapsed` persisted to `localStorage` key `sidebar-collapsed`.
- Default (no preference): rail on tablet, full on desktop (pure breakpoint).
- Once the user toggles, the preference wins on `md+` (tablet & desktop). Phones (`<md`) always use overlay; the toggle does not apply there.

**Rail details:**
- Width `w-16`. Nav items show icon only; the category/label text is hidden and surfaced as a `title` tooltip on hover.
- The "Semua Domain", category list, "Arsip", "Kelola" tools, and footer buttons all degrade to icon-only in rail mode.

**Flash prevention:** no inline html-class script is needed. The `Dashboard` island renders only client-side (AppShell returns `null` while resolving the auth check, so it never participates in SSR/hydration), and `useMediaQuery` lazily initializes from `window.matchMedia` on its first render — so the correct sidebar width is computed before paint. `Layout.astro` is unchanged.

**New hook `src/hooks/useMediaQuery.ts`:** detects `md`/`lg` for React logic (sidebar rail vs full decision, whether the toggle applies); lazy-inits from `matchMedia`.

**New lib `src/lib/sidebar.ts`:** `getSidebarCollapsed()` / `setSidebarCollapsed()` / `toggleSidebar()` — mirrors `src/lib/theme.ts`.

### 2. Grid domain & stat cards

**Domain grid** (`Dashboard.tsx:955`). Full-width, aggressive columns (no max-width cap):

```
from: grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4
to:   grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1920px]:grid-cols-6
```

Phone 1, tablet 2, `lg` 3, `xl` 4, `2xl` 5, ultra-wide 6.

**Stat cards** (`StatusSummary.tsx:105`):

```
from: grid-cols-2 sm:grid-cols-3 lg:grid-cols-6
to:   grid-cols-2 sm:grid-cols-3 xl:grid-cols-6
```

- Move the 6-column layout from `lg` to `xl` so tablet landscape (1024px) isn't over-packed.
- The "Actions" card (6th, holds Refresh + Notify buttons) becomes `col-span-2 sm:col-span-1` so its buttons don't get squashed on phones.

**Main padding:** `p-4 lg:p-6` → `p-4 lg:p-6 xl:p-8` for breathing room on large screens. No max-width wrapper (full-width by decision).

### 3. Filter badges & navigation on phones (primary phone focus)

`StatusSummary` has three badge groups (status / category / expiry) using `flex flex-wrap`, which stack into many rows on ≤360px phones, eating vertical space and producing tiny tap targets.

1. **Status + Expiry filters** (`StatusSummary.tsx:210–299`): on phones, single-row **horizontal scroll** instead of multi-row wrap. `flex gap-1 overflow-x-auto [scrollbar-width:none] snap-x`; each badge `shrink-0`. Restore normal flex/wrap at `sm+`. Bump tap target to `py-1.5 px-2.5` (~32px tall).
2. **Category badges**: phone `overflow-x-auto` single row too, so they don't push content down (categories are also in the sidebar; this is a quick shortcut).
3. **Search input** (`StatusSummary.tsx:94`): add `text-base sm:text-sm` so iOS doesn't auto-zoom on focus (fonts <16px trigger zoom).
4. **Sort + Analytics toggle row** (`Dashboard.tsx:899–919`): `flex-col` on phone → `flex-row` at `sm`. The `<select>` sort is `w-full sm:w-auto` on phone.

### 4. Dialog adaptive sizing (minimal touch)

Phone focus is filters/nav, not dialogs, so only minimal safe edits in `ui/dialog.tsx` base — no per-dialog rewrite:

- `DialogContent`: `p-6` → `p-4 sm:p-6`; add `max-w-[calc(100vw-2rem)]` so it never touches screen edges on small phones. Per-dialog `max-w-*` overrides still apply.
- Dialogs already with `max-h-[90vh] overflow-y-auto` (DomainDetail, UserManagement) are fine. Add `max-h-[90vh] overflow-y-auto` to the ones missing it: `AddDomainDialog`, `EditDomainDialog`, `ProgressReportDialog` — so they don't clip in phone landscape.

## Files Changed

| File | Change |
|---|---|
| `src/hooks/useMediaQuery.ts` | **new** — breakpoint detection, lazy-init (no flash) |
| `src/lib/sidebar.ts` | **new** — get/set/toggle collapse (theme.ts pattern) |
| `src/components/Dashboard.tsx` | sidebar tri-state + toggle, domain grid, padding, sort row |
| `src/components/StatusSummary.tsx` | stat cards, filter horizontal-scroll on phone, search font |
| `src/components/ui/dialog.tsx` | adaptive padding & width on phone |
| `src/components/AddDomainDialog.tsx` | add max-h scroll |
| `src/components/EditDomainDialog.tsx` | add max-h scroll |
| `src/components/ProgressReportDialog.tsx` | add max-h scroll |

## Verification

- `npm run build` passes with no TypeScript/build errors.
- Manual visual check at 320, 375, 768, 1024, 1440, 1920 px (browser DevTools):
  - 320/375: filter badges scroll horizontally in one row; search doesn't trigger iOS zoom; dialogs don't touch screen edges.
  - 768: sidebar shows as rail (icons + tooltips); domain grid 2 cols.
  - 1024: sidebar full or per-preference; stat cards 3 cols; domain grid 3 cols.
  - 1440: domain grid 4 cols; padding `xl:p-8`.
  - 1920: domain grid 6 cols, full-width.
  - Sidebar toggle persists across reload (no flash on load).

## Out of Scope (YAGNI)

- Container queries.
- Max-width content cap (explicitly rejected — full-width chosen).
- Reworking individual dialog internals beyond padding/scroll.
- DomainCard internal layout changes (action buttons), per phone-focus decision.
