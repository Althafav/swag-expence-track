import { createClient } from "@supabase/supabase-js";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

// Server-only client. Uses the service_role key (never NEXT_PUBLIC_-prefixed)
// so it bypasses Row Level Security — this app's real access control is its
// own passcode auth in src/proxy.ts, not Supabase Auth/RLS. Never import this
// module from a "use client" component.
export const supabase = createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

export interface Project {
  id: string;
  name: string;
  location: string;
  client: string | null;
  status: "ongoing" | "completed" | "on_hold";
  startDate: string | null;
  /** Day the job finished; set only while status is "completed". */
  completedDate: string | null;
  notes: string | null;
  createdAt: string;
  /** Set while the project is in the recycle bin; null when live. */
  deletedAt: string | null;
}

export interface Transaction {
  id: string;
  /** Null for a company entry (salary, marketing, ...) that belongs to no project. */
  projectId: string | null;
  type: "income" | "expense";
  amount: number;
  date: string;
  category: string;
  notes: string | null;
  createdAt: string;
  /** Set while the transaction is in the recycle bin; null when live. */
  deletedAt: string | null;
}

export type QuoteStatus = "draft" | "sent" | "accepted" | "declined";

/** One line on a quote. Its amount is always derived (qty × rate), never stored. */
export interface QuoteItem {
  description: string;
  qty: number;
  unit: string;
  rate: number;
}

export interface Quote {
  id: string;
  /** Human-facing reference printed on the quote, e.g. "Q-2026-014". */
  number: string;
  clientName: string;
  clientPhone: string | null;
  site: string | null;
  date: string;
  validUntil: string | null;
  status: QuoteStatus;
  /** Stored as one jsonb column — a quote is always read and saved whole. */
  items: QuoteItem[];
  discountType: "flat" | "percent" | null;
  discountValue: number;
  notes: string | null;
  terms: string | null;
  /** The project this quote turned into, once accepted and converted. */
  projectId: string | null;
  createdAt: string;
  /** Set while the quote is in the recycle bin; null when live. */
  deletedAt: string | null;
}

/** A reusable line ("Lawn turfing", sq.ft, ₹45) to drop into quotes. */
export interface CatalogueItem {
  id: string;
  name: string;
  unit: string;
  rate: number;
  createdAt: string;
}
