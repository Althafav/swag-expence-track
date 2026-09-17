import ProjectsListClient from "@/components/ProjectsListClient";
import { listProjects } from "@/lib/queries";

// See src/app/(app)/page.tsx for why this can't be statically cached.
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await listProjects();
  return <ProjectsListClient projects={projects} />;
}
