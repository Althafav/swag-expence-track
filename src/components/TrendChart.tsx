"use client";

import React from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parse } from "date-fns";
import { formatINR } from "./ui/Money";
import type { MonthlyPoint } from "@/lib/queries";

export interface TrendChartProps {
  /** Six to twelve months, oldest first. */
  data: MonthlyPoint[];
  height?: number;
  /** Invert grid and label colours for the dark hero panel. */
  onDark?: boolean;
}

interface TooltipPayloadEntry {
  dataKey: string;
  value: number;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const income = payload.find((p) => p.dataKey === "income")?.value ?? 0;
  const expense = payload.find((p) => p.dataKey === "expense")?.value ?? 0;
  return (
    <div
      style={{
        background: "var(--ink)",
        color: "var(--text-on-dark)",
        borderRadius: "var(--r-control)",
        padding: "var(--sp-3) var(--sp-4)",
        font: "var(--type-body-sm)",
        boxShadow: "var(--sh-raised)",
      }}
    >
      <div style={{ marginBottom: 4 }}>{label}</div>
      <div style={{ color: "#C7E6C9" }}>Income {formatINR(income)}</div>
      <div style={{ color: "#F0B8A6" }}>Expense {formatINR(expense)}</div>
    </div>
  );
}

/** Monthly income-vs-expense trend — paired bars, moss against clay. Built with Recharts. */
export default function TrendChart({ data, height = 180, onDark = false }: TrendChartProps) {
  const grid = onDark ? "rgba(255,255,255,.14)" : "var(--border-hairline)";
  const axis = onDark ? "var(--text-on-dark-muted)" : "var(--text-muted)";

  const chartData = data.map((d) => ({
    ...d,
    label: format(parse(d.month, "yyyy-MM", new Date()), "MMM"),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barGap={3}>
          <CartesianGrid vertical={false} stroke={grid} strokeDasharray="0" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: axis, fontSize: 13 }}
          />
          <YAxis hide />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: onDark ? "rgba(255,255,255,.06)" : "var(--n-25)" }} />
          <Bar dataKey="income" fill="var(--income)" radius={[3, 3, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expense" fill="var(--expense)" radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", gap: "var(--sp-5)", justifyContent: "center" }}>
        {[["Income", "var(--income)"], ["Expense", "var(--expense)"]].map(([l, c]) => (
          <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "var(--type-body-sm)", color: axis }}>
            <i style={{ width: 10, height: 10, background: c, borderRadius: 2, display: "block" }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
