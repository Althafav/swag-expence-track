// Quote arithmetic and labels. Pure and client-safe — the editor's live total,
// the printed quote and the list all go through computeQuoteTotals, so the
// figure a client sees can never drift from the one in the app.

import { addDays, format, parseISO } from "date-fns";
import type { Quote, QuoteItem, QuoteStatus } from "./db";

export const DEFAULT_VALIDITY_DAYS = 30;

export const DEFAULT_TERMS = [
  "Prices are valid until the date shown above.",
  "Any work not listed above will be quoted separately.",
].join("\n");

export const QUOTE_STATUS_OPTIONS: readonly { value: QuoteStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
];

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
};

export const QUOTE_STATUS_TONE: Record<QuoteStatus, "neutral" | "info" | "success" | "danger"> = {
  draft: "neutral",
  sent: "info",
  accepted: "success",
  declined: "danger",
};

/** Rounds to paise, so 0.1 + 0.2 style float noise never reaches a printed figure. */
function paise(n: number): number {
  return Math.round(n * 100) / 100;
}

export function lineAmount(item: Pick<QuoteItem, "qty" | "rate">): number {
  return paise((Number(item.qty) || 0) * (Number(item.rate) || 0));
}

export interface QuoteDiscount {
  discountType: Quote["discountType"];
  discountValue: number;
}

export interface QuoteTotals {
  subtotal: number;
  /** The rupee amount taken off — never more than the subtotal. */
  discount: number;
  total: number;
}

export function computeQuoteTotals(items: Pick<QuoteItem, "qty" | "rate">[], { discountType, discountValue }: QuoteDiscount): QuoteTotals {
  const subtotal = paise(items.reduce((s, item) => s + lineAmount(item), 0));
  const value = Math.max(0, Number(discountValue) || 0);
  const raw = discountType === "percent" ? (subtotal * Math.min(value, 100)) / 100 : discountType === "flat" ? value : 0;
  const discount = paise(Math.min(raw, subtotal));
  return { subtotal, discount, total: paise(subtotal - discount) };
}

/** True when any figure on the quote has paise, so the whole quote shows two decimals consistently. */
export function quoteNeedsDecimals(items: Pick<QuoteItem, "qty" | "rate">[], totals: QuoteTotals): boolean {
  const figures = [...items.flatMap((i) => [Number(i.rate) || 0, lineAmount(i)]), totals.subtotal, totals.discount, totals.total];
  return figures.some((n) => !Number.isInteger(n));
}

/** "2026-10-13" → "2026-11-12" with the default validity. */
export function defaultValidUntil(date: string): string {
  return format(addDays(parseISO(date), DEFAULT_VALIDITY_DAYS), "yyyy-MM-dd");
}

/** Next reference in the year's sequence: ["Q-2026-013"] → "Q-2026-014". */
export function nextQuoteNumberFrom(existing: string[], year: number): string {
  const prefix = `Q-${year}-`;
  const max = existing
    .filter((n) => n.startsWith(prefix))
    .map((n) => Number.parseInt(n.slice(prefix.length), 10))
    .filter(Number.isFinite)
    .reduce((m, n) => Math.max(m, n), 0);
  return prefix + String(max + 1).padStart(3, "0");
}
