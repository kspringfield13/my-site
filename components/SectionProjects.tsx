import Link from "next/link";
import { getFlagshipProjects } from "@/lib/content";
import { ProjectsGrid } from "@/components/ProjectsGrid";

export async function SectionProjects() {
  const projects = await getFlagshipProjects(6);

  return (
    <section id="projects" className="section-wrap py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Projects</p>
          <h2 className="subhead mt-2">Flagship systems and applied experiments.</h2>
        </div>
        <Link href="/projects" className="btn-secondary">
          View all
        </Link>
      </div>

      <div className="mt-8">
        <ProjectsGrid projects={projects} />
      </div>
    </section>
  );
}
