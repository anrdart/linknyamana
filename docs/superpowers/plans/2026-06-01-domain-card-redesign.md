# DomainCard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the domain name and URL their own full-width top row in `DomainCard`, move all badges/response-time/actions into a tidy second row, drop the redundant status dot + spinner, and provide a mobile kebab dropdown for admin actions (desktop keeps hover-reveal).

**Architecture:** Restructure `DomainCard`'s `CardContent` into three vertical sections (header / info+actions / progress). Add a thin Radix `dropdown-menu` UI wrapper (mirrors existing `ui/dialog.tsx`). Desktop actions hover-reveal on active cards (always visible on archived cards, since archived cards are `pointer-events-none`); mobile actions live behind a kebab dropdown.

**Tech Stack:** React 19, Astro 6, Tailwind v4, Radix UI, lucide-react.

**Verification model:** No test runner. Each task verified by `npm run build` passing + a described manual visual check at 375px and 1280px. Commit after each task.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/components/ui/dropdown-menu.tsx` | **new** — Radix dropdown-menu wrapper (Root/Trigger/Content/Item), mirrors `ui/dialog.tsx` |
| `package.json` | add `@radix-ui/react-dropdown-menu` dependency |
| `src/components/DomainCard.tsx` | restructure `CardContent`: header row, info+actions row, progress; remove dot + `Loader2`; add `MoreVertical` kebab dropdown for mobile |

---

## Task 1: Add Radix dropdown-menu dependency + UI wrapper

**Files:**
- Modify: `package.json` (dependencies)
- Create: `src/components/ui/dropdown-menu.tsx`

- [ ] **Step 1: Install the dependency**

Run: `bun add @radix-ui/react-dropdown-menu@2.1.16`
Expected: `package.json` gains `"@radix-ui/react-dropdown-menu": "2.1.16"` (or `^2.1.16`) under dependencies; `bun.lock` updated; install succeeds.

- [ ] **Step 2: Create the dropdown-menu wrapper**

Create `src/components/ui/dropdown-menu.tsx` with exactly this content (mirrors the forwardRef + Portal pattern of `ui/dialog.tsx`; uses the existing `--color-popover` theme tokens):

```tsx
import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[10rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-xs outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem }
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: build completes with no errors. (The wrapper is unused for now — fine; it's consumed in Task 2.)

- [ ] **Step 4: Commit**

```bash
git add package.json bun.lock src/components/ui/dropdown-menu.tsx
git commit -m "feat(ui): add Radix dropdown-menu wrapper component"
```

---

## Task 2: Restructure DomainCard layout

**Files:**
- Modify: `src/components/DomainCard.tsx` (imports + the `CardContent` body)

- [ ] **Step 1: Update imports**

In `src/components/DomainCard.tsx`, replace the lucide import (line 3):

```tsx
import { CheckCircle2, Loader2, Archive, Trash2, Pencil, Lock, AlertTriangle } from 'lucide-react'
```

with (drop `Loader2`, add `MoreVertical`):

```tsx
import { CheckCircle2, Archive, Trash2, Pencil, Lock, AlertTriangle, MoreVertical } from 'lucide-react'
```

Then add the dropdown-menu import after the `Badge` import (line 2 area). Find:

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
```

Replace with:

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
```

- [ ] **Step 2: Replace the card body top section**

In `src/components/DomainCard.tsx`, find this entire block — the top flex row (status dot + name/url + badges + admin actions). It begins right after `<CardContent className="p-4">` and ends just before the `{domain.cms !== 'custom' && (` progress block:

```tsx
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div
                className={cn(
                  'h-2.5 w-2.5 rounded-full transition-colors duration-500',
                  isArchived ? 'bg-muted-foreground/40' : config.dotClass
                )}
              />
              {isChecking && !isArchived && (
                <Loader2 className="absolute -top-0.5 -left-0.5 h-3.5 w-3.5 animate-spin text-amber-500" />
              )}
            </div>
            <div className="min-w-0">
              <p className={cn('font-medium text-sm truncate', isArchived && 'text-muted-foreground')}>{domain.name}</p>
              <p className="text-xs text-muted-foreground truncate">{domain.url}</p>
              {domain.lastDeepChecked && (
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  Deep checked: {formatTimeAgo(domain.lastDeepChecked)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 flex-wrap">
            {sslInfo && !isArchived && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-[10px]',
                  sslInfo.expired ? 'text-red-600 dark:text-red-400' : sslInfo.warning ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                )}
                title={sslInfo.expired ? 'SSL expired' : `SSL expires in ${sslInfo.daysLeft}d`}
              >
                {sslInfo.expired || sslInfo.warning ? (
                  <AlertTriangle className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
              </span>
            )}
            {domain.responseTimeMs !== undefined && !isArchived && !isChecking && (
              <span className={cn('text-[10px] font-mono', getResponseTimeColor(domain.responseTimeMs))}>
                {domain.responseTimeMs}ms
              </span>
            )}
            {expiryInfo && !isArchived && (
              <Badge
                variant={expiryInfo.variant}
                className="text-[10px] px-1.5 py-0"
              >
                {expiryInfo.label}
              </Badge>
            )}
            <Badge
              variant={isArchived ? 'secondary' : config.variant}
              className={cn(
                'text-[10px] px-1.5 py-0 transition-all duration-300',
                !isChecking && !isArchived && 'animate-status-pop'
              )}
            >
              {isArchived ? 'Diarsipkan' : config.label}
            </Badge>
          </div>

          {isStaffwebdev && (
            <div className="flex items-center gap-1 ml-1 pointer-events-auto">
              <button
                onClick={(e) => { e.stopPropagation(); onArchive?.(domain) }}
                title={isArchived ? 'Pindahkan ke Aktif' : 'Pindahkan ke Arsip'}
                className="opacity-50 hover:opacity-100 transition-opacity p-1"
              >
                <Archive className="h-3.5 w-3.5" />
              </button>
              {!isArchived && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit?.(domain) }}
                  title="Edit"
                  className="opacity-50 hover:opacity-100 transition-opacity p-1"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Hapus domain ini?')) {
                    onDelete?.(domain);
                  }
                }}
                title="Hapus"
                className="text-destructive/50 hover:text-destructive transition-colors p-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
```

Replace that entire block with the new two-section layout:

```tsx
        {/* Header: name + URL, full width */}
        <div className="min-w-0">
          <p className={cn('font-medium text-sm truncate', isArchived && 'text-muted-foreground')}>{domain.name}</p>
          <p className="text-xs text-muted-foreground truncate">{domain.url}</p>
          {domain.lastDeepChecked && (
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
              Deep checked: {formatTimeAgo(domain.lastDeepChecked)}
            </p>
          )}
        </div>

        {/* Info + actions */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {sslInfo && !isArchived && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-[10px]',
                  sslInfo.expired ? 'text-red-600 dark:text-red-400' : sslInfo.warning ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                )}
                title={sslInfo.expired ? 'SSL expired' : `SSL expires in ${sslInfo.daysLeft}d`}
              >
                {sslInfo.expired || sslInfo.warning ? (
                  <AlertTriangle className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
              </span>
            )}
            {domain.responseTimeMs !== undefined && !isArchived && !isChecking && (
              <span className={cn('text-[10px] font-mono', getResponseTimeColor(domain.responseTimeMs))}>
                {domain.responseTimeMs}ms
              </span>
            )}
            {expiryInfo && !isArchived && (
              <Badge
                variant={expiryInfo.variant}
                className="text-[10px] px-1.5 py-0"
              >
                {expiryInfo.label}
              </Badge>
            )}
            <Badge
              variant={isArchived ? 'secondary' : config.variant}
              className={cn(
                'text-[10px] px-1.5 py-0 transition-all duration-300',
                !isChecking && !isArchived && 'animate-status-pop'
              )}
            >
              {isArchived ? 'Diarsipkan' : config.label}
            </Badge>
          </div>

          {isStaffwebdev && (
            <div className="shrink-0 pointer-events-auto">
              {/* Desktop: hover-reveal on active cards; always visible on archived (card is pointer-events-none, can't be hovered) */}
              <div className={cn(
                'hidden sm:flex items-center gap-1 transition-opacity',
                !isArchived && 'opacity-0 group-hover:opacity-100'
              )}>
                <button
                  onClick={(e) => { e.stopPropagation(); onArchive?.(domain) }}
                  title={isArchived ? 'Pindahkan ke Aktif' : 'Pindahkan ke Arsip'}
                  className="opacity-60 hover:opacity-100 transition-opacity p-1"
                >
                  <Archive className="h-3.5 w-3.5" />
                </button>
                {!isArchived && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit?.(domain) }}
                    title="Edit"
                    className="opacity-60 hover:opacity-100 transition-opacity p-1"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Hapus domain ini?')) {
                      onDelete?.(domain);
                    }
                  }}
                  title="Hapus"
                  className="text-destructive/60 hover:text-destructive transition-colors p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Mobile: kebab dropdown */}
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Aksi domain"
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onSelect={() => onArchive?.(domain)}>
                      <Archive className="h-3.5 w-3.5" />
                      {isArchived ? 'Pindahkan ke Aktif' : 'Pindahkan ke Arsip'}
                    </DropdownMenuItem>
                    {!isArchived && (
                      <DropdownMenuItem onSelect={() => onEdit?.(domain)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onSelect={() => { if (window.confirm('Hapus domain ini?')) onDelete?.(domain) }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>
```

Note: `config.dotClass` is no longer referenced after this change. It remains defined in the `statusConfig` object (harmless, not a TS error). Leave it — removing it is out of scope and would widen the diff.

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/DomainCard.tsx
git commit -m "feat(ui): header-first DomainCard layout + mobile kebab actions"
```

---

## Task 3: Visual verification sweep

**Files:** none (verification only)

- [ ] **Step 1: Clean build**

Run: `npm run build`
Expected: completes with no errors.

- [ ] **Step 2: Manual visual check**

Run `npm run dev`, log in, and inspect a domain card at two widths (browser DevTools device toolbar):

- **375px (mobile):**
  - Name and URL occupy their own top row, fully readable (not squeezed by badges).
  - No status dot, no spinner. A checking card shows the shimmer animation + amber "Checking..." badge.
  - Info row shows response-time/expiry/status badges on the left; a kebab `⋯` on the right.
  - Tapping `⋯` opens a dropdown with "Pindahkan ke Arsip", "Edit", "Hapus". Tapping the card body (not the kebab) still opens the detail dialog. Delete still shows the confirm prompt.
- **1280px (desktop):**
  - Same header row layout.
  - Kebab hidden; the three action icons (archive/edit/delete) fade in when hovering the card, hidden otherwise.
  - On an archived card (Arsip view), the action icons are visible without hover (so un-archive is reachable).

- [ ] **Step 3: Commit (only if tweaks were needed)**

If the sweep surfaced small fixes, commit them:

```bash
git add -A
git commit -m "fix(ui): DomainCard redesign visual tweaks"
```

If no changes were needed, skip this step.

---

## Self-Review Notes

- **Spec coverage:** header-first name+URL (Task 2) ✓; remove dot + spinner (Task 2, Step 1 drops `Loader2`, Step 2 removes dot block) ✓; info row reflow with badges/response-time/SSL (Task 2) ✓; desktop hover-reveal + mobile kebab dropdown (Task 2) ✓; new `dropdown-menu.tsx` + dependency (Task 1) ✓; checking = shimmer + amber badge, no dot/spinner (Task 2) ✓; progress block untouched (left out of the replaced range) ✓; SSL block left as-is/dead-code (kept verbatim in new info row) ✓; verification (Task 3) ✓.
- **Archived-card correctness:** desktop actions are hover-gated only when `!isArchived`; archived cards keep actions visible because the card is `pointer-events-none` and cannot receive hover — the `pointer-events-auto` wrapper preserves clickability for un-archiving.
- **Type/name consistency:** imports `DropdownMenu`/`DropdownMenuTrigger`/`DropdownMenuContent`/`DropdownMenuItem` (Task 2 Step 1) exactly match the exports defined in Task 1 Step 2. `MoreVertical` added to lucide import and used in the kebab trigger.
- **Event handling:** kebab trigger and dropdown content `stopPropagation` so the card's `onClick` (open detail) doesn't fire; dropdown items render in a Radix portal (outside the card DOM), so item clicks never propagate to the card.
