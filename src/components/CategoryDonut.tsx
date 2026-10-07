"use client";

import React, { useState, useSyncExternalStore } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import Money from "./ui/Money";
import SegmentedControl from "./ui/SegmentedControl";
import EmptyState from "./ui/EmptyState";
import type { Transaction } from "@/lib/db";

/**
 * One fixed colour per category, so a colour means the same thing on every
 * project. Earthy tokens only — brand lime never fills a slice, and the warm
 * clay/amber family is kept for materials, the biggest spend on most jobs.
 */
const CATEGORY_COLOR: Record<string, string> = {
  "Materials · Interlock/Paving": "var(--clay-700)",
  "Materials · Grass/Turf": "var(--clay)",
  "Materials · Cladding stone": "var(--amber-500)",
  "Materials · Other": "var(--lime-700)",
  Labor: "var(--moss-700)",
  "Equipment rental": "var(--sky-500)",
  "Transport/Fuel": "var(--n-600)",
  Subcontractor: "var(--ink-700)",
  Misc: "var(--n-300)",
  "Advance payment": "var(--moss-700)",
  "Milestone payment": "var(--moss)",
  "Final payment": "var(--lime-700)",
  Other: "var(--n-300)",
};
const FALLBACK_COLOR = "var(--n-400)";

const KINDS = ["Expense", "Income"];

export interface CategoryDonutProps {
  transactions: Transaction[];
  /** Category currently filtering the transaction list, if any. */
  selected: string | null;
  /** Toggle a category filter (null clears it). */
  onSelect: (category: string | null) => void;
  /** Shown under the empty state when there's nothing to chart. */
  emptyAction?: React.ReactNode;
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  );
}

/** Where a project's money went (or came from), split by category. Built with Recharts. */
export default function CategoryDonut({ transactions, selected, onSelect, emptyAction }: CategoryDonutProps) {
  const [kind, setKind] = useState("Expense");
  const reducedMotion = usePrefersReducedMotion();
  const type = kind === "Income" ? "income" : "expense";

  // Aggregated in JS like the rest of the app — one project is at most a few hundred rows.
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== type) continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  }
  const slices = [...totals.entries()]
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value);
  const total = slices.reduce((s, x) => s + x.value, 0);

  function changeKind(next: string) {
    setKind(next);
    // A category from the other side would filter the list down to nothing.
    if (selected) onSelect(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-4)", alignItems: "center" }}>
        <span style={{ font: "var(--type-title)", flex: 1, minWidth: 160 }}>
          {type === "expense" ? "Where the money went" : "Where the money came from"}
        </span>
        <SegmentedControl options={KINDS} value={kind} onChange={changeKind} style={{ flex: "0 1 200px" }} />
      </div>

      {slices.length === 0 ? (
        <EmptyState
          icon="receipt"
          title={type === "expense" ? "No expenses logged yet" : "No income logged yet"}
          body="Log one to see the split by category."
          action={emptyAction}
        />
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-5)", alignItems: "center" }}>
          <div style={{ position: "relative", width: 168, height: 168, flex: "none", margin: "0 auto" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="category"
                  innerRadius={56}
                  outerRadius={82}
                  paddingAngle={slices.length > 1 ? 1.5 : 0}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                  isAnimationActive={!reducedMotion}
                  onClick={(_, index) => {
                    const c = slices[index]?.category;
                    if (c) onSelect(selected === c ? null : c);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {slices.map((s) => (
                    <Cell
                      key={s.category}
                      fill={CATEGORY_COLOR[s.category] ?? FALLBACK_COLOR}
                      opacity={selected && selected !== s.category ? 0.3 : 1}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                gap: 2,
              }}
            >
              <span style={{ font: "var(--type-body-sm)", color: "var(--text-muted)" }}>
                {type === "expense" ? "Spent" : "Received"}
              </span>
              <Money value={total} kind={type} size="sm" />
            </div>
          </div>

          <div style={{ flex: "1 1 220px", minWidth: 0, display: "flex", flexDirection: "column" }}>
            {slices.map((s) => {
              const active = selected === s.category;
              return (
                <button
                  key={s.category}
                  type="button"
                  className="swag-legend"
                  aria-pressed={active}
                  onClick={() => onSelect(active ? null : s.category)}
                >
                  <i
                    aria-hidden="true"
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      flex: "none",
                      background: CATEGORY_COLOR[s.category] ?? FALLBACK_COLOR,
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      font: "var(--type-body-sm)",
                      color: "var(--text-strong)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.category}
                  </span>
                  <span className="swag-tabular" style={{ font: "var(--type-body-sm)", color: "var(--text-muted)", width: 40, textAlign: "right" }}>
                    {Math.round((s.value / total) * 100)}%
                  </span>
                  <Money value={s.value} kind="neutral" size="sm" style={{ font: "var(--type-label)", minWidth: 84, textAlign: "right" }} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
