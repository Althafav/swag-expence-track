"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Field from "./ui/Field";
import SegmentedControl from "./ui/SegmentedControl";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/categories";
import type { Transaction } from "@/lib/db";

export interface TransactionFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Preselected project — omitted when opened from a global entry point (FAB, dashboard). */
  project?: { id: string; name: string };
  /** Present when editing an existing transaction. */
  tx?: Transaction;
}

interface ProjectOption {
  id: string;
  name: string;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function TransactionFormModal({ open, onClose, project, tx }: TransactionFormModalProps) {
  const router = useRouter();
  const editing = Boolean(tx);

  const [type, setType] = useState<"Expense" | "Income">(tx?.type === "income" ? "Income" : "Expense");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setType(tx?.type === "income" ? "Income" : "Expense");
    setError("");
  }, [open, tx]);

  useEffect(() => {
    if (!open || project) return;
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data: ProjectOption[]) => setProjects(data))
      .catch(() => setProjects([]));
  }, [open, project]);

  const categories = type === "Income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const amount = Number(form.get("amount"));
    const projectId = project?.id ?? String(form.get("projectId") || "");
    const category = String(form.get("category") || "");
    const date = String(form.get("date") || "");
    const notes = String(form.get("notes") || "").trim();

    if (!projectId) return setError("Pick a project.");
    if (!amount || amount <= 0) return setError("Enter a valid amount.");
    if (!category) return setError("Pick a category.");
    if (!date) return setError("Pick a date.");

    setSaving(true);
    const payload = { projectId, type: type === "Income" ? "income" : "expense", amount, category, date, notes: notes || null };
    const res = await fetch(editing ? `/api/transactions/${tx!.id}` : "/api/transactions", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!res.ok) return setError("Could not save. Try again.");
    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!tx) return;
    setDeleting(true);
    const res = await fetch(`/api/transactions/${tx.id}`, { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) return setError("Could not delete. Try again.");
    router.refresh();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit transaction" : "Log transaction"}
      subtitle={project ? project.name : "Pick a project below"}
      footer={
        <>
          {editing && (
            <Button variant="ghost" type="button" onClick={handleDelete} disabled={deleting} style={{ color: "var(--expense)" }}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          )}
          <span style={{ flex: 1 }} />
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="tx-form" disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Save"}
          </Button>
        </>
      }
    >
      <form id="tx-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
        <SegmentedControl options={["Expense", "Income"]} value={type} onChange={(v) => setType(v as "Expense" | "Income")} />

        <Field label="Amount (₹)" htmlFor="tx-amount">
          <input
            id="tx-amount"
            name="amount"
            className="swag-input swag-tabular"
            inputMode="decimal"
            type="number"
            min="1"
            step="1"
            defaultValue={tx ? String(tx.amount) : ""}
            placeholder="48000"
            style={{ font: "var(--type-figure-sm)", letterSpacing: "var(--ls-display)" }}
          />
        </Field>

        {!project && (
          <Field label="Project" htmlFor="tx-project">
            <select id="tx-project" name="projectId" className="swag-input swag-select" defaultValue={tx?.projectId ?? ""} required>
              <option value="" disabled>
                Choose a project
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Category" htmlFor="tx-category">
          <select id="tx-category" name="category" className="swag-input swag-select" defaultValue={tx?.category ?? ""} key={type} required>
            <option value="" disabled>
              Choose a category
            </option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Date" htmlFor="tx-date">
          <input id="tx-date" name="date" type="date" className="swag-input" defaultValue={tx?.date ?? today()} required />
        </Field>

        <Field label="Notes (optional)" htmlFor="tx-notes">
          <textarea
            id="tx-notes"
            name="notes"
            className="swag-input swag-input--textarea"
            defaultValue={tx?.notes ?? ""}
            placeholder="300 sq ft, charcoal border"
          />
        </Field>

        {error && <span style={{ font: "var(--type-body-sm)", color: "var(--expense)" }}>{error}</span>}

        <span style={{ font: "var(--type-body-sm)", color: "var(--text-muted)" }}>
          Saved against {project ? project.name : "the selected project"} and added to this month's trend.
        </span>
      </form>
    </Modal>
  );
}
