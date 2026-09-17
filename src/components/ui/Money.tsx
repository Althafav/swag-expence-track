import React from "react";

/** Formats a number as an en-IN grouped rupee string, without colour or markup. */
export function formatINR(value: number, { decimals = false }: { decimals?: boolean } = {}): string {
  const n = Math.abs(Number(value) || 0);
  return (
    "₹" +
    n.toLocaleString("en-IN", {
      minimumFractionDigits: decimals ? 2 : 0,
      maximumFractionDigits: decimals ? 2 : 0,
    })
  );
}

export type MoneyKind = "neutral" | "income" | "expense" | "profit" | "on-dark";
export type MoneySize = "sm" | "md" | "lg" | "hero";

export interface MoneyProps {
  /** Amount in rupees. Negative values render with a true minus sign (−). */
  value: number;
  /** income = moss; expense = clay; profit = sign-aware (moss when ≥0, clay when <0); on-dark = lime / soft-clay for dark surfaces; neutral = ink. */
  kind?: MoneyKind;
  /** Force an explicit +/− prefix (transaction lists). */
  signed?: boolean;
  /** sm = inline amount (Inter 16) · md/lg/hero = Anton figures. */
  size?: MoneySize;
  /** Show paise. Off by default — the tool deals in whole rupees. */
  decimals?: boolean;
  /** Prefix a ▴/▾ direction glyph (kept from ProjectRow's existing identity). */
  showGlyph?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Every rupee figure in the product renders through Money — it owns en-IN
 * grouping, the ₹ symbol, and the rule that a profit figure takes its
 * colour from its sign. No other component may format a rupee amount or
 * pick a money colour itself.
 */
export default function Money({
  value,
  kind = "neutral",
  signed = false,
  size = "md",
  decimals = false,
  showGlyph = false,
  style,
  className = "",
}: MoneyProps) {
  const n = Number(value) || 0;
  const negative = n < 0;

  const color =
    kind === "income"
      ? "var(--income)"
      : kind === "expense"
      ? "var(--expense)"
      : kind === "profit"
      ? negative
        ? "var(--profit-negative)"
        : "var(--profit-positive)"
      : kind === "on-dark"
      ? negative
        ? "#FFB5A0"
        : "var(--lime-400)"
      : "var(--text-strong)";

  const font =
    size === "hero"
      ? "var(--type-hero)"
      : size === "lg"
      ? "var(--type-figure)"
      : size === "md"
      ? "var(--type-figure-sm)"
      : "var(--type-amount)";

  const sign = signed ? (negative ? "−" : kind === "expense" ? "−" : "+") : negative ? "−" : "";

  return (
    <span
      className={`swag-tabular ${className}`}
      style={{ font, letterSpacing: "var(--ls-display)", color, whiteSpace: "nowrap", ...style }}
    >
      {showGlyph && (
        <span aria-hidden="true" style={{ marginRight: 6 }}>
          {negative ? "▾" : "▴"}
        </span>
      )}
      {sign}
      {formatINR(n, { decimals })}
    </span>
  );
}
