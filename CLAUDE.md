# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

SWAG Landscapes Project Profit Tracker — a single-user internal tool for a landscaping/construction business. It tracks income/expense **transactions** against **projects** and shows profit automatically, per project and business-wide. Currency is fixed to ₹ (INR). One user, two contexts: one-handed on a phone at a job site, or at a laptop in the office — this drives layout and touch-target decisions more than desktop-first SaaS conventions would.

Full product spec: `Project_Summary.md`. Build history, ground rules, and per-step notes (including bugs found and fixed along the way): `Implementation_Plan.md` — read this before making non-trivial changes, since it explains *why* things are built the way they are.

Design source of truth (a separate, sibling directory, read-only): `../SWAG Landscapes Design System/` — `readme.md` for foundations (color/type/spacing rules, the profit-color rule), `components/*/*.jsx` + `.d.ts` + `.prompt.md` for the authoritative per-component contract, `ui_kits/profit-tracker/screens.jsx` + `modals.jsx` + `data.js` for reference screen markup and the seed dataset. This app is a from-scratch TypeScript/Next.js port of that kit — not a copy-paste, but every component's prop shape and visual behavior should trace back to it.

## Commands

```bash
npm run dev            # start dev server (Turbopack)
npm run build           # production build
npm run lint            # eslint
npm run db:seed         # seed data/app.db with the design system's 5 sample projects / 18 transactions (idempotent — no-ops if projects already exist)
npm test                # vitest run (no test files exist yet — Step 12 of Implementation_Plan.md)
npx tsc --noEmit         # type-check; run this after any change, it's the project's actual CI gate right now
npx next typegen         # regenerate Next's route types (`.next/types`) — needed after adding/removing/moving a route file, since `tsc` will otherwise fail against stale generated types
```

There's no test runner config yet (`vitest.config.ts` doesn't exist) — that's the next unbuilt step.

The SQLite file lives at `data/app.db` (gitignored). `src/lib/db.ts` creates the schema on first connection if missing, so a fresh checkout just needs `npm run dev` (or `npm run db:seed` for sample data).

Required `.env.local` (gitignored, no fallback by design — `src/lib/auth.ts` throws if either is unset):
```
APP_PASSCODE=<the shared login passcode>
APP_PASSCODE_SECRET=<random secret for HMAC-signing session cookies>
```

## Architecture

**Route groups.** `src/app/(app)/` holds every authenticated screen (`/`, `/projects`, `/projects/[id]`) behind a shared `AppShell` (header nav, mobile bottom nav, FAB). `/login` and the `/api/*` routes sit outside that group. The route group is purely organizational — it doesn't affect URLs.

**Auth gate.** `src/proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`, exporting `proxy()` instead of `middleware()`) checks an HMAC-signed session cookie on every request except `/login`, `/api/login`, and static asset extensions, redirecting pages to `/login` and returning 401 JSON for other API routes. Its `config.matcher` negative-lookahead must exclude any new public-root static asset extension you add (this bit a real bug once — an unlisted extension got redirected to `/login`, which broke `next/image`'s optimizer fetching it).

**Data layer.** `src/lib/db.ts` (better-sqlite3, WAL mode, `PRAGMA foreign_keys = ON`, cascading FK from `transactions.projectId` → `projects.id`) and `src/lib/queries.ts` (all reads/writes — `listProjects`, `getProject`, `createProject`/`updateProject`/`deleteProject`, `listTransactions`/`listRecentTransactions`, `createTransaction`/`updateTransaction`/`deleteTransaction`, `getDashboardData`, `getProjectMonthly`). `deleteProject` uses an explicit `db.transaction()` cascade as a belt-and-braces alongside the schema's `ON DELETE CASCADE`. Pages call these functions directly (Server Components, not fetch) since better-sqlite3 is synchronous and Node-only; client components that need data reach it through the `/api/*` routes instead (e.g. `TransactionFormModal` fetching `/api/projects` for its project picker).

**The Money ground rule.** Every rupee figure in the UI renders through `<Money>` (`src/components/ui/Money.tsx`), which also exports `formatINR`. No other component formats currency or picks a money color. `Money kind="profit"` is sign-aware: moss (`var(--profit-positive)`) when ≥0, clay (`var(--profit-negative)`) when <0 — this is the single highest-stakes rule in the design system (a loss must never render in the celebratory lime/brand color). If you're about to write `.toLocaleString()` or a manual `₹` string anywhere, route it through `Money`/`formatINR` instead.

**Shared modal state — one code path for "log a transaction."** `AppShell.tsx` owns all create/edit modal state via a `TrackerModalsContext` (hook: `useTrackerModals()`), rendering `ActionSheet`, `TransactionFormModal`, and `ProjectFormModal` once at the shell level. Every trigger — the mobile FAB, the header's desktop "Log transaction" button, the dashboard's own buttons, the Projects list's "New project", a project detail page's "Edit"/"Log"/transaction-row-click — calls into this same context rather than rendering its own modal instance. The FAB opens `ActionSheet` first (ambiguous intent: log vs. new project); direct-intent buttons call `openLogTransaction()`/`openNewProject()` straight away. Follow this pattern for any new entry point instead of wiring a local modal.

**Server/Client boundary.** Next 16 forbids passing inline closures from a Server Component into any child, even a Client Component leaf. All interactive UI primitives (`Button`, `IconButton`, `Card`, `SegmentedControl`, `Modal`, etc.) are `"use client"`; any page that itself constructs an inline handler must also be `"use client"`, or the handler needs to be pushed into a small dedicated client component instead (see `DashboardActions.tsx`, which exists solely so the dashboard's server-rendered page can have two buttons wired to `useTrackerModals()`).

**Dynamic route params are async** — `params` in `src/app/(app)/projects/[id]/page.tsx` and any `/api/.../[id]/route.ts` handler is a `Promise`; always `await params` before using it.

**Design tokens.** `src/app/globals.css` maps the full SWAG Landscapes token set (colors, type scale, spacing, radii, shadows, motion, the `.mow-lines` motif) into Tailwind 4's `@theme inline`, plus every `swag-*` component CSS class ported from the design system's `components.css`. 13px is a hard floor for any product text. **Tailwind's responsive utilities (`md:hidden` etc.) live in Tailwind 4's layered cascade; the ported `swag-*` classes are unlayered plain CSS appended after `@import "tailwindcss"`.** Unlayered CSS always beats layered CSS at equal specificity regardless of source order, so never put a Tailwind visibility utility on the same element as a `swag-*` class that also sets `display` — wrap one of them in a plain `<div>` instead (see how the bottom nav and FAB are each wrapped in their own `md:hidden` div rather than carrying that class directly).

**Testing conventions in flight (Step 12, not yet built):** `formatINR` and `Money`'s sign-aware coloring are the planned first vitest targets, per `Implementation_Plan.md`.
