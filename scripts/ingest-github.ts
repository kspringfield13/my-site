#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";

interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics?: string[];
  updated_at: string;
  default_branch: string;
}

interface ProjectMeta {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  tags: Array<"ai" | "data" | "fullstack">;
  stack: string[];
  repoUrl: string;
  demoUrl?: string;
  pinned: boolean;
  homepageRank?: number;
  stars: number;
  forks: number;
  language: string;
  topics: string[];
  readmeHighlights: string[];
  artifacts: {
    screenshots: string[];
    diagrams: string[];
    docs: string[];
  };
  bannerImage?: string;
  bannerAlt?: string;
  bannerPosition?: "center" | "top" | "bottom";
  updatedAt?: string;
}

const USERNAME = "kspringfield13";
const REQUIRED_REPOS = ["intercoach", "xenosync", "chatdeb", "ecommerce-dbt", "xbot"];
const BASE = process.cwd();

function inferTags(text: string): Array<"ai" | "data" | "fullstack"> {
  const source = text.toLowerCase();
  const tags = new Set<"ai" | "data" | "fullstack">();

  if (/(ai|llm|langchain|openai|agent|genai|prompt)/.test(source)) tags.add("ai");
  if (/(dbt|etl|elt|sql|warehouse|analytics|snowflake|duckdb|pipeline|data)/.test(source)) tags.add("data");
  if (/(react|next|frontend|api|fastapi|streamlit|full-stack|fullstack)/.test(source)) tags.add("fullstack");

  if (tags.size === 0) tags.add("data");
  return [...tags];
}

function inferStack(repo: GitHubRepo, readme: string) {
  const stack = new Set<string>();
  if (repo.language) stack.add(repo.language);

  const checks: Array<[RegExp, string]> = [
    [/\bdbt\b/i, "dbt"],
    [/snowflake/i, "Snowflake"],
    [/duckdb/i, "DuckDB"],
    [/langchain/i, "LangChain"],
    [/openai/i, "OpenAI API"],
    [/fastapi/i, "FastAPI"],
    [/next\.js|nextjs|\bnext\b/i, "Next.js"],
    [/react/i, "React"],
    [/streamlit/i, "Streamlit"],
    [/aws/i, "AWS"],
    [/docker/i, "Docker"]
  ];

  for (const [regex, label] of checks) {
    if (regex.test(readme)) {
      stack.add(label);
    }
  }

  return [...stack].slice(0, 8);
}

function extractReadmeHighlights(readme: string): string[] {
  if (!readme.trim()) return [];
  return readme
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, ""))
    .filter((line) => line.length > 12)
    .slice(0, 3);
}

async function fetchJson<T>(url: string, token?: string): Promise<T | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "kyle-site-ingest-script"
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

async function fetchPinnedRepoNames(token?: string): Promise<string[]> {
  if (!token) {
    return [];
  }

  const query = `
    query($login: String!) {
      user(login: $login) {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes {
            ... on Repository {
              name
            }
          }
        }
      }
    }
  `;

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "kyle-site-ingest-script"
    },
    body: JSON.stringify({
      query,
      variables: {
        login: USERNAME
      }
    })
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as {
    data?: {
      user?: {
        pinnedItems?: {
          nodes?: Array<{ name?: string }>;
        };
      };
    };
  };

  return (
    payload.data?.user?.pinnedItems?.nodes
      ?.map((node) => node.name)
      .filter((value): value is string => Boolean(value))
      .map((name) => name.toLowerCase()) ?? []
  );
}

async function fetchReadme(owner: string, repo: string, branch: string, token?: string) {
  const candidates = [
    `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`,
    `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/readme.md`
  ];

  for (const url of candidates) {
    const headers: Record<string, string> = { "User-Agent": "kyle-site-ingest-script" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(url, { headers });
    if (response.ok) {
      return response.text();
    }
  }

  return "";
}

function normalizeRepo(repo: GitHubRepo, readme: string): ProjectMeta {
  const raw = `${repo.name}\n${repo.description ?? ""}\n${readme}\n${(repo.topics ?? []).join(" ")}`;
  const tags = inferTags(raw);

  return {
    slug: repo.name.toLowerCase(),
    name: repo.name,
    tagline: repo.description ?? "",
    description: repo.description ?? "",
    tags,
    stack: inferStack(repo, readme),
    repoUrl: repo.html_url,
    demoUrl: "",
    pinned: REQUIRED_REPOS.includes(repo.name.toLowerCase()),
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language ?? "",
    topics: repo.topics ?? [],
    readmeHighlights: extractReadmeHighlights(readme),
    artifacts: {
      screenshots: [],
      diagrams: [],
      docs: []
    },
    updatedAt: repo.updated_at
  };
}

function projectStub(project: ProjectMeta): string {
  const tagList = project.tags.map((tag) => `"${tag}"`).join(", ");
  const highlights = project.readmeHighlights.length
    ? project.readmeHighlights.map((line) => `- ${line}`).join("\n")
    : "- Key implementation details to be added.";
  return `---
title: "${project.name}"
slug: "${project.slug}"
tags: [${tagList}]
repoUrl: "${project.repoUrl}"
---

## Context
${highlights}

## Approach

## Architecture

## Results

## Lessons

## Artifacts
- Repo: ${project.repoUrl}

## If I had 2 more weeks...
`;
}

async function readExistingProjectIndex(indexPath: string) {
  try {
    const raw = await fs.readFile(indexPath, "utf8");
    const parsed = JSON.parse(raw) as { projects?: ProjectMeta[] };
    return parsed.projects ?? [];
  } catch {
    return [];
  }
}

async function ensureCaseStudyStub(project: ProjectMeta) {
  const filePath = path.join(BASE, "content", "projects", `${project.slug}.mdx`);
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, projectStub(project), "utf8");
  }
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const projectsDir = path.join(BASE, "content", "projects");
  const indexPath = path.join(projectsDir, "projects.json");

  await fs.mkdir(projectsDir, { recursive: true });

  const existing = await readExistingProjectIndex(indexPath);
  const bySlug = new Map(existing.map((item) => [item.slug, item]));

  const pinnedNames = await fetchPinnedRepoNames(token);
  const repoNames = [...new Set([...REQUIRED_REPOS, ...pinnedNames])];

  for (const repoName of repoNames) {
    const repo = await fetchJson<GitHubRepo>(`https://api.github.com/repos/${USERNAME}/${repoName}`, token);
    if (!repo) {
      console.warn(`Skipping ${repoName} (not found or rate limited).`);
      continue;
    }

    const readme = await fetchReadme(USERNAME, repo.name, repo.default_branch || "main", token);
    const normalized = normalizeRepo(repo, readme);
    const previous = bySlug.get(normalized.slug);

    bySlug.set(normalized.slug, {
      ...normalized,
      demoUrl: previous?.demoUrl ?? normalized.demoUrl,
      artifacts: previous?.artifacts ?? normalized.artifacts,
      bannerImage: previous?.bannerImage,
      bannerAlt: previous?.bannerAlt,
      bannerPosition: previous?.bannerPosition,
      tags: previous?.tags?.length ? previous.tags : normalized.tags,
      stack: previous?.stack?.length ? previous.stack : normalized.stack,
      pinned: pinnedNames.includes(normalized.slug) || REQUIRED_REPOS.includes(normalized.slug),
      homepageRank: previous?.homepageRank,
      readmeHighlights: normalized.readmeHighlights.length
        ? normalized.readmeHighlights
        : previous?.readmeHighlights ?? []
    });
  }

  const projects = [...bySlug.values()]
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.stars - a.stars || a.name.localeCompare(b.name));

  await fs.writeFile(
    indexPath,
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        projects
      },
      null,
      2
    ),
    "utf8"
  );

  await Promise.all(projects.map((project) => ensureCaseStudyStub(project)));

  console.log(`Updated ${projects.length} projects in content/projects/projects.json`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
