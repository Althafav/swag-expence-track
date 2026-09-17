"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, MapPin, TriangleAlert } from "lucide-react";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Card from "./ui/Card";
import SectionHead from "./ui/SectionHead";
import SegmentedControl from "./ui/SegmentedControl";
import StatCard from "./ui/StatCard";
import TransactionRow from "./ui/TransactionRow";
import EmptyState from "./ui/EmptyState";
import Money from "./ui/Money";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/status";
import { formatDate, formatPercent, plural } from "@/lib/format";
import { useTrackerModals } from "./AppShell";
import type { Project, Transaction } from "@/lib/db";

const FILTERS = ["All", "Income", "Expense"];

export interface ProjectDetailClientProps {
  project: Project;
  transactions: Transaction[];
}

export default function ProjectDetailClient({ project, transactions }: ProjectDetailClientProps) {
  const { openEditProject, openLogTransaction, openEditTransaction } = useTrackerModals();
  const [filter, setFilter] = useState("All");
  const projectRef = { id: project.id, name: project.name };

  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const profit = income - expense;

  const shown =
    filter === "All" ? transactions : transactions.filter((t) => (filter === "Income" ? t.type === "income" : t.type === "expense"));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-4)", alignItems: "flex-start" }}>
        <Link
          href="/projects"
          aria-label="Back to projects"
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

        <div style={{ flex: "1 1 240px", minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", flexWrap: "wrap" }}>
            <h2 style={{ font: "var(--type-h2)", letterSpacing: "var(--ls-display)", textTransform: "uppercase" }}>{project.name}</h2>
            <Badge tone={STATUS_TONE[project.status] ?? "brand"}>{STATUS_LABEL[project.status] ?? project.status}</Badge>
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: 6, font: "var(--type-body-sm)", color: "var(--text-muted)", flexWrap: "wrap" }}>
            <MapPin size={14} />
            {project.location}
            {project.client && <span>· {project.client}</span>}
            {project.startDate && <span>· started {formatDate(project.startDate)}</span>}
          </span>
        </div>

        <div style={{ display: "flex", gap: "var(--sp-3)" }}>
          <Button variant="ghost" iconLeft="pencil" onClick={() => openEditProject(project)}>
            Edit
          </Button>
          <a href={`/api/export?projectId=${project.id}`} className="swag-btn swag-btn--outline swag-btn--md">
            <Download size={16} />
            Export CSV
          </a>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--sp-4)" }}>
        <StatCard
          label="Income"
          value={income}
          kind="income"
          icon="arrow-down-left"
          caption={plural(transactions.filter((t) => t.type === "income").length, "payment", "payments")}
        />
        <StatCard
          label="Expense"
          value={expense}
          kind="expense"
          icon="arrow-up-right"
          caption={plural(transactions.filter((t) => t.type === "expense").length, "entry", "entries")}
        />
        <StatCard
          label={profit < 0 ? "Loss" : "Profit"}
          value={profit}
          kind="profit"
          icon="trending-up"
          caption={`${formatPercent(profit, income)} of income`}
        />
      </div>

      {profit < 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--sp-4)",
            padding: "var(--sp-4) var(--sp-5)",
            background: "var(--expense-soft)",
            borderRadius: "var(--r-card-inner)",
            border: "1px solid var(--clay-500)",
          }}
        >
          <TriangleAlert size={20} style={{ color: "var(--expense)", flexShrink: 0 }} />
          <span style={{ font: "var(--type-body-sm)", color: "var(--clay-700)" }}>
            Expenses exceed income by <Money value={Math.abs(profit)} kind="neutral" size="sm" style={{ color: "inherit" }} />. Check for
            unbilled milestones before the next payout.
          </span>
        </div>
      )}

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
        <div style={{ padding: "0 var(--sp-5) var(--sp-4)" }}>
          {shown.length === 0 ? (
            <EmptyState
              icon="receipt"
              title={`No ${filter.toLowerCase()} entries`}
              body="Log the first one for this project."
              action={
                <Button variant="primary" iconLeft="plus" onClick={() => openLogTransaction(projectRef)}>
                  Log transaction
                </Button>
              }
            />
          ) : (
            shown.map((tx) => <TransactionRow key={tx.id} tx={tx} onClick={() => openEditTransaction(tx, projectRef)} />)
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
