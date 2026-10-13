import { describe, expect, it } from "vitest";
import { computeQuoteTotals, defaultValidUntil, lineAmount, nextQuoteNumberFrom, quoteNeedsDecimals } from "./quote";

const items = [
  { qty: 1200, rate: 45 }, // 54,000
  { qty: 3, rate: 8500 }, // 25,500
];

describe("lineAmount", () => {
  it("multiplies qty by rate", () => expect(lineAmount({ qty: 1200, rate: 45 })).toBe(54000));
  it("rounds float noise to paise", () => expect(lineAmount({ qty: 0.1, rate: 3 })).toBe(0.3));
});

describe("computeQuoteTotals", () => {
  it("has no discount by default", () => {
    expect(computeQuoteTotals(items, { discountType: null, discountValue: 500 })).toEqual({ subtotal: 79500, discount: 0, total: 79500 });
  });
  it("takes a flat amount off", () => {
    expect(computeQuoteTotals(items, { discountType: "flat", discountValue: 3500 })).toEqual({ subtotal: 79500, discount: 3500, total: 76000 });
  });
  it("takes a percentage off", () => {
    expect(computeQuoteTotals(items, { discountType: "percent", discountValue: 10 })).toEqual({ subtotal: 79500, discount: 7950, total: 71550 });
  });
  it("never discounts below zero", () => {
    expect(computeQuoteTotals(items, { discountType: "flat", discountValue: 1_000_000 }).total).toBe(0);
    expect(computeQuoteTotals(items, { discountType: "percent", discountValue: 150 }).total).toBe(0);
  });
  it("ignores a negative discount", () => {
    expect(computeQuoteTotals(items, { discountType: "flat", discountValue: -100 }).total).toBe(79500);
  });
});

describe("quoteNeedsDecimals", () => {
  it("is false for whole rupees", () => {
    expect(quoteNeedsDecimals(items, computeQuoteTotals(items, { discountType: null, discountValue: 0 }))).toBe(false);
  });
  it("is true when a percent discount leaves paise", () => {
    const one = [{ qty: 1, rate: 999 }];
    expect(quoteNeedsDecimals(one, computeQuoteTotals(one, { discountType: "percent", discountValue: 5 }))).toBe(true);
  });
});

describe("nextQuoteNumberFrom", () => {
  it("starts the year at 001", () => expect(nextQuoteNumberFrom([], 2026)).toBe("Q-2026-001"));
  it("continues from the highest of the year", () => {
    expect(nextQuoteNumberFrom(["Q-2026-002", "Q-2026-013", "Q-2025-090"], 2026)).toBe("Q-2026-014");
  });
});

describe("defaultValidUntil", () => {
  it("adds 30 days", () => expect(defaultValidUntil("2026-10-13")).toBe("2026-11-12"));
});
