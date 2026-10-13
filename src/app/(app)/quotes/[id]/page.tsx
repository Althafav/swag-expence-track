import { notFound } from "next/navigation";
import QuoteEditor from "@/components/QuoteEditor";
import { getProject, getQuote } from "@/lib/queries";

// See src/app/(app)/page.tsx for why this can't be statically cached.
export const dynamic = "force-dynamic";

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await getQuote(id);
  if (!quote) notFound();
  // A binned project counts as unlinked, so the quote can start a fresh one.
  const project = quote.projectId ? await getProject(quote.projectId) : undefined;
  return <QuoteEditor key={quote.id} quote={quote} projectName={project?.name ?? null} />;
}
