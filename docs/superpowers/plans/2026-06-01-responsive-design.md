# Responsive Design Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the LinkNyaMana dashboard responsive across small phones, normal phones, tablets, and wide/ultra-wide monitors.

**Architecture:** Targeted per-component refactor using Tailwind viewport breakpoints. Sidebar becomes tri-state (overlay on phone, icon rail on tablet, full on desktop) with a hybrid localStorage toggle. Domain grid scales to 6 columns on ultra-wide (full-width). Phone filter badges become horizontal-scroll rows. Dialogs get adaptive padding/scroll.

**Tech Stack:** Astro 6, React 19, Tailwind v4, lucide-react icons.

**Verification model:** No test runner is installed. Each task is verified by `npm run build` passing (catches TS/JSX errors) plus a described manual visual check. Commit after each task.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/hooks/useMediaQuery.ts` | **new** — React hook returning whether a media query matches; lazy-inits from `matchMedia` (no flash) |
| `src/lib/sidebar.ts` | **new** — read/write/toggle sidebar collapse preference in localStorage (mirrors `theme.ts`) |
| `src/components/Dashboard.tsx` | sidebar tri-state rendering + toggle button, domain grid columns, main padding, sort/analytics row |
| `src/components/StatusSummary.tsx` | stat-cards columns, phone horizontal-scroll filter rows, search font size |
| `src/components/ui/dialog.tsx` | adaptive padding + max-width clamp on phone |
| `src/components/AddDomainDialog.tsx` | add max-height + scroll |
| `src/components/EditDomainDialog.tsx` | add max-height + scroll |
| `src/components/ProgressReportDialog.tsx` | add overflow scroll to existing max-height |

Tasks are ordered so the small, low-risk, self-contained changes (dialogs, grid, filters) land first, and the sidebar tri-state (most complex, touches new files) lands last.

---

## Task 1: Domain grid columns + main padding

**Files:**
- Modify: `src/components/Dashboard.tsx:955` (grid classes), `src/components/Dashboard.tsx:869` (main padding)

- [ ] **Step 1: Update the domain grid columns**

In `src/components/Dashboard.tsx`, find this line (~955):

```tsx
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
```

Replace with:

```tsx
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1920px]:grid-cols-6">
```

- [ ] **Step 2: Update the main content padding**

In `src/components/Dashboard.tsx`, find this line (~869):

```tsx
          <div className="p-4 lg:p-6 space-y-6">
```

Replace with:

```tsx
          <div className="p-4 lg:p-6 xl:p-8 space-y-6">
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: build completes with no errors. (Astro prints "Complete!" / writes to `dist/`.)

- [ ] **Step 4: Manual visual check**

Run `npm run dev`, open the dashboard, and resize the browser:
- ≥1920px wide → 6 domain cards per row, content uses full width.
- 1536–1919px → 5 per row.
- 1280–1535px → 4 per row.
- 1024–1279px → 3 per row.
- 640–1023px → 2 per row.
- <640px → 1 per row.

- [ ] **Step 5: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(ui): scale domain grid to 6 cols on ultra-wide + larger padding"
```

---

## Task 2: Stat cards responsive columns

**Files:**
- Modify: `src/components/StatusSummary.tsx:105` (grid), `src/components/StatusSummary.tsx:156` (Actions card span)

- [ ] **Step 1: Move 6-column layout from `lg` to `xl`**

In `src/components/StatusSummary.tsx`, find (~105):

```tsx
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
```

Replace with:

```tsx
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
```

- [ ] **Step 2: Make the Actions card span 2 columns on small screens**

In `src/components/StatusSummary.tsx`, find the sixth `<Card>` (the "Actions" card, ~156):

```tsx
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
```

Replace the opening `<Card>` tag only with:

```tsx
        <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 4: Manual visual check**

- <640px: stat cards 2 per row; the Actions card spans the full width (its own row) so Refresh/Notify buttons aren't squashed.
- 640–1279px: 3 per row.
- ≥1280px: 6 per row in a single line.

- [ ] **Step 5: Commit**

```bash
git add src/components/StatusSummary.tsx
git commit -m "feat(ui): stat cards 6-col at xl, Actions card full-width on phone"
```

---

## Task 3: Phone horizontal-scroll filter rows + search font

**Files:**
- Modify: `src/components/StatusSummary.tsx:94-103` (search input), `src/components/StatusSummary.tsx:210-254` (status + category rows), `src/components/StatusSummary.tsx:256-299` (expiry row)

- [ ] **Step 1: Prevent iOS zoom on search focus**

In `src/components/StatusSummary.tsx`, find the search input (~96):

```tsx
        <input
          type="text"
          placeholder="Cari domain..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-9 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
```

Replace the `className` value so the font is `text-base` on phone and `text-sm` from `sm` up:

```tsx
        <input
          type="text"
          placeholder="Cari domain..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-9 py-2 text-base sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
```

- [ ] **Step 2: Make the status + category filter container scroll horizontally on phone**

In `src/components/StatusSummary.tsx`, find the outer wrapper that holds the status group and category group (~210):

```tsx
      <div className="flex flex-wrap gap-2">
      <div className="flex flex-wrap gap-1 rounded-lg border bg-card p-1">
```

Replace those two opening lines with (outer becomes a single scrollable row on phone, wraps from `sm`; status group gets `shrink-0`):

```tsx
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible sm:pb-0">
      <div className="flex shrink-0 gap-1 rounded-lg border bg-card p-1">
```

Then find the category group opening tag inside the same wrapper (~235):

```tsx
        <div className="flex flex-wrap gap-1">
```

Replace with:

```tsx
        <div className="flex shrink-0 gap-1 sm:flex-wrap">
```

- [ ] **Step 3: Make the expiry filter row scroll horizontally on phone**

In `src/components/StatusSummary.tsx`, find the expiry row container (~256):

```tsx
      <div className="flex gap-1 rounded-lg border bg-card p-1">
```

Replace with:

```tsx
      <div className="flex gap-1 overflow-x-auto rounded-lg border bg-card p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible">
```

- [ ] **Step 4: Make filter badges keep their width and have a comfortable tap target**

Each filter `<Badge>` in the status, category, and expiry groups uses `className="cursor-pointer"` (and the category badges `key=...`). For every filter badge in these three groups, change `className="cursor-pointer"` to `className="cursor-pointer shrink-0 px-2.5 py-1"`.

There are 3 status badges (All/Online/Offline), 1 + N category badges (All Categories + mapped), and 6 expiry badges (Semua/Expired/7/14/30/60). The mapped category badge is:

```tsx
            <Badge
              key={cat.name}
              variant={activeCategory === cat.name ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => onCategoryChange(cat.name)}
            >
              {cat.icon} {cat.name}
            </Badge>
```

becomes:

```tsx
            <Badge
              key={cat.name}
              variant={activeCategory === cat.name ? 'default' : 'outline'}
              className="cursor-pointer shrink-0 px-2.5 py-1"
              onClick={() => onCategoryChange(cat.name)}
            >
              {cat.icon} {cat.name}
            </Badge>
```

Apply the same `className="cursor-pointer shrink-0 px-2.5 py-1"` to the other 10 static filter badges (the 3 status, "All Categories", and 6 expiry badges). Do NOT change badges outside these filter groups.

- [ ] **Step 5: Verify build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 6: Manual visual check**

- 320px / 375px: status, category, and expiry filters each sit on a single row that scrolls sideways (no scrollbar visible) instead of wrapping into many rows. Tapping the search field does not zoom the page (iOS Safari).
- ≥640px: filters wrap normally as before; no horizontal scroll.

- [ ] **Step 7: Commit**

```bash
git add src/components/StatusSummary.tsx
git commit -m "feat(ui): horizontal-scroll filter rows + no-zoom search on phones"
```

---

## Task 4: Sort + analytics toggle row on phone

**Files:**
- Modify: `src/components/Dashboard.tsx:899-919`

- [ ] **Step 1: Stack the row on phone and make the select full-width**

In `src/components/Dashboard.tsx`, find (~899):

```tsx
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="text-xs"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              {showAnalytics ? 'Sembunyikan' : 'Tampilkan'} Analytics
            </Button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
            >
```

Replace the wrapper `<div>` and the `<select>` className:

```tsx
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="text-xs"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              {showAnalytics ? 'Sembunyikan' : 'Tampilkan'} Analytics
            </Button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs sm:w-auto"
            >
```

(Leave the `<option>` lines and the closing tags unchanged.)

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 3: Manual visual check**

- <640px: the Analytics button and the sort `<select>` stack vertically; the select is full-width.
- ≥640px: they sit side by side as before.

- [ ] **Step 4: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(ui): stack sort/analytics controls on phone"
```

---

## Task 5: Dialog adaptive padding + clamp + scroll

**Files:**
- Modify: `src/components/ui/dialog.tsx:35` (DialogContent base)
- Modify: `src/components/AddDomainDialog.tsx:89`
- Modify: `src/components/EditDomainDialog.tsx:112`
- Modify: `src/components/ProgressReportDialog.tsx:44`

- [ ] **Step 1: Make the dialog base padding adaptive and keep an edge margin on phone**

In `src/components/ui/dialog.tsx`, find the `DialogContent` className (~35). It currently contains `... w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg ...`.

Make two changes: `w-full` → `w-[calc(100%-2rem)]`, and `p-6` → `p-4 sm:p-6`. The full string becomes:

```tsx
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-4 sm:p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
```

**Why `w-[calc(100%-2rem)]` and not a second `max-w`:** `cn` here is `twMerge(clsx(...))` (see `src/lib/utils.ts`). twMerge keeps only the *last* `max-width` utility, so every per-dialog `max-w-md` / `max-w-2xl` override would strip any `max-w-*` we put in the base — the clamp would vanish. Width utilities are a different group, so changing `w-full` → `w-[calc(100%-2rem)]` survives the per-dialog `max-w-*` overrides. Effective width = `min(100vw - 2rem, max-w)`: on a 320px phone the dialog is `100vw - 2rem` (≈1rem margin each side); on desktop it's capped by the per-dialog `max-w-*` and centered as before.

- [ ] **Step 2: Add scroll to AddDomainDialog**

In `src/components/AddDomainDialog.tsx`, find (~89):

```tsx
      <DialogContent className="max-w-md">
```

Replace with:

```tsx
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
```

- [ ] **Step 3: Add scroll to EditDomainDialog**

In `src/components/EditDomainDialog.tsx`, find (~112):

```tsx
      <DialogContent className="max-w-md">
```

Replace with:

```tsx
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
```

- [ ] **Step 4: Add scroll to ProgressReportDialog**

In `src/components/ProgressReportDialog.tsx`, find (~44):

```tsx
      <DialogContent className="max-w-2xl max-h-[80vh]">
```

Replace with:

```tsx
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
```

- [ ] **Step 5: Verify build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 6: Manual visual check**

- 320px: open Add Domain / Edit Domain / Progress Report dialogs — they keep a ~1rem margin from each screen edge and have `p-4` padding (less cramped).
- Phone landscape (e.g. 667×375): the Add/Edit/Progress dialogs scroll internally instead of clipping below the viewport.
- ≥640px: dialogs look unchanged (`p-6`, original max widths).

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/dialog.tsx src/components/AddDomainDialog.tsx src/components/EditDomainDialog.tsx src/components/ProgressReportDialog.tsx
git commit -m "feat(ui): adaptive dialog padding/clamp + scroll on small screens"
```

---

## Task 6: useMediaQuery hook

**Files:**
- Create: `src/hooks/useMediaQuery.ts`

- [ ] **Step 1: Create the hook**

Create `src/hooks/useMediaQuery.ts`:

```ts
import { useState, useEffect } from 'react'

/**
 * Media-query hook. Lazily initializes from `window.matchMedia` on the first
 * render so the correct value is available before paint (no flash). The
 * Dashboard island is client-only — see Task 7 — so `window` always exists
 * here; the `typeof window` guard is defensive only.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia(query)
    setMatches(mql.matches)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

/** True when viewport is tablet-or-wider (>=768px, Tailwind `md`). */
export function useIsTabletUp(): boolean {
  return useMediaQuery('(min-width: 768px)')
}

/** True when viewport is desktop-or-wider (>=1024px, Tailwind `lg`). */
export function useIsDesktopUp(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: build completes with no errors. (Hook is unused for now — that's fine; it's wired up in Task 8.)

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useMediaQuery.ts
git commit -m "feat: add useMediaQuery hook (lazy-init from matchMedia)"
```

---

## Task 7: sidebar preference lib

The sidebar collapse preference is stored in localStorage. No html-class / anti-flash script is needed: `Dashboard` renders only client-side (AppShell returns `null` while resolving auth, so the island never participates in SSR), and `useMediaQuery` lazily reads `matchMedia` on its first render — so the correct width is computed before paint. `Layout.astro` is left unchanged.

**Files:**
- Create: `src/lib/sidebar.ts`

- [ ] **Step 1: Create the sidebar preference lib**

Create `src/lib/sidebar.ts` (mirrors `src/lib/theme.ts`):

```ts
const STORAGE_KEY = 'sidebar-collapsed'

/**
 * Returns the user's explicit collapse preference, or null if they have
 * never toggled (in which case the breakpoint default applies).
 */
export function getSidebarPref(): boolean | null {
  if (typeof window === 'undefined') return null
  const v = localStorage.getItem(STORAGE_KEY)
  if (v === 'true') return true
  if (v === 'false') return false
  return null
}

export function setSidebarPref(collapsed: boolean) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, collapsed ? 'true' : 'false')
}

/** Toggle from a known current state; returns the new collapsed value. */
export function toggleSidebarPref(current: boolean): boolean {
  const next = !current
  setSidebarPref(next)
  return next
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/sidebar.ts
git commit -m "feat: add sidebar collapse preference lib"
```

---

## Task 8: Sidebar tri-state rendering + toggle

This is the largest task. The sidebar must render in three visual modes and expose a collapse toggle. We compute a single boolean `railMode` (icons-only) from breakpoint + preference, and keep the existing `sidebarOpen` for the phone overlay.

**Logic:**
- Phone (`<lg`, but specifically the overlay is shown `<lg`): keep existing overlay behavior driven by `sidebarOpen`. Overlay is always full width (`w-64`), never rail.
- Tablet/desktop permanent sidebar (`lg:static`): width is `w-64` when expanded, `w-16` when `railMode`.
- `railMode` = (user pref collapsed) when pref is set; otherwise (tablet && !desktop) i.e. default-collapse on tablet only.

**Files:**
- Modify: `src/components/Dashboard.tsx` — imports, state, aside classes, nav item rendering, toggle button

- [ ] **Step 1: Add imports**

In `src/components/Dashboard.tsx`, the lucide import line (~16) already imports many icons. Add `PanelLeftClose` and `PanelLeft` to that import list. Find:

```tsx
import { Loader2, Menu, X, Shield, LayoutDashboard, Activity, LogOut, Plus, ChevronDown, Archive, Trash2, Pencil, Search, KeyRound, Sun, Moon, Upload, BarChart3, ArrowUpDown, Settings, Bell, Terminal } from 'lucide-react'
```

Replace with:

```tsx
import { Loader2, Menu, X, Shield, LayoutDashboard, Activity, LogOut, Plus, ChevronDown, Archive, Trash2, Pencil, Search, KeyRound, Sun, Moon, Upload, BarChart3, ArrowUpDown, Settings, Bell, Terminal, PanelLeftClose, PanelLeft } from 'lucide-react'
```

Then add hook + lib imports after the `useKeyboardShortcuts` import (~21):

```tsx
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
```

Replace with:

```tsx
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useIsTabletUp, useIsDesktopUp } from '@/hooks/useMediaQuery'
import { getSidebarPref, toggleSidebarPref } from '@/lib/sidebar'
```

- [ ] **Step 2: Add collapse state + derived railMode**

In `src/components/Dashboard.tsx`, after the `sidebarOpen` state line (~60):

```tsx
  const [sidebarOpen, setSidebarOpen] = useState(false)
```

Add below it:

```tsx
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarPref, setSidebarPrefState] = useState<boolean | null>(() => getSidebarPref())
  const isTabletUp = useIsTabletUp()
  const isDesktopUp = useIsDesktopUp()
  // Rail (icons-only) for the permanent sidebar shown at >=lg.
  // Pref wins when set; otherwise default-collapse on tablet (md..lg), full on desktop.
  const railMode = isDesktopUp
    ? (sidebarPref ?? false)
    : isTabletUp
      ? (sidebarPref ?? true)
      : false

  const handleToggleSidebar = () => {
    const current = sidebarPref ?? (isTabletUp && !isDesktopUp)
    const next = toggleSidebarPref(current)
    setSidebarPrefState(next)
  }
```

- [ ] **Step 3: Make the permanent sidebar visible from `md` and width-react to railMode**

In `src/components/Dashboard.tsx`, find the `<aside>` className block (~647):

```tsx
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 border-r bg-card transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
```

Replace with (permanent from `md`, width animates between rail and full, overlay still full width on phone):

```tsx
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 border-r bg-card transition-all duration-300 md:translate-x-0 md:static md:z-auto',
          railMode ? 'md:w-16' : 'md:w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
```

- [ ] **Step 4: Hide the mobile header from `md` instead of `lg`**

Because the permanent sidebar now appears at `md`, the mobile top header (hamburger) must hide at `md`. Find (~853):

```tsx
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-card px-4 py-3 lg:hidden">
```

Replace with:

```tsx
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-card px-4 py-3 md:hidden">
```

- [ ] **Step 5: Hide the overlay backdrop from `md`**

Find the backdrop (~845):

```tsx
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
```

Replace `lg:hidden` with `md:hidden`:

```tsx
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
```

- [ ] **Step 6: Update the sidebar header (logo) for rail mode + add toggle button**

Find the sidebar header block (~654):

```tsx
          <div className="flex items-center gap-2 border-b p-4">
            <Shield className="h-6 w-6 text-primary" />
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-sm">LinkNyaMana</h1>
              <p className="text-[10px] text-muted-foreground truncate">{user.display_name}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
```

Replace with (hide text in rail mode; show a collapse toggle on `md+`; keep the mobile close button on phone):

```tsx
          <div className={cn('flex items-center gap-2 border-b p-4', railMode && 'md:justify-center md:px-2')}>
            <Shield className="h-6 w-6 text-primary shrink-0" />
            <div className={cn('min-w-0 flex-1', railMode && 'md:hidden')}>
              <h1 className="font-bold text-sm">LinkNyaMana</h1>
              <p className="text-[10px] text-muted-foreground truncate">{user.display_name}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={cn('shrink-0 hidden md:inline-flex', railMode && 'md:hidden')}
              onClick={handleToggleSidebar}
              title="Ciutkan sidebar"
            >
              <PanelLeftClose className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden shrink-0"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
```

- [ ] **Step 7: Add an expand button shown only in rail mode**

Immediately after the closing `</div>` of the sidebar header block (the one updated in the previous step), add a rail-only expand button:

```tsx
          {railMode && (
            <button
              onClick={handleToggleSidebar}
              className="hidden md:flex items-center justify-center border-b p-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              title="Lebarkan sidebar"
            >
              <PanelLeft className="h-5 w-5" />
            </button>
          )}
```

- [ ] **Step 8: Collapse the category filter input in rail mode**

The nav (~670) starts with a filter input. In rail mode it should hide. Find:

```tsx
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter kategori..."
                value={sidebarFilter}
                onChange={(e) => setSidebarFilter(e.target.value)}
                className="w-full rounded-md border border-input bg-background pl-7 pr-2 py-1.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
```

Wrap it so it hides in rail mode by changing the wrapper div className:

```tsx
            <div className={cn('relative mb-2', railMode && 'md:hidden')}>
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter kategori..."
                value={sidebarFilter}
                onChange={(e) => setSidebarFilter(e.target.value)}
                className="w-full rounded-md border border-input bg-background pl-7 pr-2 py-1.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
```

- [ ] **Step 9: Hide text labels of the main nav buttons in rail mode**

For the "Semua Domain" button (~682), the category-list wrapper (~701), and the "Arsip" button (~762), text content must hide in rail mode while icons stay. Apply these changes:

"Semua Domain" button — it currently opens `<button className={cn(...)} onClick={...}>`. Add a `title` so the rail icon has a hover tooltip. Find the opening tag (~682):

```tsx
            <button
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                activeCategory === null && viewMode === 'active'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              onClick={() => {
```

Add `title="Semua Domain"` to that opening `<button>` tag (after the `className={cn(...)}` prop). Then change its inner content. Find:

```tsx
              <ChevronDown className={cn('h-4 w-4 transition-transform', categoriesExpanded && 'rotate-180')} />
              <LayoutDashboard className="h-4 w-4" />
              <span>Semua Domain</span>
```

Replace with:

```tsx
              <ChevronDown className={cn('h-4 w-4 transition-transform shrink-0', categoriesExpanded && 'rotate-180', railMode && 'md:hidden')} />
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span className={cn(railMode && 'md:hidden')}>Semua Domain</span>
```

Category-list wrapper — find (~701):

```tsx
            <div className={cn(
              'overflow-hidden transition-all duration-200',
              categoriesExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
            )}>
```

Replace with (whole expandable category list hides in rail mode — categories are reachable via the filter badges and after expanding):

```tsx
            <div className={cn(
              'overflow-hidden transition-all duration-200',
              categoriesExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0',
              railMode && 'md:hidden'
            )}>
```

"Arsip" button — add a `title="Arsip"` to its opening `<button>` tag (~762, the one with `onClick` that sets `viewMode` to `'archive'`), then find (~775):

```tsx
              <Archive className="h-4 w-4" />
              <span>Arsip</span>
```

Replace with:

```tsx
              <Archive className="h-4 w-4 shrink-0" />
              <span className={cn(railMode && 'md:hidden')}>Arsip</span>
```

- [ ] **Step 10: Collapse the admin "Kelola" tools + footer labels in rail mode**

The admin tools section (~780) and footer (~827). For rail mode, hide the "Kelola" expandable section entirely (its items are admin-only and text-heavy), and keep footer icon buttons (they're already icon-only).

Find the admin tools opening (~780):

```tsx
          {isAdmin(user) && (
            <div className="border-t px-3 py-2">
              <button
                onClick={() => setAdminToolsOpen(!adminToolsOpen)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
```

Replace the wrapper `<div>` className to hide in rail mode:

```tsx
          {isAdmin(user) && (
            <div className={cn('border-t px-3 py-2', railMode && 'md:hidden')}>
              <button
                onClick={() => setAdminToolsOpen(!adminToolsOpen)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
```

The footer (~827) holds icon-only buttons plus a trailing name span. Find:

```tsx
          <div className="shrink-0 border-t px-3 py-2 flex items-center gap-1">
```

Replace with (center icons + wrap in rail mode, hide the trailing name span):

```tsx
          <div className={cn('shrink-0 border-t px-3 py-2 flex items-center gap-1', railMode && 'md:flex-wrap md:justify-center')}>
```

Then find the trailing name span (~837):

```tsx
            <span className="flex-1" />
            <span className="text-[9px] text-muted-foreground" title="/ search · r refresh · Esc close">
              {user.display_name.split(' ')[0]}
            </span>
```

Replace with:

```tsx
            <span className={cn('flex-1', railMode && 'md:hidden')} />
            <span className={cn('text-[9px] text-muted-foreground', railMode && 'md:hidden')} title="/ search · r refresh · Esc close">
              {user.display_name.split(' ')[0]}
            </span>
```

- [ ] **Step 11: Verify build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 12: Manual visual check**

- 375px (phone): hamburger header visible; tapping it slides in the full `w-64` sidebar over a backdrop; no rail.
- 800px (tablet, no stored pref): sidebar is permanently visible as a narrow `w-16` icon rail; an expand chevron/panel button appears; clicking it widens to `w-64` and persists.
- 1100px (desktop, no stored pref): sidebar is full `w-64`; a collapse button is in the header; clicking it shrinks to rail and persists.
- Reload after toggling: state is preserved with no flash (the `<html>` gets `sidebar-collapsed` before hydration).

- [ ] **Step 13: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(ui): tri-state sidebar (overlay/rail/full) with hybrid toggle"
```

---

## Task 9: Final full build + cross-breakpoint sweep

**Files:** none (verification only)

- [ ] **Step 1: Clean build**

Run: `npm run build`
Expected: completes with no errors or type warnings.

- [ ] **Step 2: Cross-breakpoint manual sweep**

Run `npm run dev` and verify at each width using DevTools device toolbar:

- **320px:** filters scroll horizontally; dialogs keep edge margin + `p-4`; stat cards 2-col with Actions full-width; 1 domain card/row; search doesn't zoom.
- **375px:** same as 320 with slightly more room.
- **768px:** icon rail sidebar (default), tooltips on hover; 2 domain cards/row; hamburger gone.
- **1024px:** full sidebar (default); 3 domain cards/row; stat cards still 3-col (6-col starts at xl).
- **1280px:** stat cards 6-col; 4 domain cards/row; `xl:p-8` padding.
- **1440px:** 4 domain cards/row, full-width.
- **1920px:** 6 domain cards/row, full-width.
- Sidebar collapse/expand persists across reload at tablet and desktop with no flash.

- [ ] **Step 3: Commit (if any tweaks were needed)**

If the sweep surfaced small fixes, commit them:

```bash
git add -A
git commit -m "fix(ui): responsive sweep adjustments"
```

If no changes were needed, skip this step.

---

## Self-Review Notes

- **Spec coverage:** Sidebar tri-state + hybrid toggle (Tasks 6–8) ✓; grid + padding (Task 1) ✓; stat cards (Task 2) ✓; phone filter scroll + search font (Task 3) ✓; sort/analytics row (Task 4) ✓; dialog padding/clamp/scroll (Task 5) ✓; flash prevention via lazy-init `useMediaQuery` (Task 6) — replaces the spec's html-class script, which would have been dead code since nothing consumes the class and the Dashboard island is client-only behind AppShell's auth gate; sidebar pref lib (Task 7) ✓; verification sweep (Task 9) ✓.
- **Breakpoint note:** Spec table said rail at `md` (768–1023) and overlay `<768`. Implementation makes the permanent sidebar appear at `md` (Task 8 Step 4) and moves the hamburger/backdrop hide from `lg` to `md` (Steps 5–6) to match. The Tailwind rail width classes use `md:` so they apply across the whole permanent-sidebar range.
- **Type consistency:** lib exports `getSidebarPref` / `setSidebarPref` / `toggleSidebarPref` (Task 7) — Task 8 Step 1 imports only `getSidebarPref` and `toggleSidebarPref`, both present. Hook exports `useIsTabletUp` / `useIsDesktopUp` (Task 6) match Task 8 imports.
