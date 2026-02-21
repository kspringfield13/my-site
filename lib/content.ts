import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { getContentPath, loadMdxFile } from "@/lib/mdx";
import type {
  NowFeed,
  ProjectIndex,
  ProofMetrics,
  ResumeDerived,
  SearchDoc
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
  timelineHighlights: []
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
      source: mdx.source
    };
  } catch {
    return {
      meta,
      frontmatter: {
        title: meta.name
      },
      source: null
    };
  }
});

export const getFlagshipProjects = cache(async (limit = 6) => {
  const index = await getProjectIndex();
  const pinned = index.projects.filter((project) => project.pinned);
  const fallback = index.projects;
  const source = pinned.length > 0 ? pinned : fallback;
  return source
    .slice()
    .sort((a, b) => {
      const rankA = a.homepageRank ?? Number.MAX_SAFE_INTEGER;
      const rankB = b.homepageRank ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB || b.stars - a.stars || a.name.localeCompare(b.name);
    })
    .slice(0, limit);
});

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
    title: entry.category.toUpperCase(),
    url: "/#now",
    tags: [entry.category],
    body: entry.details.join(" ")
  }));
  const sectionDocs: SearchDoc[] = [
    {
      id: "section:proof",
      type: "Section",
      title: "Proof",
      url: "/#proof",
      tags: ["timeline", "experience", "milestones"],
      body: "Career impact timeline with resume-grounded milestones."
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
