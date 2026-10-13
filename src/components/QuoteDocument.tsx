import React from "react";
import Image from "next/image";
import { formatINR } from "./ui/Money";
import { BUSINESS } from "@/lib/business";
import { formatDate } from "@/lib/format";
import { computeQuoteTotals, lineAmount, quoteNeedsDecimals } from "@/lib/quote";
import type { Quote } from "@/lib/db";

/** The template always shows at least this many ruled item rows. */
const MIN_ROWS = 10;

function formatQty(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

/**
 * The client-facing quotation — a faithful copy of
 * SWAG-Landscapes-Quotation-Template.pdf (A4, 50pt side margins), measured in
 * points so screen and print match it: logo + right-aligned QUOTATION, ruled
 * To/Site/Phone and Quote no./Date/Valid until fields, ten ruled item rows,
 * the Total line, and the two signature lines pinned to the foot of the page.
 * Styled by the `.qdoc` block in globals.css.
 */
export default function QuoteDocument({ quote }: { quote: Quote }) {
  const totals = computeQuoteTotals(quote.items, quote);
  const decimals = quoteNeedsDecimals(quote.items, totals);
  const money = (n: number) => formatINR(n, { decimals });
  const blankRows = Math.max(0, MIN_ROWS - quote.items.length);

  return (
    <article className="qdoc" aria-label={`Quotation ${quote.number}`}>
      <header className="qdoc__head">
        <Image src="/swag-logo-cutout.png" alt={BUSINESS.name} width={880} height={332} className="qdoc__logo" priority />
        <div className="qdoc__heading">
          <h1 className="qdoc__title">Quotation</h1>
          <p className="qdoc__contact">
            {BUSINESS.address}
            <span aria-hidden="true">·</span>
            {BUSINESS.phone}
          </p>
        </div>
      </header>

      <section className="qdoc__fields">
        <Fieldline label="To" value={quote.clientName} />
        <Fieldline label="Quote no." value={quote.number} wide />
        <Fieldline label="Site" value={quote.site} />
        <Fieldline label="Date" value={formatDate(quote.date)} wide />
        <Fieldline label="Phone" value={quote.clientPhone} />
        <Fieldline label="Valid until" value={quote.validUntil ? formatDate(quote.validUntil) : null} wide />
      </section>

      <table className="qdoc__table">
        <colgroup>
          <col />
          <col className="qdoc__col-qty" />
          <col className="qdoc__col-unit" />
          <col className="qdoc__col-rate" />
          <col className="qdoc__col-amount" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col" className="qdoc__num">Qty</th>
            <th scope="col" className="qdoc__unit">Unit</th>
            <th scope="col" className="qdoc__num">Rate (₹)</th>
            <th scope="col" className="qdoc__num">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {quote.items.map((item, i) => (
            <tr key={i}>
              <td className="qdoc__desc">{item.description}</td>
              <td className="qdoc__num">{formatQty(item.qty)}</td>
              <td className="qdoc__unit">{item.unit}</td>
              <td className="qdoc__num">{money(item.rate)}</td>
              <td className="qdoc__num">{money(lineAmount(item))}</td>
            </tr>
          ))}
          {Array.from({ length: blankRows }, (_, i) => (
            <tr key={`blank-${i}`} aria-hidden="true">
              <td colSpan={5} />
            </tr>
          ))}
        </tbody>
      </table>

      <div className="qdoc__totals">
        {totals.discount > 0 && (
          <>
            <div className="qdoc__sum">
              <span>Subtotal</span>
              <span>{money(totals.subtotal)}</span>
            </div>
            <div className="qdoc__sum">
              <span>{quote.discountType === "percent" ? `Discount (${formatQty(quote.discountValue)}%)` : "Discount"}</span>
              <span>−{money(totals.discount)}</span>
            </div>
          </>
        )}
        <div className="qdoc__total">
          <span>Total</span>
          <span>{money(totals.total)}</span>
        </div>
      </div>

      {(quote.notes || quote.terms) && (
        <section className="qdoc__notes">
          {quote.notes && (
            <div>
              <h2>Notes</h2>
              <p>{quote.notes}</p>
            </div>
          )}
          {quote.terms && (
            <div>
              <h2>Terms</h2>
              <p>{quote.terms}</p>
            </div>
          )}
        </section>
      )}

      <footer className="qdoc__foot">
        <div className="qdoc__sign">{BUSINESS.name}</div>
        <div className="qdoc__sign">Client acceptance</div>
        <p className="qdoc__thanks">Thank you</p>
      </footer>
    </article>
  );
}

function Fieldline({ label, value, wide = false }: { label: string; value: string | null; wide?: boolean }) {
  return (
    <div className={"qdoc__field" + (wide ? " qdoc__field--wide" : "")}>
      <span className="qdoc__label">{label}</span>
      <span className="qdoc__value">{value ?? ""}</span>
    </div>
  );
}
