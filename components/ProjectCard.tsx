"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ProjectMeta } from "@/lib/types";

interface ProjectCardProps {
  project: ProjectMeta;
  showOpenCaseStudy?: boolean;
}

export function ProjectCard({ project, showOpenCaseStudy = true }: ProjectCardProps) {
  const [bannerFailed, setBannerFailed] = useState(false);
  const showBanner = Boolean(project.bannerImage) && !bannerFailed;
  const bannerPosition =
    project.bannerPosition === "top" ? "center top" : project.bannerPosition === "bottom" ? "center bottom" : "center";

  return (
    <article className="card-base flex h-full flex-col justify-between gap-4">
      <div>
        {showBanner ? (
          <div className="-mx-4 -mt-4">
            <div className="relative h-24 overflow-hidden rounded-t-[0.95rem] border-b border-border sm:h-28 md:h-32 lg:h-36">
              <Image
                src={project.bannerImage!}
                alt={project.bannerAlt || `${project.name} banner`}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
                style={{ objectPosition: bannerPosition }}
                onError={() => setBannerFailed(true)}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(4, 8, 16, 0.12) 0%, rgba(4, 8, 16, 0.32) 62%, rgba(6, 11, 19, 0.84) 100%)"
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-8"
                style={{ background: "linear-gradient(180deg, transparent 0%, rgba(6, 11, 19, 0.75) 100%)" }}
              />
            </div>
          </div>
        ) : null}

        <div className={showBanner ? "mt-4" : undefined}>
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
