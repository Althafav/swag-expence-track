"use client";

import React, { useEffect, useState } from "react";
import { Library } from "lucide-react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Money from "./ui/Money";
import EmptyState from "./ui/EmptyState";
import type { CatalogueItem } from "@/lib/db";

export interface CataloguePickerProps {
  open: boolean;
  onClose: () => void;
  onPick: (item: CatalogueItem) => void;
}

/** Search the saved items and drop one into the quote. Stays open so several can be added in a row. */
export default function CataloguePicker({ open, onClose, onPick }: CataloguePickerProps) {
  const [items, setItems] = useState<CatalogueItem[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [added, setAdded] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/catalogue")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: CatalogueItem[]) => !cancelled && setItems(data))
      .catch(() => !cancelled && setError("Could not load the catalogue. Close and try again."));
    return () => {
      cancelled = true;
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const shown = (items ?? []).filter((i) => !q || i.name.toLowerCase().includes(q) || i.unit.toLowerCase().includes(q));

  function close() {
    setQuery("");
    setAdded(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add from catalogue"
      subtitle="Tap an item to add it to the quote"
      footer={
        <>
          <Button variant="ghost" href="/quotes/catalogue">
            Manage catalogue
          </Button>
          <span style={{ flex: 1 }} />
          <Button variant="primary" onClick={close}>
            Done
          </Button>
        </>
      }
    >
      <input
        className="swag-input"
        type="search"
        placeholder="Search items"
        aria-label="Search catalogue"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {error && <span style={{ font: "var(--type-body-sm)", color: "var(--expense)" }}>{error}</span>}
      {items === null && !error && <span style={{ font: "var(--type-body-sm)", color: "var(--text-muted)" }}>Loading…</span>}
      {items !== null && items.length === 0 && (
        <EmptyState
          icon={<Library size={24} />}
          title="No saved items yet"
          body="Use the bookmark button on a quote line to save it here for next time."
        />
      )}
      {items !== null && items.length > 0 && shown.length === 0 && (
        <span style={{ font: "var(--type-body-sm)", color: "var(--text-muted)" }}>Nothing matches “{query}”.</span>
      )}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {shown.map((item) => (
          <button
            key={item.id}
            type="button"
            className="swag-trow"
            onClick={() => {
              onPick(item);
              setAdded(item.id);
            }}
          >
            <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ font: "var(--type-label)", color: "var(--text-strong)", overflowWrap: "anywhere" }}>{item.name}</span>
              <span style={{ font: "var(--type-body-sm)", color: "var(--text-muted)" }}>
                {added === item.id ? "Added to quote" : item.unit ? `per ${item.unit}` : "No unit"}
              </span>
            </span>
            <Money value={item.rate} size="sm" decimals={!Number.isInteger(item.rate)} />
          </button>
        ))}
      </div>
    </Modal>
  );
}
