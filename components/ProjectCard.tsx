import Link from "next/link";
import type { ProjectMeta } from "@/lib/types";

interface ProjectCardProps {
  project: ProjectMeta;
  showOpenCaseStudy?: boolean;
}

export function ProjectCard({ project, showOpenCaseStudy = true }: ProjectCardProps) {
  return (
    <article className="card-base flex h-full flex-col justify-between gap-4">
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-2xl font-display font-semibold leading-tight">{project.name}</h3>
          {project.pinned ? <span className="tag-chip tag-chip-flagship">Flagship</span> : null}
        </div>
        <p className="mt-2 text-sm text-muted">{project.tagline || project.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span key={tag} className="tag-chip">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
          {project.stack.slice(0, 6).map((stack) => (
            <span key={stack} className="rounded border border-border bg-surface-3 px-2 py-1 text-faint">
              {stack}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {showOpenCaseStudy ? (
          <Link href={`/projects/${project.slug}`} className="btn-primary">
            Open case study
          </Link>
        ) : null}
        <Link href={project.repoUrl} className="btn-secondary" target="_blank" rel="noreferrer">
          Repository
        </Link>
        {project.demoUrl ? (
          <Link href={project.demoUrl} className="btn-secondary" target="_blank" rel="noreferrer">
            Demo
          </Link>
        ) : null}
        {project.artifacts.diagrams[0] ? (
          <Link href={project.artifacts.diagrams[0]} className="btn-secondary" target="_blank" rel="noreferrer">
            Diagram
          </Link>
        ) : null}
        {project.artifacts.screenshots[0] ? (
          <Link href={project.artifacts.screenshots[0]} className="btn-secondary" target="_blank" rel="noreferrer">
            Screenshot
          </Link>
        ) : null}
      </div>
    </article>
  );
}
