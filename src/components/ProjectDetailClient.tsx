"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, MapPin, X } from "lucide-react";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Card from "./ui/Card";
import SectionHead from "./ui/SectionHead";
import SegmentedControl from "./ui/SegmentedControl";
import TransactionRow from "./ui/TransactionRow";
import EmptyState from "./ui/EmptyState";
import Money from "./ui/Money";
import CategoryDonut from "./CategoryDonut";
import TrendChart from "./TrendChart";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/status";
import { formatDate, plural } from "@/lib/format";
import { useTrackerModals } from "./AppShell";
import type { Project, Transaction } from "@/lib/db";
import type { MonthlyPoint } from "@/lib/queries";

const FILTERS = ["All", "Income", "Expense"];

// Soft moss / soft clay used for figures on the ink panel (same as the dashboard hero).
const ON_DARK_INCOME = "#C7E6C9";
const ON_DARK_EXPENSE = "#F0B8A6";

// Header actions sit on the ink panel, so they take an on-dark outline.
const onDarkAction: React.CSSProperties = {
  background: "transparent",
  color: "var(--text-on-dark)",
  border: "1px solid var(--border-on-dark)",
};

export interface ProjectDetailClientProps {
  project: Project;
  transactions: Transaction[];
  monthly: MonthlyPoint[];
}

/**
 * The margin bar: of every rupee received, how much went back out (clay)
 * and how much the business kept (moss). On a loss the bar is all clay —
 * a loss never renders in moss or lime.
 */
function MarginBar({ income, expense }: { income: number; expense: number }) {
  const profit = income - expense;
  const loss = profit < 0;
  const spentShare = income > 0 ? Math.min(expense / income, 1) : expense > 0 ? 1 : 0;
  const spentPct = Math.round(spentShare * 100);
  const empty = income === 0 && expense === 0;

  const label = empty
    ? "Nothing logged yet"
    : loss
    ? `Spent more than received`
    : `${spentPct}% of income spent, ${100 - spentPct}% kept`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
      <div className="swag-margin" role="img" aria-label={label}>
        {!empty && (
          <>
            <span className="swag-margin__seg" style={{ width: `${spentShare * 100}%`, background: "var(--clay)" }} />
            {!loss && <span className="swag-margin__seg" style={{ flex: 1, background: "var(--moss)" }} />}
          </>
        )}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "var(--sp-4)",
          flexWrap: "wrap",
          font: "var(--type-body-sm)",
          color: "var(--text-on-dark-muted)",
        }}
      >
        {empty ? (
          <span>{label}</span>
        ) : loss ? (
          <>
            <span>Spent more than received</span>
            <span style={{ display: "inline-flex", gap: 6, alignItems: "baseline" }}>
              <Money value={-profit} kind="neutral" size="sm" style={{ color: ON_DARK_EXPENSE }} /> over income
            </span>
          </>
        ) : (
          <>
            <span>{spentPct}% of income spent</span>
            <span>{100 - spentPct}% kept</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function ProjectDetailClient({ project, transactions, monthly }: ProjectDetailClientProps) {
  const { openEditProject, openLogTransaction, openViewTransaction } = useTrackerModals();
  const [filter, setFilter] = useState("All");
  const [category, setCategory] = useState<string | null>(null);
  const projectRef = { id: project.id, name: project.name };

  const incomeTx = transactions.filter((t) => t.type === "income");
  const expenseTx = transactions.filter((t) => t.type === "expense");
  const income = incomeTx.reduce((s, t) => s + t.amount, 0);
  const expense = expenseTx.reduce((s, t) => s + t.amount, 0);
  const profit = income - expense;

  const shown = transactions.filter(
    (t) =>
      (filter === "All" || (filter === "Income" ? t.type === "income" : t.type === "expense")) &&
      (!category || t.category === category)
  );

  const logButton = (
    <Button variant="primary" iconLeft="plus" onClick={() => openLogTransaction(projectRef)}>
      Log transaction
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
          gap: "var(--sp-7)",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-4)", alignItems: "flex-start" }}>
          <Link
            href="/projects"
            aria-label="Back to projects"
            style={{
              width: 40,
              height: 40,
              flex: "none",
              borderRadius: "var(--r-pill)",
              background: "var(--ink-700)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-on-dark)",
            }}
          >
            <ArrowLeft size={20} />
          </Link>

          <div style={{ flex: "1 1 240px", minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", flexWrap: "wrap" }}>
              <h2 style={{ font: "var(--type-h2)", letterSpacing: "var(--ls-display)", textTransform: "uppercase", color: "var(--text-on-dark)" }}>
                {project.name}
              </h2>
              <Badge tone={STATUS_TONE[project.status] ?? "brand"}>{STATUS_LABEL[project.status] ?? project.status}</Badge>
            </div>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                font: "var(--type-body-sm)",
                color: "var(--text-on-dark-muted)",
                flexWrap: "wrap",
              }}
            >
              <MapPin size={14} />
              {project.location}
              {project.client && <span>· {project.client}</span>}
              {project.startDate && <span>· started {formatDate(project.startDate)}</span>}
              {project.completedDate && <span>· completed {formatDate(project.completedDate)}</span>}
            </span>
          </div>

          <div style={{ display: "flex", gap: "var(--sp-3)", flexWrap: "wrap" }}>
            <Button variant="dark" iconLeft="pencil" onClick={() => openEditProject(project)} style={onDarkAction}>
              Edit
            </Button>
            <a href={`/api/export?projectId=${project.id}`} className="swag-btn swag-btn--dark swag-btn--md" style={onDarkAction}>
              <Download size={16} />
              Export CSV
            </a>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-6)", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ font: "var(--type-body-sm)", color: "var(--text-on-dark-muted)" }}>{profit < 0 ? "Loss" : "Profit"}</span>
            <Money value={profit} kind="on-dark" size="hero" />
          </div>
          <div style={{ display: "flex", gap: "var(--sp-7)", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ font: "var(--type-body-sm)", color: "var(--text-on-dark-muted)" }}>
                Income · {plural(incomeTx.length, "payment", "payments")}
              </span>
              <Money value={income} kind="neutral" size="md" style={{ color: ON_DARK_INCOME }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ font: "var(--type-body-sm)", color: "var(--text-on-dark-muted)" }}>
                Expense · {plural(expenseTx.length, "entry", "entries")}
              </span>
              <Money value={expense} kind="neutral" size="md" style={{ color: ON_DARK_EXPENSE }} />
            </div>
          </div>
        </div>

        <MarginBar income={income} expense={expense} />
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

      {project.notes && (
        <Card padding={16}>
          <SectionHead title="Notes" />
          <p style={{ font: "var(--type-body)", marginTop: 8 }}>{project.notes}</p>
        </Card>
      )}

      <Card padding={0}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-4)", alignItems: "center", padding: "var(--sp-5) var(--sp-5) var(--sp-4)" }}>
          <span style={{ font: "var(--type-title)", flex: 1 }}>Transactions</span>
          <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} style={{ flex: "0 1 260px" }} />
          <Button variant="primary" iconLeft="plus" onClick={() => openLogTransaction(projectRef)}>
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
              icon="receipt"
              title={category ? `No ${filter === "All" ? "" : filter.toLowerCase() + " "}entries in ${category}` : `No ${filter.toLowerCase()} entries`}
              body={category ? "Clear the category filter to see everything." : "Log the first one for this project."}
              action={category ? undefined : logButton}
            />
          ) : (
            shown.map((tx) => <TransactionRow key={tx.id} tx={tx} onClick={() => openViewTransaction(tx, projectRef)} />)
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
              Net <Money value={profit} kind="profit" size="sm" />
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}
