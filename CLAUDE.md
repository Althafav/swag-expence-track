# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

SWAG Landscapes Project Profit Tracker — a single-user internal tool for a landscaping/construction business. It tracks income/expense **transactions** against **projects** and shows profit automatically, per project and business-wide. Currency is fixed to ₹ (INR). One user, two contexts: one-handed on a phone at a job site, or at a laptop in the office — this drives layout and touch-target decisions more than desktop-first SaaS conventions would.

Full product spec: `Project_Summary.md`. (An `Implementation_Plan.md` with build history and ground rules used to live here and is referenced by old commit messages/comments — it was lost from disk outside of version control and was never committed, so it no longer exists. Don't assume it's there.)

Design source of truth (a separate, sibling directory, read-only): `../SWAG Landscapes Design System/` — `readme.md` for foundations (color/type/spacing rules, the profit-color rule), `components/*/*.jsx` + `.d.ts` + `.prompt.md` for the authoritative per-component contract, `ui_kits/profit-tracker/screens.jsx` + `modals.jsx` + `data.js` for reference screen markup and the seed dataset. This app is a from-scratch TypeScript/Next.js port of that kit — not a copy-paste, but every component's prop shape and visual behavior should trace back to it.

## Commands

```bash
npm run dev              # start dev server (Turbopack)
npm run build             # production build — also the way to catch static/dynamic rendering mistakes (see Architecture)
npm run lint              # eslint
npm run db:seed           # seed Supabase with the design system's 5 sample projects / 18 transactions (idempotent — no-ops if projects already exist)
npm test                  # vitest run (no test files exist yet)
npx tsc --noEmit           # type-check; run this after any change, it's the project's actual CI gate right now
npx next typegen           # regenerate Next's route types (`.next/types`) — needed after adding/removing/moving a route file, since `tsc` will otherwise fail against stale generated types
```

There's no test runner config yet (`vitest.config.ts` doesn't exist).

**Database is Supabase Postgres**, not a local file — `npm run dev`/`build` alone won't create any tables. Run `supabase-schema.sql` once in the Supabase SQL Editor against a fresh project before anything will work. `db:seed` needs env vars loaded explicitly since it runs outside Next's own env loading (`tsx --env-file=.env.local src/lib/seed.ts` — already wired into the npm script; don't drop that flag if you touch the script).

Required `.env.local` (gitignored, no fallback by design — `src/lib/auth.ts`/`src/lib/db.ts` throw if any of these are unset):
```
APP_PASSCODE=<the shared login passcode>
APP_PASSCODE_SECRET=<random secret for HMAC-signing session cookies>
NEXT_PUBLIC_SUPABASE_URL=<Project Settings → API → Project URL>
SUPABASE_SERVICE_ROLE_KEY=<Project Settings → API → service_role secret — NOT the anon/publishable key, and never rename this to a NEXT_PUBLIC_ var>
```
These same four also need to be set in the Vercel project's environment variables for production.

## Architecture

**Route groups.** `src/app/(app)/` holds every authenticated screen (`/`, `/projects`, `/projects/[id]`) behind a shared `AppShell` (header nav, mobile bottom nav, FAB). `/login` and the `/api/*` routes sit outside that group. The route group is purely organizational — it doesn't affect URLs.

**Auth gate.** `src/proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`, exporting `proxy()` instead of `middleware()`) checks an HMAC-signed session cookie on every request except `/login`, `/api/login`, and static asset extensions, redirecting pages to `/login` and returning 401 JSON for other API routes. Its `config.matcher` negative-lookahead must exclude any new public-root static asset extension you add (this bit a real bug once — an unlisted extension got redirected to `/login`, which broke `next/image`'s optimizer fetching it).

**Data layer.** `src/lib/db.ts` exports a server-only Supabase client (`@supabase/supabase-js`, `service_role` key) plus the `Project`/`Transaction` TS interfaces — schema column names are quoted camelCase in Postgres (`"projectId"`, `"startDate"`, `"createdAt"`) specifically so they match these interfaces with zero mapping. `src/lib/queries.ts` holds every read/write (`listProjects`, `getProject`, `createProject`/`updateProject`/`deleteProject`, `listTransactions`/`listRecentTransactions`, `createTransaction`/`updateTransaction`/`deleteTransaction`, `getDashboardData`, `getProjectMonthly`) as `async` functions built on Supabase's query builder (PostgREST), not raw SQL. Aggregation (income/expense totals, the monthly trend) is done in JS after fetching rows rather than via SQL `GROUP BY`/Postgres RPC — deliberate, since this app's entire dataset is tiny (one business, at most a few hundred transactions) and it avoids needing custom Postgres functions. `deleteProject` relies on the schema's `ON DELETE CASCADE` FK alone (no app-level explicit-cascade step, unlike a raw-SQL client) — PostgREST is one-statement-per-call, so that single DELETE is already atomic in Postgres. Pages call these functions directly and `await` them (Server Components); client components that need data reach it through the `/api/*` routes instead (e.g. `TransactionFormModal` fetching `/api/projects` for its project picker).

**Why `service_role`, not `anon`.** `db.ts` deliberately uses the Supabase `service_role` key (bypasses Row Level Security) rather than the `anon`/publishable key, and reads it from `SUPABASE_SERVICE_ROLE_KEY` — never a `NEXT_PUBLIC_`-prefixed var. This app has its own passcode/HMAC auth (`src/proxy.ts` gates every route) and no Supabase Auth identity, so there's nothing to write RLS policies against; the `anon` key would either be able to do nothing (default-deny) or, if opened up, would let anyone who extracted it from the client bundle bypass the app's own auth entirely. Since all Supabase access happens in server-only files (`db.ts`/`queries.ts`, imported only by Server Components and route handlers, never by a `"use client"` file), the service_role key never reaches the browser. Keep it that way — don't import `@/lib/db` or `@/lib/queries` from a client component.

**Static vs. dynamic rendering — a real bug that bit this app once.** Next's App Router will silently static-prerender any page at build time if it has no dynamic route segment and doesn't call a dynamic API (`cookies()`, `headers()`, etc.) — Supabase's client uses `fetch()` internally, which doesn't by itself force dynamic rendering. `src/app/(app)/page.tsx`, `.../projects/page.tsx`, and `.../projects/[id]/page.tsx` all read live, frequently-changing data, so all three explicitly export `export const dynamic = "force-dynamic"`. This only showed up once by running `npm run build` and reading the route table (`○` static vs `ƒ` dynamic) — `next dev` always renders per-request regardless, so this class of bug is invisible until a real production build. Any new page under `src/app/(app)/` that reads from `queries.ts` needs the same export, and `npm run build`'s route table is the way to verify it.

**The Money ground rule.** Every rupee figure in the UI renders through `<Money>` (`src/components/ui/Money.tsx`), which also exports `formatINR`. No other component formats currency or picks a money color. `Money kind="profit"` is sign-aware: moss (`var(--profit-positive)`) when ≥0, clay (`var(--profit-negative)`) when <0 — this is the single highest-stakes rule in the design system (a loss must never render in the celebratory lime/brand color). If you're about to write `.toLocaleString()` or a manual `₹` string anywhere, route it through `Money`/`formatINR` instead.

**Shared modal state — one code path for "log a transaction."** `AppShell.tsx` owns all create/edit modal state via a `TrackerModalsContext` (hook: `useTrackerModals()`), rendering `ActionSheet`, `TransactionFormModal`, and `ProjectFormModal` once at the shell level. Every trigger — the mobile FAB, the header's desktop "Log transaction" button, the dashboard's own buttons, the Projects list's "New project", a project detail page's "Edit"/"Log"/transaction-row-click — calls into this same context rather than rendering its own modal instance. The FAB opens `ActionSheet` first (ambiguous intent: log vs. new project); direct-intent buttons call `openLogTransaction()`/`openNewProject()` straight away. Follow this pattern for any new entry point instead of wiring a local modal.

**Server/Client boundary.** Next 16 forbids passing inline closures from a Server Component into any child, even a Client Component leaf. All interactive UI primitives (`Button`, `IconButton`, `Card`, `SegmentedControl`, `Modal`, etc.) are `"use client"`; any page that itself constructs an inline handler must also be `"use client"`, or the handler needs to be pushed into a small dedicated client component instead (see `DashboardActions.tsx`, which exists solely so the dashboard's server-rendered page can have two buttons wired to `useTrackerModals()`).

**Dynamic route params are async** — `params` in `src/app/(app)/projects/[id]/page.tsx` and any `/api/.../[id]/route.ts` handler is a `Promise`; always `await params` before using it.

**Design tokens.** `src/app/globals.css` maps the full SWAG Landscapes token set (colors, type scale, spacing, radii, shadows, motion, the `.mow-lines` motif) into Tailwind 4's `@theme inline`, plus every `swag-*` component CSS class ported from the design system's `components.css`. 13px is a hard floor for any product text. **Tailwind's responsive utilities (`md:hidden` etc.) live in Tailwind 4's layered cascade; the ported `swag-*` classes are unlayered plain CSS appended after `@import "tailwindcss"`.** Unlayered CSS always beats layered CSS at equal specificity regardless of source order, so never put a Tailwind visibility utility on the same element as a `swag-*` class that also sets `display` — wrap one of them in a plain `<div>` instead (see how the bottom nav and FAB are each wrapped in their own `md:hidden` div rather than carrying that class directly).

**Testing:** no tests exist yet. `formatINR` and `Money`'s sign-aware coloring (`src/components/ui/Money.tsx`) are the natural first vitest targets — pure functions, and the single highest-stakes piece of business logic in the app (see the Money ground rule above).
