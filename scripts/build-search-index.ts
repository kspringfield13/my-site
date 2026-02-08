#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

interface SearchDoc {
  id: string;
  type: "Project" | "Writing" | "Section" | "Now";
  title: string;
  url: string;
  tags: string[];
  body: string;
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function loadWritingDocs(base: string): Promise<SearchDoc[]> {
  const writingDir = path.join(base, "content", "writing");
  let files: string[] = [];
  try {
    files = await fs.readdir(writingDir);
  } catch {
    return [];
  }

  const docs: SearchDoc[] = [];
  for (const file of files) {
    if (!file.endsWith(".mdx")) continue;
    const source = await fs.readFile(path.join(writingDir, file), "utf8");
    const parsed = matter(source);
    const slug = (parsed.data.slug as string) || file.replace(/\.mdx$/, "");
    docs.push({
      id: `writing:${slug}`,
      type: "Writing",
      title: (parsed.data.title as string) || slug,
      url: `/writing/${slug}`,
      tags: Array.isArray(parsed.data.tags) ? (parsed.data.tags as string[]) : [],
      body: parsed.content.slice(0, 800)
    });
  }
  return docs;
}

async function main() {
  const base = process.cwd();
  const projectsJson = await readJson<{ projects: any[] }>(path.join(base, "content", "projects", "projects.json"), {
    projects: []
  });
  const nowJson = await readJson<{ entries: any[] }>(path.join(base, "content", "now", "entries.json"), { entries: [] });

  const docs: SearchDoc[] = await Promise.all(
    projectsJson.projects.map(async (project) => {
      let mdxContent = "";
      const mdxPath = path.join(base, "content", "projects", `${project.slug}.mdx`);
      try {
        const source = await fs.readFile(mdxPath, "utf8");
        const parsed = matter(source);
        mdxContent = parsed.content.slice(0, 1200);
      } catch {
        mdxContent = "";
      }

      return {
        id: `project:${project.slug}`,
        type: "Project",
        title: project.name,
        url: `/projects/${project.slug}`,
        tags: [...(project.tags ?? []), ...(project.stack ?? []).slice(0, 4)],
        body: [project.tagline, project.description, ...(project.readmeHighlights ?? []), mdxContent].join(" ").trim()
      } as SearchDoc;
    })
  );

  docs.push(
    {
      id: "section:hero",
      type: "Section",
      title: "Hero",
      url: "/#hero",
      tags: ["positioning", "proof"],
      body: "Kyle builds data pipelines, analytics systems, and AI-powered apps."
    },
    {
      id: "section:proof",
      type: "Section",
      title: "Proof",
      url: "/#proof",
      tags: ["timeline", "skills", "metrics"],
      body: "Impact timeline, skills graph, and systems counters."
    },
    {
      id: "section:projects",
      type: "Section",
      title: "Projects",
      url: "/#projects",
      tags: ["portfolio", "flagship", "case studies"],
      body: "Curated flagship projects with repository artifacts and case studies."
    },
    {
      id: "section:now",
      type: "Section",
      title: "Now",
      url: "/#now",
      tags: ["experiments", "iterations"],
      body: "Current experiments with outcomes and next steps."
    }
  );

  docs.push(
    ...nowJson.entries.map((entry) => ({
      id: `now:${entry.id}`,
      type: "Now" as const,
      title: entry.title,
      url: "/#now",
      tags: [entry.category],
      body: `${entry.tried} ${entry.outcome} ${entry.nextStep}`
    }))
  );

  const writingDocs = await loadWritingDocs(base);
  docs.push(...writingDocs);

  const outputPath = path.join(base, "public", "search-index.json");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(docs, null, 2)}\n`, "utf8");

  console.log(`Wrote ${docs.length} docs to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
