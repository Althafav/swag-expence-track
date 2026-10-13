"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Library } from "lucide-react";
import Button from "./ui/Button";
import Card from "./ui/Card";
import EmptyState from "./ui/EmptyState";
import Money from "./ui/Money";
import type { CatalogueItem } from "@/lib/db";

interface Draft {
  name: string;
  unit: string;
  rate: string;
}

const EMPTY: Draft = { name: "", unit: "", rate: "" };

/** Saved quote lines: add, edit in place, delete. */
export default function CatalogueClient({ items }: { items: CatalogueItem[] }) {
  const router = useRouter();
  // "new" for the add row, an item id while editing that item, null otherwise.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function startEdit(item?: CatalogueItem) {
    setError("");
    setEditingId(item ? item.id : "new");
    setDraft(item ? { name: item.name, unit: item.unit, rate: String(item.rate) } : EMPTY);
  }

  async function send(request: () => Promise<Response>, failure: string) {
    setError("");
    setBusy(true);
    try {
      const res = await request();
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ? `${failure} ${body.error}.` : failure);
        return;
      }
      setEditingId(null);
      router.refresh();
    } catch {
      setError("No connection. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return setError("Give the item a name.");
    const rate = draft.rate.trim() === "" ? 0 : Number(draft.rate);
    if (!Number.isFinite(rate) || rate < 0) return setError("Rate must be a number, 0 or more.");
    const body = JSON.stringify({ name: draft.name, unit: draft.unit, rate });
    const isNew = editingId === "new";
    send(
      () =>
        fetch(isNew ? "/api/catalogue" : `/api/catalogue/${editingId}`, {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body,
        }),
      "Not saved."
    );
  }

  function remove(id: string) {
    send(() => fetch(`/api/catalogue/${id}`, { method: "DELETE" }), "Not deleted.");
  }

  const form = (
    <form className="qcat-form" onSubmit={save}>
      <input className="swag-input qcat-form__name" aria-label="Item name" placeholder="Item, e.g. Lawn turfing" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus />
      <input className="swag-input" aria-label="Unit" placeholder="Unit (sq.ft)" value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} />
      <input className="swag-input" aria-label="Rate in rupees" inputMode="decimal" placeholder="Rate (₹)" value={draft.rate} onChange={(e) => setDraft({ ...draft, rate: e.target.value })} />
      <span className="qcat-form__actions">
        <Button variant="ghost" onClick={() => setEditingId(null)} disabled={busy}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </span>
    </form>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)", alignItems: "flex-start" }}>
        <Button variant="ghost" size="sm" iconLeft="arrow-left" href="/quotes" style={{ marginLeft: "calc(-1 * var(--sp-4))" }}>
          Quotes
        </Button>
        <h2>Item catalogue</h2>
        <span style={{ font: "var(--type-body-sm)", color: "var(--text-muted)" }}>
          Lines you quote often, with their usual unit and rate. Add them to any quote from “From catalogue”.
        </span>
      </div>

      {error && <span style={{ font: "var(--type-body-sm)", color: "var(--expense)" }}>{error}</span>}

      <Card padding={0}>
        <div style={{ padding: "var(--sp-2) var(--sp-5)" }}>
          {items.length === 0 && editingId !== "new" && (
            <EmptyState
              icon={<Library size={24} />}
              title="No saved items yet"
              body="Add the work you quote most — turfing, planting, irrigation — so new quotes take seconds."
            />
          )}
          {items.map((item) =>
            editingId === item.id ? (
              <div key={item.id} className="qcat-row">
                {form}
              </div>
            ) : (
              <div key={item.id} className="qcat-row">
                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ font: "var(--type-label)", color: "var(--text-strong)", overflowWrap: "anywhere" }}>{item.name}</span>
                  <span style={{ font: "var(--type-body-sm)", color: "var(--text-muted)" }}>{item.unit ? `per ${item.unit}` : "No unit"}</span>
                </span>
                <Money value={item.rate} size="sm" decimals={!Number.isInteger(item.rate)} />
                <span style={{ display: "flex", gap: "var(--sp-2)" }}>
                  <Button variant="ghost" size="sm" iconLeft="pencil" onClick={() => startEdit(item)} disabled={busy}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" iconLeft="trash" style={{ color: "var(--expense)" }} onClick={() => remove(item.id)} disabled={busy}>
                    Delete
                  </Button>
                </span>
              </div>
            )
          )}
          {editingId === "new" && <div className="qcat-row">{form}</div>}
        </div>
        {editingId !== "new" && (
          <div style={{ padding: "var(--sp-4) var(--sp-5)", borderTop: "1px solid var(--border-hairline)" }}>
            <Button variant="outline" iconLeft="plus" onClick={() => startEdit()}>
              Add item
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
