# Actions Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the "Actions" card from the stat grid; move Refresh into the dashboard header, Check & Notify into the sidebar "Kelola" menu, and show the notify result as a Radix toast.

**Architecture:** Add a Radix toast UI wrapper. `Dashboard` already owns `checkAllStatuses`, `handleNotifyExpiring`, `isRefreshing`, `isNotifying`, `notifyResult` — we relocate their UI triggers (header button, sidebar item) and render a toast from `notifyResult`. `StatusSummary` loses the Actions card and six now-unused props; its grid goes 6→5 columns.

**Tech Stack:** React 19, Astro 6, Tailwind v4, Radix UI, lucide-react.

**Verification model:** No test runner. Each task verified by `npm run build` passing + a described manual visual check. Commit after each task.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/components/ui/toast.tsx` | **new** — Radix toast wrapper (Provider/Viewport/Root/Title/Description/Close) |
| `package.json` | add `@radix-ui/react-toast` |
| `src/components/StatusSummary.tsx` | remove Actions card + 6 unused props; stat grid 6→5 |
| `src/components/Dashboard.tsx` | Refresh in mobile header + desktop title block; Check & Notify in Kelola; mount ToastProvider/Viewport; toast from `notifyResult`; trim props passed to StatusSummary |

Order: Task 1 adds the toast primitive (self-contained, unused). Task 2 trims StatusSummary (drops the card + props). Task 3 wires Dashboard (header/sidebar/toast) — done last because it depends on both the trimmed StatusSummary props and the toast component.

---

## Task 1: Add Radix toast dependency + UI wrapper

**Files:**
- Modify: `package.json`
- Create: `src/components/ui/toast.tsx`

- [ ] **Step 1: Install the dependency**

Run: `bun add @radix-ui/react-toast@1.2.15`
Expected: `package.json` gains `"@radix-ui/react-toast": "1.2.15"` (or `^1.2.15`); `bun.lock` updated; install succeeds.

- [ ] **Step 2: Create the toast wrapper**

Create `src/components/ui/toast.tsx` with exactly this content (mirrors the forwardRef + `cn` + theme-token pattern of `ui/dialog.tsx`; viewport pinned bottom-right):

```tsx
import * as React from "react"
import * as ToastPrimitive from "@radix-ui/react-toast"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitive.Provider

const ToastViewport = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[380px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitive.Viewport.displayName

const Toast = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & { variant?: "default" | "destructive" }
>(({ className, variant = "default", ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(
      "group pointer-events-auto relative flex w-full items-start justify-between gap-3 overflow-hidden rounded-lg border p-4 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-bottom-2 data-[swipe=end]:animate-out",
      variant === "destructive"
        ? "border-destructive/40 bg-destructive/10 text-foreground"
        : "border-border bg-card text-card-foreground",
      className
    )}
    {...props}
  />
))
Toast.displayName = ToastPrimitive.Root.displayName

const ToastTitle = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title ref={ref} className={cn("text-sm font-semibold", className)} {...props} />
))
ToastTitle.displayName = ToastPrimitive.Title.displayName

const ToastDescription = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description ref={ref} className={cn("text-xs text-muted-foreground", className)} {...props} />
))
ToastDescription.displayName = ToastPrimitive.Description.displayName

const ToastClose = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn("shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors", className)}
    aria-label="Tutup"
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
))
ToastClose.displayName = ToastPrimitive.Close.displayName

export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose }
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: build completes with no errors. (Wrapper unused for now — fine; consumed in Task 3.)

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock src/components/ui/toast.tsx
git commit -m "feat(ui): add Radix toast wrapper component"
```

---

## Task 2: Remove the Actions card from StatusSummary

**Files:**
- Modify: `src/components/StatusSummary.tsx` (props interface, destructured params, grid class, delete the Actions `<Card>`)

- [ ] **Step 1: Trim the props interface**

In `src/components/StatusSummary.tsx`, the interface (lines ~10-26) currently is:

```tsx
interface StatusSummaryProps {
  categories: DomainCategory[]
  onRefresh: (force?: boolean) => void
  isRefreshing: boolean
  activeCategory: string | null
  onCategoryChange: (category: string | null) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (filter: StatusFilter) => void
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  expiryFilter: string | null
  onExpiryFilterChange: (filter: string | null) => void
  onNotifyExpiring?: () => void
  isNotifying?: boolean
  notifyResult?: { sent: number; failed: number; errors?: string[] } | null
  isStaffwebdev?: boolean
}
```

Replace with (drop `onRefresh`, `isRefreshing`, `onNotifyExpiring`, `isNotifying`, `notifyResult`, `isStaffwebdev`):

```tsx
interface StatusSummaryProps {
  categories: DomainCategory[]
  activeCategory: string | null
  onCategoryChange: (category: string | null) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (filter: StatusFilter) => void
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  expiryFilter: string | null
  onExpiryFilterChange: (filter: string | null) => void
}
```

- [ ] **Step 2: Trim the destructured params**

The function signature (lines ~28-44) destructures the old props. Replace:

```tsx
export function StatusSummary({
  categories,
  onRefresh,
  isRefreshing,
  activeCategory,
  onCategoryChange,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  expiryFilter,
  onExpiryFilterChange,
  onNotifyExpiring,
  isNotifying,
  notifyResult,
  isStaffwebdev,
}: StatusSummaryProps) {
```

with:

```tsx
export function StatusSummary({
  categories,
  activeCategory,
  onCategoryChange,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  expiryFilter,
  onExpiryFilterChange,
}: StatusSummaryProps) {
```

- [ ] **Step 3: Change the stat grid from 6 to 5 columns**

Find (line ~105):

```tsx
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
```

Replace with:

```tsx
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
```

- [ ] **Step 4: Delete the Actions card**

Find and delete this entire sixth `<Card>` block (it begins with `<Card className="col-span-2 sm:col-span-1">` and its `CardTitle` is "Actions"; it ends at its closing `</Card>` right before the grid's closing `</div>`):

```tsx
        <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => onRefresh(true)}
              disabled={isRefreshing}
              size="sm"
              className="w-full"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
            {isStaffwebdev && (
              <Button
                onClick={() => onNotifyExpiring?.()}
                disabled={isNotifying || isRefreshing}
                size="sm"
                variant="outline"
                className="w-full"
              >
                {isNotifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                Check & Notify
              </Button>
            )}
            {notifyResult && (
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground">
                  <span className="text-green-600">{notifyResult.sent} terkirim</span>
                  {notifyResult.failed > 0 && (
                    <>, <span className="text-destructive">{notifyResult.failed} gagal</span></>
                  )}
                </p>
                {notifyResult.errors && notifyResult.errors.length > 0 && (
                  <p className="text-[9px] text-destructive/80 leading-tight">
                    {notifyResult.errors[0]}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
```

After deletion the grid contains exactly five `<Card>` elements (Total Domain, Online, Offline, Expiring Soon, Expired).

- [ ] **Step 5: Remove now-unused imports**

`RefreshCw`, `Loader2`, `Bell`, and `Button` were used only by the deleted card. Check the rest of the file: the search input, stat cards, and filter badges use `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Badge`, and icons `Globe`, `Wifi`, `WifiOff`, `Clock`, `AlertTriangle`, `Search`. So `Button`, `RefreshCw`, `Loader2`, `Bell` are now unused.

Find the imports (lines ~4-5):

```tsx
import { Button } from '@/components/ui/button'
import { Globe, Wifi, WifiOff, RefreshCw, Loader2, Search, Clock, AlertTriangle, Bell } from 'lucide-react'
```

Replace with (drop the `Button` import line; drop `RefreshCw`, `Loader2`, `Bell` from lucide):

```tsx
import { Globe, Wifi, WifiOff, Search, Clock, AlertTriangle } from 'lucide-react'
```

(Do NOT remove `Card`/`CardContent`/`CardHeader`/`CardTitle` or `Badge` imports — still used.)

- [ ] **Step 6: Verify build passes**

Run: `npm run build`
Expected: build completes with no errors. (This task alone leaves `Dashboard` still passing the removed props — TypeScript will error on the `StatusSummary` call in `Dashboard`. **Expected to fail here.** That call site is fixed in Task 3. If the build fails ONLY with errors about excess props on `<StatusSummary>` in `Dashboard.tsx`, that is expected — proceed to commit; Task 3 resolves it.)

Note: if you prefer a green build at every commit, you may do Task 2 Step 7 (commit) and Task 3 together before building. But committing now is fine since the next task immediately fixes the only breakage.

- [ ] **Step 7: Commit**

```bash
git add src/components/StatusSummary.tsx
git commit -m "feat(ui): remove Actions card from stat grid (6->5 cols)"
```

---

## Task 3: Wire Refresh (header), Check & Notify (sidebar), and the toast (Dashboard)

**Files:**
- Modify: `src/components/Dashboard.tsx` (imports, toast state, StatusSummary call, mobile header, title block, Kelola menu item, ToastProvider/Viewport + Toast render)

- [ ] **Step 1: Add imports**

In `src/components/Dashboard.tsx`, add the toast import after the existing `Progress` import (~line 18). Find:

```tsx
import { Progress } from '@/components/ui/progress'
```

Replace with:

```tsx
import { Progress } from '@/components/ui/progress'
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from '@/components/ui/toast'
```

Then add `RefreshCw` to the lucide import (~line 16). The current import does NOT include `RefreshCw` (it has `Loader2` and `Bell`, which we keep). Find:

```tsx
import { Loader2, Menu, X, Shield, LayoutDashboard, Activity, LogOut, Plus, ChevronDown, Archive, Trash2, Pencil, Search, KeyRound, Sun, Moon, Upload, BarChart3, ArrowUpDown, Settings, Bell, Terminal, PanelLeftClose, PanelLeft } from 'lucide-react'
```

Replace with (add `RefreshCw`):

```tsx
import { Loader2, Menu, X, Shield, LayoutDashboard, Activity, LogOut, Plus, ChevronDown, Archive, Trash2, Pencil, Search, KeyRound, Sun, Moon, Upload, BarChart3, ArrowUpDown, Settings, Bell, Terminal, PanelLeftClose, PanelLeft, RefreshCw } from 'lucide-react'
```

`Loader2` and `Bell` stay (still used: Loader2 in initial-loading + the notify spinner, Bell in Kelola items).

- [ ] **Step 2: Add toast-open state, tied to notifyResult**

Find the `notifyResult` state declaration (~line 64):

```tsx
  const [notifyResult, setNotifyResult] = useState<{ sent: number; failed: number; errors?: string[] } | null>(null)
```

Add a toast-open boolean right after it:

```tsx
  const [notifyResult, setNotifyResult] = useState<{ sent: number; failed: number; errors?: string[] } | null>(null)
  const [toastOpen, setToastOpen] = useState(false)
```

Then add an effect that opens the toast whenever a fresh `notifyResult` arrives. Place it immediately after the `handleNotifyExpiring` definition (search for the end of `const handleNotifyExpiring = useCallback(... }, [isNotifying])`). Add:

```tsx
  useEffect(() => {
    if (notifyResult) setToastOpen(true)
  }, [notifyResult])
```

- [ ] **Step 3: Trim the StatusSummary call**

Find the `<StatusSummary ... />` call (~lines 929-945):

```tsx
          <StatusSummary
            categories={categories}
            onRefresh={checkAllStatuses}
            isRefreshing={isRefreshing}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            expiryFilter={expiryFilter}
            onExpiryFilterChange={setExpiryFilter}
            onNotifyExpiring={isAdmin(user) ? handleNotifyExpiring : undefined}
            isNotifying={isNotifying}
            notifyResult={notifyResult}
            isStaffwebdev={isAdmin(user)}
          />
```

Replace with the trimmed prop set (matches Task 2's interface):

```tsx
          <StatusSummary
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            expiryFilter={expiryFilter}
            onExpiryFilterChange={setExpiryFilter}
          />
```

- [ ] **Step 4: Add the icon Refresh button to the mobile header**

Find the mobile header (~lines 901-914):

```tsx
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-card px-4 py-3 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-sm truncate">LinkNyaMana</h1>
            <p className="text-[10px] text-muted-foreground truncate">{user.display_name}</p>
          </div>
        </header>
```

Replace with (add an icon Refresh at the right end):

```tsx
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-card px-4 py-3 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-sm truncate">LinkNyaMana</h1>
            <p className="text-[10px] text-muted-foreground truncate">{user.display_name}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => checkAllStatuses(true)}
            disabled={isRefreshing}
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw className={cn('h-5 w-5', isRefreshing && 'animate-spin')} />
          </Button>
        </header>
```

- [ ] **Step 5: Add the labeled Refresh button to the desktop title block**

Find the title block (~lines 918-927):

```tsx
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {activeCategory ? activeCategory : viewMode === 'archive' ? 'Arsip' : 'Dashboard'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Halo, {user.display_name} &mdash; {viewMode === 'archive' ? 'Domain yang tidak aktif' : 'Monitor website uptime dan tracking setup progress'}
              </p>
            </div>
          </div>
```

Replace with (add a labeled Refresh button on the right, desktop-only since mobile has its own):

```tsx
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {activeCategory ? activeCategory : viewMode === 'archive' ? 'Arsip' : 'Dashboard'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Halo, {user.display_name} &mdash; {viewMode === 'archive' ? 'Domain yang tidak aktif' : 'Monitor website uptime dan tracking setup progress'}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => checkAllStatuses(true)}
              disabled={isRefreshing}
              className="hidden md:inline-flex shrink-0"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>
          </div>
```

- [ ] **Step 6: Add the Check & Notify item to the Kelola admin menu**

Find the "Notifikasi" item inside the admin tools group (~lines 855-859):

```tsx
                  {isAdmin(user) && (
                    <button onClick={() => { setNotifSettingsOpen(true); setSidebarOpen(false) }} className="flex w-full items-center gap-2 rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                      <Bell className="h-3 w-3" /> Notifikasi
                    </button>
                  )}
```

Insert a new "Check & Notify" item immediately after that closing `)}` (before the "User" item):

```tsx
                  {isAdmin(user) && (
                    <button onClick={() => { setNotifSettingsOpen(true); setSidebarOpen(false) }} className="flex w-full items-center gap-2 rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                      <Bell className="h-3 w-3" /> Notifikasi
                    </button>
                  )}
                  {isAdmin(user) && (
                    <button
                      onClick={() => { handleNotifyExpiring(); setSidebarOpen(false) }}
                      disabled={isNotifying}
                      className="flex w-full items-center gap-2 rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
                    >
                      {isNotifying ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bell className="h-3 w-3" />} Check & Notify
                    </button>
                  )}
```

- [ ] **Step 7: Wrap the tree in ToastProvider and render the Toast**

Find the main return's root element (~line 664-665):

```tsx
  return (
    <div className="flex h-screen bg-background">
```

Replace the opening with a `ToastProvider` wrapper (Radix `ToastProvider` accepts a `swipeDirection`; default duration overridden per-Toast):

```tsx
  return (
    <ToastProvider swipeDirection="right">
    <div className="flex h-screen bg-background">
```

Then find the matching close of that root `<div>` — it is the `</div>` on the last line before the component closes (~line 1120):

```tsx
        onOpenChange={setConsoleLogOpen}
      />
    </div>
  )
}
```

Replace with (close the div, render the Toast + Viewport, close ToastProvider):

```tsx
        onOpenChange={setConsoleLogOpen}
      />

      {notifyResult && (
        <Toast
          open={toastOpen}
          onOpenChange={setToastOpen}
          duration={5000}
          variant={notifyResult.failed > 0 ? 'destructive' : 'default'}
        >
          <div className="min-w-0">
            <ToastTitle>
              {notifyResult.sent === 0 && notifyResult.failed > 0 ? 'Gagal mengirim' : 'Notifikasi terkirim'}
            </ToastTitle>
            <ToastDescription>
              {notifyResult.sent} terkirim &middot; {notifyResult.failed} gagal
              {notifyResult.errors && notifyResult.errors.length > 0 ? ` — ${notifyResult.errors[0]}` : ''}
            </ToastDescription>
          </div>
          <ToastClose />
        </Toast>
      )}
      <ToastViewport />
    </div>
    </ToastProvider>
  )
}
```

- [ ] **Step 8: Verify build passes**

Run: `npm run build`
Expected: build completes with no errors (the StatusSummary prop mismatch from Task 2 is now resolved by Step 3; toast wired).

- [ ] **Step 9: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(ui): refresh in header, Check & Notify in Kelola, notify toast"
```

---

## Task 4: Visual verification sweep

**Files:** none (verification only)

- [ ] **Step 1: Clean build**

Run: `npm run build`
Expected: completes with no errors.

- [ ] **Step 2: Manual visual check**

Run `npm run dev`, log in as an admin (staffwebdev), inspect at two widths:

- **1280px (desktop):**
  - Stat grid shows five uniform number cards (no Actions card).
  - Title block shows "↻ Refresh" button on the right; clicking it starts a check (button shows spinning icon + disabled; the "Checking status… X/Y" progress bar appears as before).
  - Sidebar → "Kelola" → "Check & Notify" present; clicking it runs the notify; a toast appears bottom-right with "X terkirim · Y gagal" and auto-dismisses (~5s); ✕ closes it early.
- **375px (mobile):**
  - Stat grid 2-col, five cards.
  - Mobile header shows a Refresh icon at the right that spins while checking; tapping triggers a check.
  - Sidebar (hamburger) → "Kelola" → "Check & Notify" works; toast appears.

- [ ] **Step 3: Commit (only if tweaks were needed)**

```bash
git add -A
git commit -m "fix(ui): Actions redesign visual tweaks"
```

If no changes were needed, skip this step.

---

## Self-Review Notes

- **Spec coverage:** remove Actions card + 6 props + grid 6→5 (Task 2) ✓; Refresh in mobile header + desktop title block, icon vs icon+label (Task 3 Steps 4-5) ✓; Check & Notify in Kelola menu, admin-only, spinner while running (Task 3 Step 6) ✓; Radix toast dep + wrapper (Task 1) ✓; ToastProvider/Viewport mounted + notifyResult→toast with success/destructive variant + first error line + 5s auto-dismiss (Task 3 Steps 2,7) ✓; progress bar untouched (not modified) ✓; visual verification (Task 4) ✓.
- **Type/name consistency:** Task 2's trimmed `StatusSummaryProps` (9 props) exactly matches the trimmed `<StatusSummary>` call in Task 3 Step 3. Toast exports `ToastProvider`/`ToastViewport`/`Toast`/`ToastTitle`/`ToastDescription`/`ToastClose` (Task 1) match the import in Task 3 Step 1. `checkAllStatuses`, `handleNotifyExpiring`, `isRefreshing`, `isNotifying`, `notifyResult`, `isAdmin` already exist in Dashboard (verified). `cn` already imported in Dashboard (used throughout).
- **Cross-task build state:** Task 2 alone leaves Dashboard passing extra props to StatusSummary (TS error) — documented in Task 2 Step 6 as expected, resolved in Task 3 Step 3. All other tasks build green.
- **Imports:** Task 2 Step 5 removes `Button`/`RefreshCw`/`Loader2`/`Bell` from StatusSummary (now unused there). Dashboard does NOT currently import `RefreshCw` — Task 3 Step 1 adds it (used by the two new Refresh buttons). Dashboard already imports `Loader2` (initial-loading + notify spinner) and `Bell` (Kelola items) — both kept.
