# Actions Redesign — Move Refresh + Check&Notify out of the stat grid

**Date:** 2026-06-01
**Status:** Approved design, pending implementation plan

## Problem

The stat-summary grid (`StatusSummary.tsx`) has six cards. Five are pure statistics (Total / Online / Offline / Expiring Soon / Expired — each a big number). The sixth, "Actions", is structurally different: a header plus two stacked buttons (Refresh, Check & Notify) plus a notify-result text block. Cramming an action panel in as a "stat card" looks out of place and crowded, especially at narrow widths.

## Goal

Remove the Actions card entirely. Relocate **Refresh** to the dashboard header, move **Check & Notify** into the sidebar "Kelola" admin menu, and surface the notify result as a toast. The stat grid becomes five uniform number cards.

## Design

### 1. Remove the Actions card from the stat grid

In `StatusSummary.tsx`, delete the sixth `<Card>` (the "Actions" card: header + Refresh button + Check & Notify button + `notifyResult` block).

Grid columns change from six to five:
- `grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6` → `grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5`.
- The `col-span-2 sm:col-span-1` that was on the Actions card is gone with it. The five remaining cards: 2-col on phone (Expired alone on the last row — acceptable), 3-col at `sm`, 5-col at `xl`.

These props become unused by `StatusSummary` and are **removed** from its props interface (they move to `Dashboard`'s direct use): `onRefresh`, `isRefreshing`, `onNotifyExpiring`, `isNotifying`, `notifyResult`, `isStaffwebdev`. The search box, stat cards, and filter rows remain.

### 2. Refresh button in the header

Refresh calls the existing `checkAllStatuses(true)` in `Dashboard`. It appears in two places (one is visible at a time, by breakpoint):

- **Mobile** (`md:hidden` sticky header, ~`Dashboard.tsx:853`): an icon-only ghost button (`RefreshCw`), `RefreshCw` spins (`animate-spin`) while `isRefreshing`, `title="Refresh"`, `aria-label="Refresh"`, disabled while refreshing. Placed at the right end of the header row.
- **Desktop**: the title block (~`Dashboard.tsx:870`) becomes `flex items-start justify-between gap-3`. Title + greeting on the left; on the right a `Button size="sm"` with `RefreshCw` icon + "Refresh" label, shown `hidden md:inline-flex` (mobile already has its own in the header). Spinner + disabled while `isRefreshing`.

The existing "Checking status… X/Y domains" progress bar (`Dashboard.tsx:923`) is unchanged.

### 3. Check & Notify in the sidebar "Kelola" menu

In the admin tools group (`adminToolsOpen` block, ~`Dashboard.tsx:794`), add an item alongside the existing ones (Domain / Kategori / Import / Progress Report / Notifikasi / User / Console), admin-only:

```
<Bell icon> Check & Notify
```

onClick → `handleNotifyExpiring()` (already defined in `Dashboard`), then `setSidebarOpen(false)`. Disabled while `isNotifying`; show a small inline spinner or "..." affordance on the item label while running (reuse the existing item styling; swap the Bell for a spinning `Loader2` while `isNotifying`).

### 4. Toast for the notify result (Radix)

- Add dependency `@radix-ui/react-toast@1.2.15`.
- New `src/components/ui/toast.tsx`: a thin Radix wrapper exporting `ToastProvider`, `ToastViewport`, `Toast`, `ToastTitle`, `ToastDescription`, `ToastClose` — mirroring the forwardRef + `cn` + theme-token pattern of `ui/dialog.tsx` / `ui/dropdown-menu.tsx`. Viewport fixed bottom-right.
- `Dashboard` mounts `<ToastProvider>` wrapping its tree and renders one `<Toast>` driven by the existing `notifyResult` state plus a new `toastOpen` boolean.
- Flow: `handleNotifyExpiring()` already sets `notifyResult` when done. On that set, open the toast: title "Notifikasi terkirim" (or "Gagal mengirim" when `sent === 0 && failed > 0`), description `"<sent> terkirim · <failed> gagal"`, plus the first error line when `notifyResult.errors?.[0]` exists. Auto-dismiss ~5s (Radix `duration`), with a close (✕) button. Variant color: success when `failed === 0`, destructive-tinted when `failed > 0`.

### Files Changed

| File | Change |
|---|---|
| `src/components/ui/toast.tsx` | **new** — Radix toast wrapper |
| `package.json` | add `@radix-ui/react-toast` |
| `src/components/StatusSummary.tsx` | remove Actions card + the 6 now-unused props; grid 6→5 |
| `src/components/Dashboard.tsx` | Refresh in mobile header + desktop title block; Check & Notify in Kelola menu; mount ToastProvider/Viewport; wire `notifyResult` → toast; stop passing removed props to `StatusSummary` |

### Visual reference

Desktop title block:
```
Dashboard                                    [↻ Refresh]
Halo, Staff Webdev — Monitor website uptime ...
```
Mobile sticky header:
```
[☰] LinkNyaMana                                      [↻]
    Staff Webdev
```
Toast (bottom-right, after Check & Notify):
```
┌─────────────────────────────┐
│ Notifikasi terkirim       ✕ │
│ 5 terkirim · 0 gagal        │
└─────────────────────────────┘
```

## Out of Scope (YAGNI)

- No change to the refresh progress bar, the auto-refresh interval, or `checkAllStatuses` / `handleNotifyExpiring` logic — only where their triggers live.
- Toast is used only for the notify result; no general toast usage elsewhere in this change.
- No change to the other five stat cards' content.

## Verification

- `npm run build` passes (no TS/build errors) — especially: `StatusSummary` no longer references the removed props; `Dashboard` passes the trimmed prop set.
- Manual visual check (dev server) at 375px and 1280px:
  - Stat grid shows five uniform number cards; no Actions card.
  - Mobile: header shows an icon Refresh that spins while checking; tapping it triggers a check.
  - Desktop: title block shows "↻ Refresh" on the right; clicking triggers a check; progress bar appears as before.
  - Sidebar "Kelola" (admin) has a "Check & Notify" item; clicking it runs the notify and a toast appears bottom-right with the sent/failed counts, auto-dismissing.
