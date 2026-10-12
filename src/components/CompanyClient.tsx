"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Building2, X } from "lucide-react";
import Button from "./ui/Button";
import Card from "./ui/Card";
import SegmentedControl from "./ui/SegmentedControl";
import TransactionRow from "./ui/TransactionRow";
import EmptyState from "./ui/EmptyState";
import Money from "./ui/Money";
import CategoryDonut from "./CategoryDonut";
import TrendChart from "./TrendChart";
import { plural } from "@/lib/format";
import { COMPANY_REF, useTrackerModals } from "./AppShell";
import type { Transaction } from "@/lib/db";
import type { MonthlyPoint } from "@/lib/queries";

const FILTERS = ["All", "Expense", "Income"];

// Soft moss / soft clay used for figures on the ink panel (same as the dashboard hero).
const ON_DARK_INCOME = "#C7E6C9";
const ON_DARK_EXPENSE = "#F0B8A6";

export interface CompanyClientProps {
  transactions: Transaction[];
  monthly: MonthlyPoint[];
}

/**
 * Company entries — money for the whole business rather than one project
 * (salaries, marketing, office rent). They count toward the dashboard's total
 * profit but never toward any project's.
 */
export default function CompanyClient({ transactions, monthly }: CompanyClientProps) {
  const { openLogTransaction, openViewTransaction } = useTrackerModals();
  const [filter, setFilter] = useState("All");
  const [category, setCategory] = useState<string | null>(null);

  const expenseTx = transactions.filter((t) => t.type === "expense");
  const incomeTx = transactions.filter((t) => t.type === "income");
  const expense = expenseTx.reduce((s, t) => s + t.amount, 0);
  const income = incomeTx.reduce((s, t) => s + t.amount, 0);
  const thisMonth = format(new Date(), "yyyy-MM");
  const monthExpense = expenseTx.filter((t) => t.date.startsWith(thisMonth)).reduce((s, t) => s + t.amount, 0);

  const shown = transactions.filter(
    (t) =>
      (filter === "All" || (filter === "Income" ? t.type === "income" : t.type === "expense")) &&
      (!category || t.category === category)
  );
  const net = shown.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);

  const logButton = (
    <Button variant="primary" iconLeft="plus" onClick={() => openLogTransaction(COMPANY_REF)}>
      Company expense
    </Button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
      <section
        className="mow-lines"
        style={{
          background: "var(--ink)",
          borderRadius: "var(--r-card)",
          padding: "var(--sp-6)",
          color: "var(--text-on-dark)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--sp-6)",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-4)", alignItems: "flex-start" }}>
          <span
            style={{
              width: 40,
              height: 40,
              flex: "none",
              borderRadius: "var(--r-pill)",
              background: "var(--ink-700)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Building2 size={20} />
          </span>
          <div style={{ flex: "1 1 240px", minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            <h2 style={{ font: "var(--type-h2)", letterSpacing: "var(--ls-display)", textTransform: "uppercase", color: "var(--text-on-dark)" }}>
              Company
            </h2>
            <span style={{ font: "var(--type-body-sm)", color: "var(--text-on-dark-muted)" }}>
              Costs that aren’t for one project — salaries, marketing, office rent. They come out of the business’s total profit.
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-6)", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ font: "var(--type-body-sm)", color: "var(--text-on-dark-muted)" }}>
              Company expenses · {plural(expenseTx.length, "entry", "entries")}
            </span>
            <Money value={expense} kind="neutral" size="hero" style={{ color: ON_DARK_EXPENSE }} />
          </div>
          <div style={{ display: "flex", gap: "var(--sp-7)", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ font: "var(--type-body-sm)", color: "var(--text-on-dark-muted)" }}>Spent this month</span>
              <Money value={monthExpense} kind="neutral" size="md" style={{ color: ON_DARK_EXPENSE }} />
            </div>
            {income > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ font: "var(--type-body-sm)", color: "var(--text-on-dark-muted)" }}>Other income</span>
                <Money value={income} kind="neutral" size="md" style={{ color: ON_DARK_INCOME }} />
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="swag-split">
        <Card padding={20}>
          <CategoryDonut transactions={transactions} selected={category} onSelect={setCategory} emptyAction={logButton} />
        </Card>
        <Card padding={20}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
            <span style={{ font: "var(--type-title)" }}>Monthly trend</span>
            <TrendChart data={monthly} height={200} />
          </div>
        </Card>
      </div>

      <Card padding={0}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-4)", alignItems: "center", padding: "var(--sp-5) var(--sp-5) var(--sp-4)" }}>
          <span style={{ font: "var(--type-title)", flex: 1 }}>Entries</span>
          <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} style={{ flex: "0 1 260px" }} />
          <Button variant="primary" iconLeft="plus" onClick={() => openLogTransaction(COMPANY_REF)}>
            Log
          </Button>
        </div>
        {category && (
          <div style={{ padding: "0 var(--sp-5) var(--sp-3)" }}>
            <button
              type="button"
              onClick={() => setCategory(null)}
              aria-label={`Clear filter: ${category}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                minHeight: 34,
                padding: "0 var(--sp-4)",
                borderRadius: "var(--r-pill)",
                border: 0,
                background: "var(--surface-sunken)",
                color: "var(--text-strong)",
                font: "var(--type-label)",
                cursor: "pointer",
              }}
            >
              {category}
              <X size={14} />
            </button>
          </div>
        )}
        <div style={{ padding: "0 var(--sp-5) var(--sp-4)" }}>
          {shown.length === 0 ? (
            <EmptyState
              icon={<Building2 size={24} />}
              title={category ? `No entries in ${category}` : transactions.length === 0 ? "No company expenses yet" : `No ${filter.toLowerCase()} entries`}
              body={
                category
                  ? "Clear the category filter to see everything."
                  : "Log salaries, marketing, rent and other costs that aren’t for one project."
              }
              action={category ? undefined : logButton}
            />
          ) : (
            shown.map((tx) => <TransactionRow key={tx.id} tx={tx} onClick={() => openViewTransaction(tx, COMPANY_REF)} />)
          )}
        </div>
        {shown.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "var(--sp-4)",
              padding: "var(--sp-4) var(--sp-5)",
              borderTop: "1px solid var(--border-hairline)",
              background: "var(--n-25)",
            }}
          >
            <span className="swag-eyebrow">{plural(shown.length, "entry", "entries")} shown</span>
            <span style={{ font: "var(--type-label)", display: "flex", gap: 6, alignItems: "baseline" }}>
              Net <Money value={net} kind="profit" size="sm" />
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}
