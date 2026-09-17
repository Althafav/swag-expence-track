import { notFound } from "next/navigation";
import ProjectDetailClient from "@/components/ProjectDetailClient";
import { getProject, listTransactions } from "@/lib/queries";

// See src/app/(app)/page.tsx for why this can't be statically cached.
export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const transactions = await listTransactions(id);
  return <ProjectDetailClient project={project} transactions={transactions} />;
}
