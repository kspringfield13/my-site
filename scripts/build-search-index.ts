#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { partitionNowEntries } from "../lib/now";
import type { NowFeed } from "../lib/types";

interface SearchDoc {
  id: string;
  type: "Project" | "Section" | "Now";
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

async function main() {
  const base = process.cwd();
  const projectsJson = await readJson<{ projects: any[] }>(path.join(base, "content", "projects", "projects.json"), {
    projects: []
  });
  const nowJson = await readJson<NowFeed>(path.join(base, "content", "now", "entries.json"), {
    expireDays: 45,
    entries: []
  });
  const { currentEntries, archivedEntries } = partitionNowEntries(nowJson);

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
      tags: ["positioning", "proof", "ai-assisted development", "learning"],
      body: "Kyle builds data pipelines, analytics systems, and AI-powered apps. In the playground, he experiments with AI-assisted development to broaden his technical knowledge and learn by building."
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
      id: "section:playground",
      type: "Section",
      title: "Emberwild",
      url: "/#playground",
      tags: ["game development", "three.js", "survival", "crafting", "codex", "claude code"],
      body: "The playground is a space for experimenting with AI-assisted development, broadening technical knowledge, and learning by building. Emberwild is an evolving Three.js browser game where players forage, craft, brave the elements, and build a foothold in the wild. Its gameplay systems and 3D world are being developed with Codex and Claude Code, and the latest work-in-progress build is playable from the site."
    },
    {
      id: "section:skills",
      type: "Section",
      title: "Skills",
      url: "/#skills",
      tags: ["capabilities", "game development", "three.js"],
      body: "Production capabilities across data engineering, analytics, AI engineering, software delivery, and Three.js game development."
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
    ...currentEntries.map((entry) => ({
      id: `now:${entry.id}`,
      type: "Now" as const,
      title: entry.title || entry.category.toUpperCase(),
      url: "/#now",
      tags: [entry.category],
      body: entry.details.join(" ")
    })),
    ...archivedEntries.map((entry) => ({
      id: `now:${entry.id}`,
      type: "Now" as const,
      title: entry.title || entry.category.toUpperCase(),
      url: "/archive/now",
      tags: [entry.category],
      body: entry.details.join(" ")
    }))
  );

  const outputPath = path.join(base, "public", "search-index.json");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(docs, null, 2)}\n`, "utf8");

  console.log(`Wrote ${docs.length} docs to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
