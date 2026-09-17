"use client";

import React from "react";
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from "lucide-react";
import Money from "./Money";
import { formatDate } from "@/lib/format";

export interface TransactionRowData {
  id: string;
  type: "income" | "expense";
  /** Positive rupee amount; the type decides the sign shown. */
  amount: number;
  /** ISO storage date ("2026-09-12"), formatted here via formatDate. */
  date: string;
  /** One of the app's fixed category lists. */
  category: string;
  notes?: string | null;
  /** Project name — only shown when the list spans projects. */
  projectName?: string | null;
}

export interface TransactionRowProps {
  tx: TransactionRowData;
  /** Opens the edit modal. */
  onClick?: () => void;
  /** Show the project name in the meta line (cross-project lists). */
  showProject?: boolean;
  /** Escape hatch for row actions (edit/delete) rendered instead of the chevron. */
  actions?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

/** One income or expense line: direction tile, category, date/notes, signed amount. */
export default function TransactionRow({
  tx,
  onClick,
  showProject = false,
  actions,
  style,
  className = "",
}: TransactionRowProps) {
  const income = tx.type === "income";

  return (
    <button type="button" className={`swag-trow ${className}`} onClick={onClick} style={style}>
      <span
        style={{
          width: 38,
          height: 38,
          flex: "none",
          borderRadius: "var(--r-control)",
          background: income ? "var(--income-soft)" : "var(--expense-soft)",
          color: income ? "var(--income)" : "var(--expense)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {income ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
      </span>

      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{
            font: "var(--type-label)",
            color: "var(--text-strong)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {tx.category}
        </span>
        <span
          style={{
            font: "var(--type-body-sm)",
            color: "var(--text-muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {formatDate(tx.date)}
          {showProject && tx.projectName ? ` · ${tx.projectName}` : ""}
          {tx.notes ? ` · ${tx.notes}` : ""}
        </span>
      </span>

      <Money value={tx.amount} kind={income ? "income" : "expense"} size="sm" signed />

      {actions ? (
        <span onClick={(e) => e.stopPropagation()}>{actions}</span>
      ) : (
        onClick && <ChevronRight size={15} style={{ color: "var(--text-faint)" }} />
      )}
    </button>
  );
}
