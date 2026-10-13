import QuoteEditor from "@/components/QuoteEditor";
import { nextQuoteNumber } from "@/lib/queries";

// See src/app/(app)/page.tsx for why this can't be statically cached.
export const dynamic = "force-dynamic";

export default async function NewQuotePage() {
  return <QuoteEditor suggestedNumber={await nextQuoteNumber()} />;
}
