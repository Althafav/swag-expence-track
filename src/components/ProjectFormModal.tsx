"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Field from "./ui/Field";
import Badge from "./ui/Badge";
import { STATUS_OPTIONS } from "@/lib/status";
import type { Project } from "@/lib/db";

export interface ProjectFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Present when editing an existing project. */
  project?: Project;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function ProjectFormModal({ open, onClose, project }: ProjectFormModalProps) {
  const router = useRouter();
  const editing = Boolean(project);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Delete is two-step: the first tap only swaps the footer to a confirm row.
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<string>(project?.status ?? "ongoing");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "").trim();
    const location = String(form.get("location") || "").trim();
    const client = String(form.get("client") || "").trim();
    const startDate = String(form.get("startDate") || "");
    // Only kept while the job is marked completed — moving it back to
    // ongoing/on hold clears the date rather than leaving a stale one.
    const completedDate = status === "completed" ? String(form.get("completedDate") || "") : "";
    const notes = String(form.get("notes") || "").trim();

    if (!name) return setError("Project name is required.");
    if (!location) return setError("Location is required.");
    if (startDate && completedDate && completedDate < startDate) return setError("Completed date can't be before the start date.");

    setSaving(true);
    const payload = { name, location, client: client || null, status, startDate: startDate || null, completedDate: completedDate || null, notes: notes || null };
    // try/finally: a dropped connection rejects fetch outright, and without it
    // the button would stay stuck on "Saving…" with no error shown.
    try {
      const res = await fetch(editing ? `/api/projects/${project!.id}` : "/api/projects", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return setError("Could not save. Try again.");
    } catch {
      return setError("No connection — not saved. Try again.");
    } finally {
      setSaving(false);
    }
    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!project) return;
    setError("");
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) return setError("Could not delete. Try again.");
    } catch {
      return setError("No connection — not deleted. Try again.");
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
    router.refresh();
    onClose();
    router.push("/projects");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit project" : "New project"}
      subtitle={editing ? project!.name : "Projects group every transaction"}
      footer={
        confirmingDelete ? (
          <>
            <span style={{ flex: 1, font: "var(--type-body-sm)", color: "var(--text-strong)" }}>
              Move this project and its transactions to the Recycle bin?
            </span>
            <Button variant="ghost" type="button" onClick={() => setConfirmingDelete(false)} disabled={deleting}>
              Keep
            </Button>
            <Button variant="danger" type="button" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete project"}
            </Button>
          </>
        ) : (
          <>
            {editing && (
              <Button variant="ghost" type="button" onClick={() => setConfirmingDelete(true)} style={{ color: "var(--expense)" }}>
                Delete
              </Button>
            )}
            <span style={{ flex: 1 }} />
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="project-form" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create project"}
            </Button>
          </>
        )
      }
    >
      <form id="project-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
        <Field label="Project name" htmlFor="project-name">
          <input id="project-name" name="name" className="swag-input" defaultValue={project?.name ?? ""} placeholder="Project Name" required />
        </Field>
        <Field label="Location" htmlFor="project-location">
          <input id="project-location" name="location" className="swag-input" defaultValue={project?.location ?? ""} placeholder="Location" required />
        </Field>
        <Field label="Client (optional)" htmlFor="project-client">
          <input id="project-client" name="client" className="swag-input" defaultValue={project?.client ?? ""} placeholder="Client Name" />
        </Field>
        <Field label="Status" htmlFor="project-status">
          <select id="project-status" name="status" className="swag-input swag-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Start date" htmlFor="project-start">
          <input id="project-start" name="startDate" type="date" className="swag-input" defaultValue={project?.startDate ?? ""} />
        </Field>
        {status === "completed" && (
          <Field label="Completed date" htmlFor="project-completed">
            <input
              id="project-completed"
              name="completedDate"
              type="date"
              className="swag-input"
              defaultValue={project?.completedDate ?? today()}
            />
          </Field>
        )}
        <Field label="Notes (optional)" htmlFor="project-notes">
          <textarea
            id="project-notes"
            name="notes"
            className="swag-input swag-input--textarea"
            defaultValue={project?.notes ?? ""}
            placeholder="Scope, materials, site access"
          />
        </Field>

        {error && <span style={{ font: "var(--type-body-sm)", color: "var(--expense)" }}>{error}</span>}

        {editing && (
          <span style={{ display: "flex", alignItems: "center", gap: 8, font: "var(--type-body-sm)", color: "var(--text-muted)" }}>
            <Badge tone="warning">Careful</Badge> Deleting moves the project and its transactions to the Recycle bin. You can restore them for 30 days.
          </span>
        )}
      </form>
    </Modal>
  );
}
