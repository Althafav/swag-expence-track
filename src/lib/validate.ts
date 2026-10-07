// Server-side validation for the write API routes. The forms validate too, but
// these are the only checks that hold for any request that reaches the API.

import { STATUS_OPTIONS } from "./status";
import type { Project, Transaction } from "./db";

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const TX_TYPES: readonly Transaction["type"][] = ["income", "expense"];
const STATUSES: readonly string[] = STATUS_OPTIONS.map((s) => s.value);

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
