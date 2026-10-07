"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Button from "./ui/Button";
import Card from "./ui/Card";
import SegmentedControl from "./ui/SegmentedControl";
import TransactionRow from "./ui/TransactionRow";
import EmptyState from "./ui/EmptyState";
import Money from "./ui/Money";
import { plural } from "@/lib/format";
import { useTrackerModals } from "./AppShell";
import type { RecentTransaction } from "@/lib/queries";

const FILTERS = ["All", "Income", "Expense"];

export interface ActivityClientProps {
  transactions: RecentTransaction[];
}

/** Every transaction across all live projects — the dashboard's "Recent activity" in full. */
export default function ActivityClient({ transactions }: ActivityClientProps) {
  const { openLogTransaction, openViewTransaction } = useTrackerModals();
  const [filter, setFilter] = useState("All");

  const shown =
    filter === "All" ? transactions : transactions.filter((t) => (filter === "Income" ? t.type === "income" : t.type === "expense"));
  const net = shown.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
      <div style={{ display: "flex", gap: "var(--sp-4)", alignItems: "center" }}>
        <Link
          href="/"
          aria-label="Back to dashboard"
          style={{
            width: 40,
            height: 40,
            flex: "none",
            borderRadius: "var(--r-pill)",
            background: "var(--surface-sunken)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-strong)",
          }}
        >
          <ArrowLeft size={20} />
        </Link>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span className="swag-eyebrow">Across projects</span>
          <h2 style={{ font: "var(--type-h2)", letterSpacing: "var(--ls-display)", textTransform: "uppercase" }}>All activity</h2>
        </div>
      </div>

      <Card padding={0}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-4)", alignItems: "center", padding: "var(--sp-5) var(--sp-5) var(--sp-4)" }}>
          <span style={{ font: "var(--type-title)", flex: 1 }}>Transactions</span>
          <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} style={{ flex: "0 1 260px" }} />
          <Button variant="primary" iconLeft="plus" onClick={() => openLogTransaction()}>
            Log
          </Button>
        </div>
        <div style={{ padding: "0 var(--sp-5) var(--sp-4)" }}>
          {shown.length === 0 ? (
            <EmptyState
              icon="receipt"
              title={`No ${filter.toLowerCase()} entries`}
              body="Logged transactions from every project show up here."
              action={
                <Button variant="primary" iconLeft="plus" onClick={() => openLogTransaction()}>
                  Log transaction
                </Button>
              }
            />
          ) : (
            shown.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                showProject
                onClick={() => openViewTransaction(tx, { id: tx.projectId, name: tx.projectName })}
              />
            ))
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
