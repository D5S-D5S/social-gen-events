# BalloonBase MVP Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all broken MVP flows, polish the app shell, consolidate settings, and make the AI estimator functional end-to-end.

**Architecture:** Minimal diffs to existing files; no removal of pricing/delivery/deposit/Stripe logic. Each commit is independently deployable.

**Tech Stack:** Next.js 14 App Router, Supabase (auth + DB), Stripe (payments), Gemini (AI), CSS variables (design system)

---

## What is actually broken (verified by code inspection)

1. `/api/ai/estimate/route.ts` — calls `req.json()` unconditionally; the ai-tools page sends FormData with `?step=detect` / `?step=estimate`. Completely broken for image estimator.
2. `booking-forms/page.tsx` `handleCreate` — `saveBookingForm` returns null on auth error; no toast or error feedback shown.
3. Calendar — "New Quote" button should be "New Booking" with standalone booking modal.
4. Settings page — stale inline CSS, doesn't use design system vars; missing Business Profile, Maps key field, fixed platform fee.
5. App shell — no user avatar, no plan badge, no user info in sidebar.
6. Sidebar — "Admin" duplicated at bottom; Catalog has sub-nav items (Products, Packages, Inventory) that should collapse into Catalog tabs.
7. AI estimator — no `step=detect` / `step=estimate` handler; needs stub fallback when no API key.

## Commit 1 — Routing fixes + error boundaries

**Files:**
- Modify: `app/api/ai/estimate/route.ts`
- Modify: `app/(dashboard)/booking-forms/page.tsx` (handleCreate error toast only)
- Modify: `app/quick-quote/page.tsx` (add error boundary for empty settings)

## Commit 2 — App shell: avatar + plan badge + sidebar cleanup

**Files:**
- Modify: `components/Sidebar.tsx`
- Modify: `lib/db.ts` (add getProfile / upsertProfile)
- New: `lib/hooks/useProfile.ts`

## Commit 3 — Calendar: New Booking + upcoming events editable

**Files:**
- Modify: `app/(dashboard)/calendar/page.tsx`
- Modify: `lib/db.ts` (add bookings CRUD)

## Commit 4 — Settings consolidation

**Files:**
- Modify: `app/(dashboard)/settings/page.tsx`

## Commit 5 — AI estimator end-to-end

**Files:**
- Modify: `app/api/ai/estimate/route.ts` (extend with step handling)
- Modify: `app/(dashboard)/ai-tools/page.tsx` (wire results to new quote)

## Commit 6 — Catalog/inventory cleanup

**Files:**
- Modify: `components/Sidebar.tsx` (remove Products/Packages/Inventory from nav)
- Modify: `app/(dashboard)/catalog/page.tsx` (tabs approach, remove emoji)
