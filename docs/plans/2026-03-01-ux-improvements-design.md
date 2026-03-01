# Gastei UX/Visual Improvements Design

**Goal:** Transform the Gastei MVP from a functional but generic interface into a polished, mobile-friendly app with a minimalist aesthetic and proper user feedback.

**Style Reference:** Linear/Notion — clean, spacious, typography-driven.

---

## 1. Responsive Layout

**Desktop (>= 1024px):** Fixed sidebar (w-64) + content area. No changes from current.

**Mobile (< 1024px):**
- Sidebar hidden via `hidden lg:flex`
- Mobile header visible via `flex lg:hidden` with:
  - Left: Hamburger menu button
  - Center: "Gastei" logo
  - Right: Avatar + theme toggle
- Hamburger opens a Sheet (shadcn/ui drawer) with full navigation
- Sheet closes on nav item click

**Implementation:** Modify `(app)/layout.tsx` and `sidebar.tsx`. Use shadcn/ui Sheet component.

---

## 2. Visual Direction

### Color Palette
- Background: `white` / dark: `zinc-950`
- Cards: no shadow, `zinc-200` border (1px) / dark: `zinc-800`
- Primary/accent: `zinc-900` buttons / dark: `zinc-50`
- Income: `emerald-600`
- Expense: `rose-600`

### Typography
- Font: Inter (already installed)
- Page titles: `text-xl font-semibold`
- Labels: `text-sm text-muted-foreground`
- Monetary values: `font-mono tabular-nums`

### Spacing
- Section gaps: `space-y-8`
- Content padding: `px-6 py-8` mobile, `px-8 py-8` desktop

### Components
- Cards: subtle borders, no `shadow-sm`
- Inputs: smaller focus ring
- Buttons: `rounded-lg`

---

## 3. Feedback & Interactivity

### Toasts (Sonner)
- Success toast on create/edit/delete actions
- Error toast on action failures
- Position: bottom-right (desktop), bottom-center (mobile)

### Loading States
- Skeleton loaders on dashboard, transactions, categories pages
- Spinner on submit buttons during actions

### Empty States
- Large Lucide icon + descriptive text + CTA button
- For: transactions list, categories list, budget list, dashboard

### Transitions
- Tailwind `transition-all` on lists and cards
- No framer-motion dependency
- Dialog fade-in (already built-in)

---

## Scope

**In scope:**
- Mobile responsive layout with Sheet drawer
- Visual polish (colors, typography, spacing)
- Sonner toasts for all actions
- Skeleton loading states
- Empty states with CTAs

**Out of scope:**
- Bottom navigation
- framer-motion animations
- Custom shadcn/ui theme (just CSS variable tweaks)
- New features or functionality
