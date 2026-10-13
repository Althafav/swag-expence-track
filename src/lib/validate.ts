// Server-side validation for the write API routes. The forms validate too, but
// these are the only checks that hold for any request that reaches the API.

import { STATUS_OPTIONS } from "./status";
import type { Project, Quote, QuoteItem, QuoteStatus, Transaction } from "./db";
import { QUOTE_STATUS_OPTIONS } from "./quote";

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const TX_TYPES: readonly Transaction["type"][] = ["income", "expense"];
const STATUSES: readonly string[] = STATUS_OPTIONS.map((s) => s.value);
const QUOTE_STATUSES: readonly QuoteStatus[] = QUOTE_STATUS_OPTIONS.map((s) => s.value);

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown): string | null {
  return text(value) || null;
}

/** A real calendar date in storage format, "YYYY-MM-DD". */
function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

export interface TransactionInput {
  type: Transaction["type"];
  amount: number;
  date: string;
  category: string;
  notes: string | null;
}

export function parseTransaction(body: unknown): Result<TransactionInput> {
  const b = (body ?? {}) as Record<string, unknown>;

  if (!TX_TYPES.includes(b.type as Transaction["type"])) return { ok: false, error: "Type must be income or expense" };

  const amount = typeof b.amount === "string" && b.amount.trim() !== "" ? Number(b.amount) : b.amount;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Amount must be a positive number" };
  }

  if (!isIsoDate(b.date)) return { ok: false, error: "Date must be YYYY-MM-DD" };

  const category = text(b.category);
  if (!category) return { ok: false, error: "Category is required" };

  return {
    ok: true,
    value: { type: b.type as Transaction["type"], amount, date: b.date, category, notes: optionalText(b.notes) },
  };
}

export interface ProjectInput {
  name: string;
  location: string;
  client: string | null;
  /** Undefined means "leave unchanged" on update, "ongoing" on create. */
  status: Project["status"] | undefined;
  startDate: string | null;
  notes: string | null;
}

export function parseProject(body: unknown): Result<ProjectInput> {
  const b = (body ?? {}) as Record<string, unknown>;

  const name = text(b.name);
  const location = text(b.location);
  if (!name || !location) return { ok: false, error: "Name and location are required" };

  let status: Project["status"] | undefined;
  if (b.status !== undefined && b.status !== null && b.status !== "") {
    if (!STATUSES.includes(b.status as string)) return { ok: false, error: "Invalid status" };
    status = b.status as Project["status"];
  }

  let startDate: string | null = null;
  if (b.startDate !== undefined && b.startDate !== null && b.startDate !== "") {
    if (!isIsoDate(b.startDate)) return { ok: false, error: "Start date must be YYYY-MM-DD" };
    startDate = b.startDate;
  }

  return {
    ok: true,
    value: { name, location, client: optionalText(b.client), status, startDate, notes: optionalText(b.notes) },
  };
}

function toNumber(value: unknown): number {
  return typeof value === "string" && value.trim() !== "" ? Number(value) : typeof value === "number" ? value : NaN;
}

export interface QuoteInput {
  clientName: string;
  clientPhone: string | null;
  site: string | null;
  date: string;
  validUntil: string | null;
  status: QuoteStatus;
  items: QuoteItem[];
  discountType: Quote["discountType"];
  discountValue: number;
  notes: string | null;
  terms: string | null;
}

export function parseQuote(body: unknown): Result<QuoteInput> {
  const b = (body ?? {}) as Record<string, unknown>;

  const clientName = text(b.clientName);
  if (!clientName) return { ok: false, error: "Client name is required" };

  if (!isIsoDate(b.date)) return { ok: false, error: "Date must be YYYY-MM-DD" };
  let validUntil: string | null = null;
  if (b.validUntil !== undefined && b.validUntil !== null && b.validUntil !== "") {
    if (!isIsoDate(b.validUntil)) return { ok: false, error: "Valid until must be YYYY-MM-DD" };
    if (b.validUntil < b.date) return { ok: false, error: "Valid until can't be before the quote date" };
    validUntil = b.validUntil;
  }

  const status = (b.status ?? "draft") as QuoteStatus;
  if (!QUOTE_STATUSES.includes(status)) return { ok: false, error: "Invalid status" };

  if (!Array.isArray(b.items) || b.items.length === 0) return { ok: false, error: "Add at least one item" };
  const items: QuoteItem[] = [];
  for (const [i, raw] of b.items.entries()) {
    const r = (raw ?? {}) as Record<string, unknown>;
    const description = text(r.description);
    const qty = toNumber(r.qty);
    const rate = toNumber(r.rate);
    if (!description) return { ok: false, error: `Item ${i + 1} needs a description` };
    if (!Number.isFinite(qty) || qty <= 0) return { ok: false, error: `Item ${i + 1} needs a quantity above 0` };
    if (!Number.isFinite(rate) || rate < 0) return { ok: false, error: `Item ${i + 1} needs a rate of 0 or more` };
    items.push({ description, qty, unit: text(r.unit), rate });
  }

  let discountType: Quote["discountType"] = null;
  let discountValue = 0;
  if (b.discountType === "flat" || b.discountType === "percent") {
    discountValue = toNumber(b.discountValue);
    if (!Number.isFinite(discountValue) || discountValue < 0) return { ok: false, error: "Discount must be 0 or more" };
    if (b.discountType === "percent" && discountValue > 100) return { ok: false, error: "Discount can't be more than 100%" };
    discountType = discountValue > 0 ? b.discountType : null;
    if (!discountType) discountValue = 0;
  } else if (b.discountType !== undefined && b.discountType !== null && b.discountType !== "") {
    return { ok: false, error: "Invalid discount type" };
  }

  return {
    ok: true,
    value: {
      clientName,
      clientPhone: optionalText(b.clientPhone),
      site: optionalText(b.site),
      date: b.date,
      validUntil,
      status,
      items,
      discountType,
      discountValue,
      notes: optionalText(b.notes),
      terms: optionalText(b.terms),
    },
  };
}

export interface CatalogueItemInput {
  name: string;
  unit: string;
  rate: number;
}

export function parseCatalogueItem(body: unknown): Result<CatalogueItemInput> {
  const b = (body ?? {}) as Record<string, unknown>;
  const name = text(b.name);
  if (!name) return { ok: false, error: "Name is required" };
  const rate = toNumber(b.rate);
  if (!Number.isFinite(rate) || rate < 0) return { ok: false, error: "Rate must be 0 or more" };
  return { ok: true, value: { name, unit: text(b.unit), rate } };
}
