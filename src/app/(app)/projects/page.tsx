import ProjectsListClient from "@/components/ProjectsListClient";
import { listProjects } from "@/lib/queries";

export default function ProjectsPage() {
  const projects = listProjects();
  return <ProjectsListClient projects={projects} />;
}
