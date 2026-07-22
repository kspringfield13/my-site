#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import { addProjectSkills, buildProjectEvidence } from "../lib/agent-kyle/project-context";
import { selectChatEvidence, tokenizeEvidenceText } from "../lib/agent-kyle/retrieval";
import type { EvidenceItem } from "../lib/agent-kyle/types";
import type { NowFeed, ProjectIndex } from "../lib/types";

async function main() {
  const feedPath = path.join(process.cwd(), "content", "now", "entries.json");
  const feed = JSON.parse(await fs.readFile(feedPath, "utf8")) as NowFeed;
  const nowEvidence: EvidenceItem[] = feed.entries.map((entry) => ({
    id: `now:${entry.id}`,
    title: entry.title || entry.category.toUpperCase(),
    url: "/#now",
    sourceType: "now",
    snippet: entry.details.join(" "),
    tags: tokenizeEvidenceText(`${entry.category} ${entry.details.join(" ")}`)
  }));

  const query = "What specific technologies does Kyle use for AI-assisted development workflows?";
  const selected = selectChatEvidence(query, nowEvidence, 6);
  const combined = selected.map((item) => `${item.title} ${item.snippet}`).join(" ").toLowerCase();

  for (const expected of ["cursor", "claude code", "codex"]) {
    if (!combined.includes(expected)) {
      throw new Error(`Agent retrieval check failed: missing ${expected}.`);
    }
  }

  const selectedIds = new Set(selected.map((item) => item.id));
  for (const expectedId of ["now:2026-06-07-tools", "now:2026-06-07-models"]) {
    if (!selectedIds.has(expectedId)) {
      throw new Error(`Agent retrieval check failed: missing ${expectedId}.`);
    }
  }

  const projectsPath = path.join(process.cwd(), "content", "projects", "projects.json");
  const projectIndex = JSON.parse(await fs.readFile(projectsPath, "utf8")) as ProjectIndex;
  const weekform = projectIndex.projects.find((project) => project.slug === "weekform");
  if (!weekform) {
    throw new Error("Agent retrieval check failed: Weekform project is missing.");
  }

  const skillUniverse = new Set<string>();
  addProjectSkills(skillUniverse, projectIndex.projects);
  const expectedSkills = ["typescript", "react", "tauri", "rust", "openai api"];
  for (const expected of expectedSkills) {
    if (!skillUniverse.has(expected)) {
      throw new Error(`Agent retrieval check failed: Weekform skill missing from context: ${expected}.`);
    }
  }

  const projectEvidence = buildProjectEvidence(projectIndex.projects).filter(
    (item) => item.projectSlug === "weekform"
  );
  const projectEvidenceIds = new Set(projectEvidence.map((item) => item.id));
  for (const expectedId of ["project:weekform", "github:weekform"]) {
    if (!projectEvidenceIds.has(expectedId)) {
      throw new Error(`Agent retrieval check failed: missing ${expectedId}.`);
    }
  }

  const weekformContext = projectEvidence
    .map((item) => `${item.title} ${item.snippet} ${item.tags.join(" ")}`)
    .join(" ")
    .toLowerCase();
  for (const expected of ["local-first", "capacity", "outlook", "foreground-app"]) {
    if (!weekformContext.includes(expected)) {
      throw new Error(`Agent retrieval check failed: Weekform context missing ${expected}.`);
    }
  }

  console.log(
    `Agent retrieval check passed: ${selected.map((item) => item.id).join(", ")}; ${[
      ...projectEvidenceIds
    ].join(", ")}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
