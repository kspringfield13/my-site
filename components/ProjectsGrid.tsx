"use client";

import { useMemo, useState } from "react";
import { ProjectCard } from "@/components/ProjectCard";
import type { ProjectMeta, ProjectTag } from "@/lib/types";

const tags: Array<{ key: "all" | ProjectTag; label: string }> = [
  { key: "all", label: "All" },
  { key: "data", label: "Data" },
  { key: "ai", label: "AI" },
  { key: "fullstack", label: "Full-stack" }
];

export function ProjectsGrid({ projects, showOpenCaseStudy = true }: { projects: ProjectMeta[]; showOpenCaseStudy?: boolean }) {
  const [selected, setSelected] = useState<"all" | ProjectTag>("all");

  const filtered = useMemo(
    () => (selected === "all" ? projects : projects.filter((project) => project.tags.includes(selected))),
    [projects, selected]
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const active = selected === tag.key;
          return (
            <button
              key={tag.key}
              type="button"
              className={`rounded-full border bg-surface-1 px-3 py-1 text-xs uppercase tracking-[0.08em] transition ${
                active ? "border-border-accent bg-surface-3 text-link-hover" : "border-border text-muted hover:text-fg"
              }`}
              onClick={() => setSelected(tag.key)}
            >
              {tag.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {filtered.map((project) => (
          <ProjectCard key={project.slug} project={project} showOpenCaseStudy={showOpenCaseStudy} />
        ))}
      </div>
    </div>
  );
}
