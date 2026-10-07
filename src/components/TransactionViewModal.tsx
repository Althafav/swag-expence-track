"use client";

import React from "react";
import { format, parseISO } from "date-fns";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Money from "./ui/Money";
import { formatDate } from "@/lib/format";
import type { Transaction } from "@/lib/db";

export interface TransactionViewModalProps {
  open: boolean;
  onClose: () => void;
  /** Swaps this sheet for the edit form (AppShell owns the hand-off). */
  onEdit: () => void;
  tx: Transaction;
  project: { id: string; name: string };
}

/**
 * Read-only receipt for one transaction. Tapping a row lands here first so a
 * stray tap on site can't change or delete anything — editing is one
 * deliberate step further, behind Edit.
 */
export default function TransactionViewModal({ open, onClose, onEdit, tx, project }: TransactionViewModalProps) {
  const income = tx.type === "income";

  const rows: [string, React.ReactNode][] = [
    ["Type", income ? "Income" : "Expense"],
    ["Category", tx.category],
    ["Date", formatDate(tx.date)],
    ["Project", project.name],
  ];
  if (tx.notes) rows.push(["Notes", tx.notes]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transaction"
      subtitle={project.name}
      footer={
        <>
          <span style={{ flex: 1 }} />
          <Button variant="ghost" type="button" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" type="button" iconLeft="pencil" onClick={onEdit}>
            Edit
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
          <span
            style={{
              width: 52,
              height: 52,
              flex: "none",
              borderRadius: "var(--r-control)",
              background: income ? "var(--income-soft)" : "var(--expense-soft)",
              color: income ? "var(--income)" : "var(--expense)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {income ? <ArrowDownLeft size={26} /> : <ArrowUpRight size={26} />}
          </span>
          <Money value={tx.amount} kind={income ? "income" : "expense"} size="lg" signed />
        </div>

        <dl style={{ margin: 0, display: "flex", flexDirection: "column" }}>
          {rows.map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "flex",
                gap: "var(--sp-5)",
                justifyContent: "space-between",
                alignItems: "baseline",
                padding: "var(--sp-4) 0",
                borderBottom: "1px solid var(--border-hairline)",
              }}
            >
              <dt style={{ font: "var(--type-body-sm)", color: "var(--text-muted)", flex: "none" }}>{label}</dt>
              <dd style={{ margin: 0, font: "var(--type-label)", color: "var(--text-strong)", textAlign: "right", overflowWrap: "anywhere" }}>
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <span style={{ font: "var(--type-body-sm)", color: "var(--text-muted)" }}>
          Logged {format(parseISO(tx.createdAt), "dd MMM yyyy, h:mm a")}
        </span>
      </div>
    </Modal>
  );
}
