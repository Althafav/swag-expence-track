"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookmarkCheck, BookmarkPlus, FileText, FolderOpen, Library, X } from "lucide-react";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Field from "./ui/Field";
import Badge from "./ui/Badge";
import Money from "./ui/Money";
import SegmentedControl from "./ui/SegmentedControl";
import CataloguePicker from "./CataloguePicker";
import { formatDate } from "@/lib/format";
import {
  DEFAULT_TERMS,
  QUOTE_STATUS_LABEL,
  QUOTE_STATUS_OPTIONS,
  QUOTE_STATUS_TONE,
  computeQuoteTotals,
  defaultValidUntil,
  lineAmount,
  quoteNeedsDecimals,
} from "@/lib/quote";
import type { CatalogueItem, Quote, QuoteStatus } from "@/lib/db";

/** A line as typed — strings, so a half-typed "12." survives re-renders. */
interface Line {
  key: number;
  description: string;
  qty: string;
  unit: string;
  rate: string;
}

const DISCOUNT_OPTIONS = [
  { value: "none", label: "None" },
  { value: "flat", label: "₹ off" },
  { value: "percent", label: "% off" },
];

const ids = { client: "q-client", phone: "q-phone", site: "q-site", date: "q-date", valid: "q-valid", status: "q-status" };

const today = () => new Date().toISOString().slice(0, 10);

let nextKey = 1;
function line(partial: Partial<Omit<Line, "key">> = {}): Line {
  return { key: nextKey++, description: "", qty: "1", unit: "", rate: "", ...partial };
}

function toNumber(s: string): number {
  const n = Number(s);
  return s.trim() === "" || !Number.isFinite(n) ? 0 : n;
}

export interface QuoteEditorProps {
  /** Present when editing; absent for a new quote. */
  quote?: Quote;
  /** Number the new quote will most likely get (the server assigns the real one on save). */
  suggestedNumber?: string;
  /** Name of the linked project, when the quote has one. */
  projectName?: string | null;
}

export default function QuoteEditor({ quote, suggestedNumber, projectName }: QuoteEditorProps) {
  const router = useRouter();
  const editing = Boolean(quote);

  const [clientName, setClientName] = useState(quote?.clientName ?? "");
  const [clientPhone, setClientPhone] = useState(quote?.clientPhone ?? "");
  const [site, setSite] = useState(quote?.site ?? "");
  const [date, setDate] = useState(quote?.date ?? today());
  const [validUntil, setValidUntil] = useState(quote?.validUntil ?? defaultValidUntil(today()));
  const [status, setStatus] = useState<QuoteStatus>(quote?.status ?? "draft");
  const [lines, setLines] = useState<Line[]>(() =>
    quote?.items.length
      ? quote.items.map((i) => line({ description: i.description, qty: String(i.qty), unit: i.unit, rate: String(i.rate) }))
      : [line()]
  );
  const [discountType, setDiscountType] = useState<string>(quote?.discountType ?? "none");
  const [discountValue, setDiscountValue] = useState(quote?.discountValue ? String(quote.discountValue) : "");
  const [notes, setNotes] = useState(quote?.notes ?? "");
  const [terms, setTerms] = useState(quote?.terms ?? DEFAULT_TERMS);

  const [busy, setBusy] = useState<null | "save" | "convert" | "delete">(null);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [savedToCatalogue, setSavedToCatalogue] = useState<Set<number>>(new Set());
  const descRefs = useRef(new Map<number, HTMLInputElement>());

  const discount = {
    discountType: discountType === "none" ? null : (discountType as "flat" | "percent"),
    discountValue: toNumber(discountValue),
  };
  const numericItems = lines.map((l) => ({ qty: toNumber(l.qty), rate: toNumber(l.rate) }));
  const totals = computeQuoteTotals(numericItems, discount);
  const decimals = quoteNeedsDecimals(numericItems, totals);

  // Every edit goes through `edit`, so "unsaved changes" is always accurate.
  function edit<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setDirty(true);
    };
  }

  function updateLine(key: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
    setSavedToCatalogue((s) => (s.has(key) ? new Set([...s].filter((k) => k !== key)) : s));
    setDirty(true);
  }

  function addLine(partial?: Partial<Omit<Line, "key">>) {
    const l = line(partial);
    setLines((ls) => {
      // Replace the single untouched starter line instead of stacking under it.
      const starter = ls.length === 1 && !ls[0].description && !ls[0].rate;
      return starter && partial ? [l] : [...ls, l];
    });
    setDirty(true);
    if (!partial) requestAnimationFrame(() => descRefs.current.get(l.key)?.focus());
  }

  function removeLine(key: number) {
    setLines((ls) => (ls.length === 1 ? [line()] : ls.filter((l) => l.key !== key)));
    setDirty(true);
  }

  function pickFromCatalogue(item: CatalogueItem) {
    addLine({ description: item.name, unit: item.unit, rate: String(item.rate), qty: "1" });
  }

  async function saveLineToCatalogue(l: Line) {
    setError("");
    if (!l.description.trim()) return setError("Give the item a description before saving it to the catalogue.");
    try {
      const res = await fetch("/api/catalogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: l.description, unit: l.unit, rate: toNumber(l.rate) }),
      });
      if (!res.ok) return setError("Could not save to the catalogue. Try again.");
      setSavedToCatalogue((s) => new Set(s).add(l.key));
    } catch {
      setError("No connection — not saved to the catalogue.");
    }
  }

  function payload() {
    return {
      clientName,
      clientPhone,
      site,
      date,
      validUntil: validUntil || null,
      status,
      items: lines
        .filter((l) => l.description.trim() || l.rate.trim())
        .map((l) => ({ description: l.description, qty: toNumber(l.qty), unit: l.unit, rate: toNumber(l.rate) })),
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      notes,
      terms,
    };
  }

  /** Saves and returns the quote's id, or null (with the error shown) on failure. */
  async function save(): Promise<string | null> {
    setError("");
    const body = payload();
    if (!body.clientName.trim()) return fail("Add the client’s name.");
    if (body.items.length === 0) return fail("Add at least one item.");
    if (validUntil && validUntil < date) return fail("“Valid until” can’t be before the quote date.");

    setBusy("save");
    try {
      const res = await fetch(editing ? `/api/quotes/${quote!.id}` : "/api/quotes", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return fail(data?.error ? `Not saved: ${data.error}.` : "Could not save. Try again.");
      setDirty(false);
      return (data as Quote).id;
    } catch {
      return fail("No connection — not saved. Try again.");
    } finally {
      setBusy(null);
    }
  }

  function fail(message: string): null {
    setError(message);
    return null;
  }

  async function handleSave() {
    const id = await save();
    if (!id) return;
    if (editing) router.refresh();
    else router.replace(`/quotes/${id}`);
  }


  async function handleConvert() {
    if (!quote) return;
    if (dirty && !(await save())) return;
    setError("");
    setBusy("convert");
    try {
      const res = await fetch(`/api/quotes/${quote.id}/convert`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) return setError(data?.error ? `${data.error}.` : "Could not create the project. Try again.");
      router.push(`/projects/${data.projectId}`);
    } catch {
      setError("No connection — project not created. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!quote) return;
    setError("");
    setBusy("delete");
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, { method: "DELETE" });
      if (!res.ok) return setError("Could not delete. Try again.");
      router.push("/quotes");
      router.refresh();
    } catch {
      setError("No connection — not deleted. Try again.");
    } finally {
      setBusy(null);
      setConfirmingDelete(false);
    }
  }

  const number = quote?.number ?? suggestedNumber;
  const linkedProject = quote?.projectId && projectName ? { id: quote.projectId, name: projectName } : null;

  return (
    <div className="qed">
      <div className="qed__top">
        <Button variant="ghost" size="sm" iconLeft="arrow-left" href="/quotes" style={{ marginLeft: "calc(-1 * var(--sp-4))" }}>
          Quotes
        </Button>
        <div className="qed__heading">
          <h2>{editing ? clientName || "Quote" : "New quote"}</h2>
          {editing && <Badge tone={QUOTE_STATUS_TONE[quote!.status]}>{QUOTE_STATUS_LABEL[quote!.status]}</Badge>}
        </div>
        {number && (
          <span className="qed__number">
            {editing ? number : `Will be saved as ${number}`}
            {editing && ` · created ${formatDate(quote!.createdAt.slice(0, 10))}`}
          </span>
        )}
      </div>

      <div className="swag-split">
        <Card>
          <div className="qed__section">
            <span className="qed__section-title">Client</span>
            <Field label="Name" htmlFor={ids.client}>
              <input id={ids.client} className="swag-input" value={clientName} onChange={(e) => edit(setClientName)(e.target.value)} placeholder="Who the quote is for" autoComplete="off" />
            </Field>
            <Field label="Phone (optional)" htmlFor={ids.phone}>
              <input id={ids.phone} className="swag-input" type="tel" inputMode="tel" value={clientPhone} onChange={(e) => edit(setClientPhone)(e.target.value)} placeholder="+91" />
            </Field>
            <Field label="Site (optional)" htmlFor={ids.site}>
              <input id={ids.site} className="swag-input" value={site} onChange={(e) => edit(setSite)(e.target.value)} placeholder="Where the work happens" />
            </Field>
          </div>
        </Card>
        <Card>
          <div className="qed__section">
            <span className="qed__section-title">Quote details</span>
            <Field label="Date" htmlFor={ids.date}>
              <input
                id={ids.date}
                type="date"
                className="swag-input"
                value={date}
                onChange={(e) => {
                  const d = e.target.value;
                  // Keep validity in step with the date until it's been set by hand.
                  if (d && validUntil === defaultValidUntil(date)) setValidUntil(defaultValidUntil(d));
                  edit(setDate)(d);
                }}
              />
            </Field>
            <Field label="Valid until" htmlFor={ids.valid}>
              <input id={ids.valid} type="date" className="swag-input" value={validUntil} min={date} onChange={(e) => edit(setValidUntil)(e.target.value)} />
            </Field>
            <Field label="Status" htmlFor={ids.status}>
              <select id={ids.status} className="swag-input swag-select" value={status} onChange={(e) => edit(setStatus)(e.target.value as QuoteStatus)}>
                {QUOTE_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>
      </div>

      <Card padding={0}>
        <div className="qed__items-head">
          <span className="qed__section-title">Items</span>
          <span className="qed__count">{lines.length === 1 ? "1 line" : `${lines.length} lines`}</span>
        </div>
        <div className="qed__cols" aria-hidden="true">
          <span>Item</span>
          <span>Qty</span>
          <span>Unit</span>
          <span>Rate (₹)</span>
          <span className="qed__num">Amount</span>
          <span />
        </div>
        <ol className="qed__lines">
          {lines.map((l, i) => {
            const n = i + 1;
            const saved = savedToCatalogue.has(l.key);
            return (
              <li key={l.key} className="qed-line">
                <input
                  ref={(el) => {
                    if (el) descRefs.current.set(l.key, el);
                    else descRefs.current.delete(l.key);
                  }}
                  className="swag-input qed-line__desc"
                  aria-label={`Item ${n} description`}
                  placeholder="e.g. Lawn turfing — Bermuda grass"
                  value={l.description}
                  onChange={(e) => updateLine(l.key, { description: e.target.value })}
                />
                <label className="qed-line__qty">
                  <span className="qed-line__label">Qty</span>
                  <input className="swag-input" aria-label={`Item ${n} quantity`} inputMode="decimal" value={l.qty} onChange={(e) => updateLine(l.key, { qty: e.target.value })} />
                </label>
                <label className="qed-line__unit">
                  <span className="qed-line__label">Unit</span>
                  <input className="swag-input" aria-label={`Item ${n} unit`} placeholder="sq.ft" value={l.unit} onChange={(e) => updateLine(l.key, { unit: e.target.value })} />
                </label>
                <label className="qed-line__rate">
                  <span className="qed-line__label">Rate (₹)</span>
                  <input className="swag-input" aria-label={`Item ${n} rate in rupees`} inputMode="decimal" placeholder="0" value={l.rate} onChange={(e) => updateLine(l.key, { rate: e.target.value })} />
                </label>
                <span className="qed-line__amount">
                  <span className="qed-line__label">Amount</span>
                  <Money value={lineAmount(numericItems[i])} size="sm" decimals={decimals} />
                </span>
                <span className="qed-line__actions">
                  <button
                    type="button"
                    className="qed-icon"
                    onClick={() => saveLineToCatalogue(l)}
                    disabled={saved}
                    aria-label={saved ? `Item ${n} saved to catalogue` : `Save item ${n} to catalogue`}
                    title={saved ? "Saved to catalogue" : "Save to catalogue"}
                  >
                    {saved ? <BookmarkCheck size={18} /> : <BookmarkPlus size={18} />}
                  </button>
                  <button type="button" className="qed-icon" onClick={() => removeLine(l.key)} aria-label={`Remove item ${n}`} title="Remove item">
                    <X size={18} />
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
        <div className="qed__add">
          <Button variant="outline" iconLeft="plus" onClick={() => addLine()}>
            Add item
          </Button>
          <Button variant="ghost" iconLeft={<Library size={16} />} onClick={() => setPickerOpen(true)}>
            From catalogue
          </Button>
        </div>
      </Card>

      <div className="swag-split">
        <Card>
          <div className="qed__section">
            <span className="qed__section-title">Discount</span>
            <SegmentedControl options={DISCOUNT_OPTIONS} value={discountType} onChange={edit(setDiscountType)} />
            {discountType !== "none" && (
              <Field label={discountType === "percent" ? "Percent off" : "Rupees off"} htmlFor="q-discount">
                <input
                  id="q-discount"
                  className="swag-input"
                  inputMode="decimal"
                  value={discountValue}
                  onChange={(e) => edit(setDiscountValue)(e.target.value)}
                  placeholder={discountType === "percent" ? "e.g. 5" : "e.g. 2000"}
                />
              </Field>
            )}
            <dl className="qed__sums">
              <dt>Subtotal</dt>
              <dd>
                <Money value={totals.subtotal} size="sm" decimals={decimals} />
              </dd>
              {totals.discount > 0 && (
                <>
                  <dt>Discount</dt>
                  <dd>
                    <Money value={-totals.discount} size="sm" decimals={decimals} />
                  </dd>
                </>
              )}
            </dl>
          </div>
        </Card>
        <Card>
          <div className="qed__section">
            <span className="qed__section-title">Notes & terms</span>
            <Field label="Notes (optional)" htmlFor="q-notes">
              <textarea id="q-notes" className="swag-input swag-input--textarea" value={notes} onChange={(e) => edit(setNotes)(e.target.value)} placeholder="Scope, materials, timeline" />
            </Field>
            <Field label="Terms" htmlFor="q-terms">
              <textarea id="q-terms" className="swag-input swag-input--textarea" value={terms} onChange={(e) => edit(setTerms)(e.target.value)} />
            </Field>
          </div>
        </Card>
      </div>

      {editing && (
        <Card>
          <div className="qed__section">
            <span className="qed__section-title">Project</span>
            {linkedProject ? (
              <div className="qed__project">
                <span>
                  Turned into <strong>{linkedProject.name}</strong>.
                </span>
                <Button variant="outline" iconLeft={<FolderOpen size={16} />} href={`/projects/${linkedProject.id}`}>
                  Open project
                </Button>
              </div>
            ) : (
              <div className="qed__project">
                <span>
                  {status === "accepted"
                    ? "Client said yes? Start a project from this quote to track its income and costs."
                    : "Once the client accepts, you can start a project from this quote."}
                </span>
                <Button variant="dark" iconLeft="folder-plus" onClick={handleConvert} disabled={status !== "accepted" || busy !== null}>
                  {busy === "convert" ? "Creating…" : "Create project"}
                </Button>
              </div>
            )}
            <div className="qed__danger">
              {confirmingDelete ? (
                <>
                  <span>Move this quote to the Recycle bin? You can restore it for 30 days.</span>
                  <Button variant="ghost" onClick={() => setConfirmingDelete(false)} disabled={busy !== null}>
                    Keep
                  </Button>
                  <Button variant="danger" onClick={handleDelete} disabled={busy !== null}>
                    {busy === "delete" ? "Deleting…" : "Delete quote"}
                  </Button>
                </>
              ) : (
                <Button variant="ghost" iconLeft="trash" style={{ color: "var(--expense)" }} onClick={() => setConfirmingDelete(true)}>
                  Delete quote
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* One action at a time: save until everything is saved, then get the PDF.
          The PDF always shows the saved quote, so it's only offered once nothing is pending. */}
      <div className="qed-bar" role="region" aria-label="Quote total and actions">
        <div className="qed-bar__total">
          <span>Total</span>
          <Money value={totals.total} size="md" decimals={decimals} style={{ color: "var(--text-on-dark)" }} />
          <span className="qed-bar__status" aria-live="polite">
            {!editing ? "Not saved yet" : dirty ? "Unsaved changes" : "All changes saved"}
          </span>
        </div>
        {error && (
          <span className="qed-bar__error" role="alert">
            {error}
          </span>
        )}
        <div className="qed-bar__actions">
          {editing && !dirty ? (
            <Button variant="primary" iconLeft={<FileText size={16} />} href={`/print/quotes/${quote!.id}`}>
              View PDF
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSave} disabled={busy !== null}>
              {busy === "save" ? "Saving…" : editing ? "Save changes" : "Save quote"}
            </Button>
          )}
        </div>
      </div>

      <CataloguePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={pickFromCatalogue} />
    </div>
  );
}
