import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PrintToolbar from "@/components/PrintToolbar";
import QuoteDocument from "@/components/QuoteDocument";
import QuoteSheetFit from "@/components/QuoteSheetFit";
import { getQuote } from "@/lib/queries";

// Outside the (app) group on purpose: no AppShell header/nav to print. Still
// behind the passcode — src/proxy.ts gates every route except /login.
// See src/app/(app)/page.tsx for why this can't be statically cached.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

// The title becomes the suggested file name in "Save as PDF".
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const quote = await getQuote((await params).id);
  return { title: quote ? `${quote.number} – ${quote.clientName}` : "Quote not found" };
}

export default async function PrintQuotePage({ params }: Props) {
  const { id } = await params;
  const quote = await getQuote(id);
  if (!quote) notFound();

  return (
    <div className="qdoc-page">
      <PrintToolbar backHref={`/quotes/${quote.id}`} />
      <QuoteSheetFit>
        <QuoteDocument quote={quote} />
      </QuoteSheetFit>
    </div>
  );
}
