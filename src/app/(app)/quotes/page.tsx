import QuotesClient from "@/components/QuotesClient";
import { listQuotes } from "@/lib/queries";

// See src/app/(app)/page.tsx for why this can't be statically cached.
export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  return <QuotesClient quotes={await listQuotes()} />;
}
