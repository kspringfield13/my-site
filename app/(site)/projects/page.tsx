import Link from "next/link";
import { getProjectIndex } from "@/lib/content";
import { ProjectsGrid } from "@/components/ProjectsGrid";

export const metadata = {
  title: "Projects",
  description: "Flagship analytics, data engineering, and AI systems by Kyle Springfield."
};

export default async function ProjectsPage() {
  const index = await getProjectIndex();
  const projects = index.projects;

  return (
    <section className="section-wrap py-16">
      <h1 className="display">Projects</h1>
      <p className="lede mt-4 max-w-2xl">
        Case studies focused on measurable outcomes: pipelines, analytics products, and AI-enabled workflows.
      </p>
      <div className="mt-10">
        <ProjectsGrid projects={projects} />
      </div>
      <div className="mt-10 text-sm text-muted">
        Looking for highlights first? Flagship case studies are marked on each card.
      </div>
      <Link href="/" className="btn-secondary mt-8 inline-flex">
        Back home
      </Link>
    </section>
  );
}
