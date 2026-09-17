import { format, parseISO } from "date-fns";

/** Formats an ISO storage date ("2026-09-12") as "12 Sep 2026". */
export function formatDate(isoDate: string): string {
  return format(parseISO(isoDate), "dd MMM yyyy");
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Percentage of `part` within `whole`, true-minus signed to match Money's convention. */
export function formatPercent(part: number, whole: number): string {
  const p = Math.round((part / Math.max(1, whole)) * 100);
  return (p < 0 ? "−" : "") + Math.abs(p) + "%";
}
