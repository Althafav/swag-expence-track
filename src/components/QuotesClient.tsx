"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FileText, Library } from "lucide-react";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Badge from "./ui/Badge";
import EmptyState from "./ui/EmptyState";
import Money from "./ui/Money";
import SegmentedControl from "./ui/SegmentedControl";
import { formatDate, plural } from "@/lib/format";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_OPTIONS, QUOTE_STATUS_TONE, computeQuoteTotals } from "@/lib/quote";
import type { Quote } from "@/lib/db";

const FILTERS = [{ value: "all", label: "All" }, ...QUOTE_STATUS_OPTIONS];

export default function QuotesClient({ quotes }: { quotes: Quote[] }) {
  const [filter, setFilter] = useState("all");

  const rows = quotes.map((q) => ({ quote: q, total: computeQuoteTotals(q.items, q).total }));
  const shown = rows.filter((r) => filter === "all" || r.quote.status === filter);
  const open = rows.filter((r) => r.quote.status === "sent");
  const openValue = open.reduce((s, r) => s + r.total, 0);

  const newButton = (
    <Button variant="primary" iconLeft="plus" href="/quotes/new">
      New quote
    </Button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-4)", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 240px", minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          <h2>Quotes</h2>
          <span style={{ font: "var(--type-body-sm)", color: "var(--text-muted)", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "baseline" }}>
            {open.length > 0 ? (
              <>
                {plural(open.length, "quote", "quotes")} waiting on the client, worth <Money value={openValue} size="sm" />
              </>
            ) : (
              "Price a job, print it as a PDF, and turn it into a project once the client says yes."
            )}
          </span>
        </div>
        <Button variant="ghost" iconLeft={<Library size={16} />} href="/quotes/catalogue">
          Item catalogue
        </Button>
        {newButton}
      </div>

      <Card padding={0}>
        {quotes.length > 0 && (
          <div style={{ padding: "var(--sp-5) var(--sp-5) var(--sp-3)", overflowX: "auto" }}>
            <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />
          </div>
        )}
        <div style={{ padding: "0 var(--sp-5) var(--sp-3)" }}>
          {shown.length === 0 ? (
            <EmptyState
              icon={<FileText size={24} />}
              title={quotes.length === 0 ? "No quotes yet" : `No ${QUOTE_STATUS_LABEL[filter as Quote["status"]]?.toLowerCase() ?? ""} quotes`}
              body={quotes.length === 0 ? "Create your first quote — add the client, the work and the rates." : "Pick another status to see more."}
              action={quotes.length === 0 ? newButton : undefined}
            />
          ) : (
            shown.map(({ quote, total }) => (
              <Link key={quote.id} href={`/quotes/${quote.id}`} className="swag-trow" style={{ textDecoration: "none", color: "inherit" }}>
                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ font: "var(--type-label)", color: "var(--text-strong)", overflowWrap: "anywhere" }}>{quote.clientName}</span>
                  <span style={{ font: "var(--type-body-sm)", color: "var(--text-muted)", overflowWrap: "anywhere" }}>
                    <span style={{ font: "var(--type-mono)" }}>{quote.number}</span>
                    {quote.site ? `, ${quote.site}` : ""} — {formatDate(quote.date)}
                  </span>
                </span>
                <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flex: "none" }}>
                  <Money value={total} size="sm" />
                  <Badge tone={QUOTE_STATUS_TONE[quote.status]}>{QUOTE_STATUS_LABEL[quote.status]}</Badge>
                </span>
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
