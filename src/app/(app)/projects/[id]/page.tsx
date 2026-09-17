import { notFound } from "next/navigation";
import ProjectDetailClient from "@/components/ProjectDetailClient";
import { getProject, listTransactions } from "@/lib/queries";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  const transactions = listTransactions(id);
  return <ProjectDetailClient project={project} transactions={transactions} />;
}
