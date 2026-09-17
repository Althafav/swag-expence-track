# SWAG Landscapes — Project Profit Tracker

## What it is

A single-user internal web tool for a landscaping/construction business (SWAG Landscapes). It tracks income and expense **transactions** per **project** (e.g. interlock paving, turf/grass work, wall cladding jobs) and shows profit automatically — per project and across the whole business. Currency is fixed to ₹ (INR).

## Who uses it, and how

One person (the business owner), from two very different contexts:
- **On a phone, on a job site** — often one-handed, quickly, sometimes in bright outdoor light, to log a payment received or a cash expense against a job in progress.
- **On a laptop, in the office** — to review numbers, create/edit projects, and export data.

Login is a single shared passcode (no per-user accounts). This dual-context, real-world usage pattern (truck cab / job site vs. desk) should drive layout, touch-target, and legibility decisions more than desktop-first SaaS conventions would.

## Tech stack

- **Framework**: Next.js 16 (App Router, Turbopack), React 19, TypeScript
- **Styling**: Tailwind CSS 4, with a small CSS-custom-property token system in `src/app/globals.css`
- **Database**: `better-sqlite3` — a local SQLite file at `data/app.db` (not yet deployed anywhere; runs via `npm run dev`)
- **Charts**: Recharts
- **Dates**: date-fns
- **Auth**: a custom HMAC-signed session cookie gated by a single passcode (`src/lib/auth.ts`, `src/proxy.ts`)

## Data model

**Project**: name, location, client (optional), status (`ongoing` / `completed` / `on_hold`), start date, notes.

**Transaction** (belongs to one project): type (`income` / `expense`), amount, date, category, notes.
- Income categories: Advance payment, Milestone payment, Final payment, Other
- Expense categories: Materials (Interlock/Paving, Grass/Turf, Cladding stone, Other), Labor, Equipment rental, Transport/Fuel, Subcontractor, Misc

Computed: project profit = income − expense; business totals = sum across all projects + a monthly trend.

## Current screens

| Route | Purpose |
|---|---|
| `/login` | Single passcode entry |
| `/` (Dashboard) | Business-wide totals, profit hero, monthly income/expense trend chart, projects ranked by profit |
| `/projects` | Searchable/filterable project list |
| `/projects/[id]` | Project detail: running income/expense/profit, transaction list, CSV export |

Creating/editing a project or transaction happens in modals (`ProjectFormModal`, `TransactionFormModal`) triggered from a floating action button (mobile) or a header button (desktop).



