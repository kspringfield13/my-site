import { sanitizeFreeText } from "@/lib/agent-kyle/sanitize";
import type { EvidenceItem } from "@/lib/agent-kyle/types";
import type { ProjectMeta } from "@/lib/types";

function normalize(value: string): string {
  return sanitizeFreeText(value.toLowerCase(), 5000);
}

function compactSnippet(value: string, maxLength = 190): string {
  const snippet = sanitizeFreeText(value, maxLength);
  const visibleLength = Math.max(1, maxLength - 10);
  return snippet.length <= visibleLength ? snippet : `${snippet.slice(0, visibleLength - 3)}...`;
}

export function buildProjectEvidence(projects: ProjectMeta[]): EvidenceItem[] {
  return projects.flatMap((project) => {
    const shared = {
      snippet: compactSnippet(`${project.tagline || project.description} ${(project.readmeHighlights || []).join(" ")}`),
      tags: [...project.tags, ...project.stack.slice(0, 8), ...project.topics].map((tag) => normalize(tag)).filter(Boolean),
      projectSlug: project.slug
    };

    return [
      {
        id: `project:${project.slug}`,
        title: `${project.name} case study`,
        url: `/projects/${project.slug}`,
        sourceType: "project" as const,
        ...shared
      },
      {
        id: `github:${project.slug}`,
        title: `${project.name} on GitHub`,
        url: project.repoUrl,
        sourceType: "github" as const,
        ...shared
      }
    ];
  });
}

export function addProjectSkills(skillUniverse: Set<string>, projects: ProjectMeta[]): void {
  for (const project of projects) {
    for (const stack of project.stack.slice(0, 8)) {
      const normalized = normalize(stack);
      if (normalized) skillUniverse.add(normalized);
    }
  }
}
