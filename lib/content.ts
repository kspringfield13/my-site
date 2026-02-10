import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { getContentPath, loadMdxFile } from "@/lib/mdx";
import type {
  NowFeed,
  ProjectIndex,
  ProjectMeta,
  ProofMetrics,
  ResumeDerived,
  SearchDoc,
  WeeklySummary
} from "@/lib/types";

const fallbackProjectIndex: ProjectIndex = {
  updatedAt: new Date(0).toISOString(),
  projects: []
};

const fallbackResume: ResumeDerived = {
  name: "Kyle Springfield",
  contact: {},
  about: "Data and AI engineer focused on turning noisy datasets into measurable decisions.",
  highlights: [],
  education: [],
  experience: [],
  skills: [],
  certifications: [],
  certificationDetails: [],
  proofBullets: [],
  skillClusters: {
    data: [],
    analytics: [],
    ai: [],
    dev: []
  }
};

const fallbackNowFeed: NowFeed = {
  expireDays: 45,
  entries: []
};

const fallbackMetrics: ProofMetrics = {
  systemsShipped: {
    pipelines: 0,
    dashboards: 0,
    apps: 0
  },
  timelineHighlights: []
};

const fallbackWeeklySummary: WeeklySummary = {
  weekOf: "",
  summary: "",
  bullets: []
};

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

export const getProjectIndex = cache(async () => {
  const filePath = getContentPath("projects", "projects.json");
  const data = await readJson<ProjectIndex>(filePath, fallbackProjectIndex);
  const projects = data.projects
    .slice()
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.stars - a.stars || a.name.localeCompare(b.name));
  return {
    ...data,
    projects
  };
});

export const getNowEntries = cache(async () => {
  return readJson<NowFeed>(getContentPath("now", "entries.json"), fallbackNowFeed);
});

export const getWeeklySummary = cache(async () => {
  return readJson<WeeklySummary>(getContentPath("now", "weekly-summary.json"), fallbackWeeklySummary);
});

export const getProofMetrics = cache(async () => {
  return readJson<ProofMetrics>(getContentPath("config", "proof-metrics.json"), fallbackMetrics);
});

export const getResumeDerived = cache(async () => {
  return readJson<ResumeDerived>(getContentPath("resume", "derived.json"), fallbackResume);
});

export const getProjectBySlug = cache(async (slug: string) => {
  const index = await getProjectIndex();
  const meta = index.projects.find((project) => project.slug === slug);
  if (!meta) {
    return null;
  }

  const filePath = getContentPath("projects", `${slug}.mdx`);
  try {
    const mdx = await loadMdxFile<Record<string, string>>(filePath);
    return {
      meta,
      frontmatter: mdx.frontmatter,
      content: mdx.content
    };
  } catch {
    return {
      meta,
      frontmatter: {
        title: meta.name
      },
      content: null
    };
  }
});

export const getFlagshipProjects = cache(async (limit = 6) => {
  const index = await getProjectIndex();
  const pinned = index.projects.filter((project) => project.pinned);
  const fallback = index.projects;
  const source = pinned.length > 0 ? pinned : fallback;
  return source.slice(0, limit);
});

export function getProjectTag(project: ProjectMeta): "ai" | "data" | "fullstack" {
  if (project.tags.includes("ai")) return "ai";
  if (project.tags.includes("fullstack")) return "fullstack";
  return "data";
}

export function getNowEntryAgeDays(date: string) {
  const ms = Date.now() - Date.parse(date);
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export const getSearchDocs = cache(async (): Promise<SearchDoc[]> => {
  const filePath = path.join(process.cwd(), "public", "search-index.json");
  const fromFile = await readJson<SearchDoc[]>(filePath, []);
  if (fromFile.length > 0) {
    return fromFile;
  }

  const [projects, nowEntries] = await Promise.all([getProjectIndex(), getNowEntries()]);
  const projectDocs = projects.projects.map((project) => ({
    id: `project:${project.slug}`,
    type: "Project" as const,
    title: project.name,
    url: `/projects/${project.slug}`,
    tags: [...project.tags, ...project.stack.slice(0, 3)],
    body: [project.tagline, project.description, ...(project.readmeHighlights ?? [])].join(" ").trim()
  }));
  const nowDocs = nowEntries.entries.map((entry) => ({
    id: `now:${entry.id}`,
    type: "Now" as const,
    title: entry.title,
    url: "/#now",
    tags: [entry.category],
    body: `${entry.tried} ${entry.outcome} ${entry.nextStep}`
  }));
  const sectionDocs: SearchDoc[] = [
    {
      id: "section:proof",
      type: "Section",
      title: "Proof",
      url: "/#proof",
      tags: ["timeline", "skills", "metrics"],
      body: "Impact timeline, systems counters, and skills graph."
    },
    {
      id: "section:projects",
      type: "Section",
      title: "Projects",
      url: "/#projects",
      tags: ["case-study", "github", "portfolio"],
      body: "Flagship projects and artifacts."
    }
  ];
  return [...projectDocs, ...nowDocs, ...sectionDocs];
});

export async function fileExists(relativePath: string) {
  try {
    await fs.access(path.join(process.cwd(), relativePath));
    return true;
  } catch {
    return false;
  }
}
