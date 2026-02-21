import { getNowEntries, getProjectIndex, getResumeDerived, getSearchDocs } from "@/lib/content";
import { sanitizeFreeText, toTitleCase } from "@/lib/agent-kyle/sanitize";
import type { CapabilityHeatmapCell, EvidenceItem } from "@/lib/agent-kyle/types";
import type { ProjectMeta } from "@/lib/types";

const STOP_WORDS = new Set([
  "and",
  "the",
  "with",
  "for",
  "from",
  "that",
  "this",
  "into",
  "your",
  "their",
  "have",
  "has",
  "will",
  "build",
  "built",
  "using",
  "across",
  "through",
  "about",
  "our",
  "you",
  "are",
  "job",
  "role"
]);

export interface AgentEvidenceContext {
  evidence: EvidenceItem[];
  projects: ProjectMeta[];
  skillUniverse: string[];
}

function normalize(value: string): string {
  return sanitizeFreeText(value.toLowerCase(), 5000);
}

function tokenize(value: string): string[] {
  return normalize(value)
    .split(/[^a-z0-9+#.]+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function overlapScore(needle: string[], haystack: string[]): number {
  if (needle.length === 0 || haystack.length === 0) return 0;
  const haystackSet = new Set(haystack);
  let hits = 0;
  for (const token of needle) {
    if (haystackSet.has(token)) hits += 1;
  }
  return hits / needle.length;
}

function scoreEvidence(query: string, evidence: EvidenceItem): number {
  const queryTokens = tokenize(query);
  const haystack = tokenize(`${evidence.title} ${evidence.snippet} ${evidence.tags.join(" ")}`);
  return overlapScore(queryTokens, haystack);
}

function compactSnippet(value: string): string {
  const snippet = sanitizeFreeText(value, 190);
  return snippet.length <= 180 ? snippet : `${snippet.slice(0, 177)}...`;
}

function dedupeEvidence(items: EvidenceItem[]): EvidenceItem[] {
  const seen = new Set<string>();
  const output: EvidenceItem[] = [];

  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    output.push(item);
  }

  return output;
}

function buildProjectEvidence(projects: ProjectMeta[]): EvidenceItem[] {
  return projects.map((project) => ({
    id: `project:${project.slug}`,
    title: project.name,
    url: `/projects/${project.slug}`,
    sourceType: "project",
    snippet: compactSnippet(`${project.tagline || project.description} ${(project.readmeHighlights || []).join(" ")}`),
    tags: [...project.tags, ...project.stack.slice(0, 8)].map((tag) => normalize(tag)).filter(Boolean),
    projectSlug: project.slug
  }));
}

function buildResumeEvidence(resume: Awaited<ReturnType<typeof getResumeDerived>>): EvidenceItem[] {
  const clusterEvidence = Object.entries(resume.skillClusters).map(([cluster, items]) => ({
    id: `resume:cluster:${cluster}`,
    title: `${toTitleCase(cluster)} cluster`,
    url: "/resume",
    sourceType: "resume" as const,
    snippet: compactSnippet(items.join(" · ")),
    tags: items.map((item) => normalize(item))
  }));

  const roleEvidence = resume.experience.map((role, index) => ({
    id: `resume:role:${index}`,
    title: `${role.title} @ ${role.company}`,
    url: "/resume",
    sourceType: "resume" as const,
    snippet: compactSnippet(role.highlights.join(" ")),
    tags: tokenize(`${role.title} ${role.company} ${role.highlights.join(" ")}`).slice(0, 16)
  }));

  return [...clusterEvidence, ...roleEvidence];
}

export async function buildEvidenceContext(): Promise<AgentEvidenceContext> {
  const [projectIndex, nowFeed, resume, searchDocs] = await Promise.all([
    getProjectIndex(),
    getNowEntries(),
    getResumeDerived(),
    getSearchDocs()
  ]);

  const projectEvidence = buildProjectEvidence(projectIndex.projects);
  const resumeEvidence = buildResumeEvidence(resume);

  const nowEvidence: EvidenceItem[] = nowFeed.entries.slice(0, 16).map((entry) => ({
    id: `now:${entry.id}`,
    title: entry.category.toUpperCase(),
    url: "/archive/now",
    sourceType: "now",
    snippet: compactSnippet(entry.details.join(" ")),
    tags: tokenize(`${entry.category} ${entry.details.join(" ")}`).slice(0, 12)
  }));

  const sectionEvidence: EvidenceItem[] = searchDocs
    .filter((doc) => doc.type === "Section")
    .map((doc) => ({
      id: doc.id,
      title: doc.title,
      url: doc.url,
      sourceType: "section",
      snippet: compactSnippet(doc.body),
      tags: doc.tags.map((tag) => normalize(tag)).filter(Boolean)
    }));

  const evidence = dedupeEvidence([
    ...projectEvidence,
    ...resumeEvidence,
    ...nowEvidence,
    ...sectionEvidence
  ]);

  const skillUniverseSet = new Set<string>();
  for (const items of Object.values(resume.skillClusters)) {
    for (const skill of items) {
      const normalized = normalize(skill);
      if (normalized) skillUniverseSet.add(normalized);
    }
  }

  for (const project of projectIndex.projects) {
    for (const stack of project.stack.slice(0, 8)) {
      const normalized = normalize(stack);
      if (normalized) skillUniverseSet.add(normalized);
    }
  }

  const skillUniverse = Array.from(skillUniverseSet);
  if (skillUniverse.length === 0) {
    skillUniverse.push("data", "analytics", "ai", "python", "sql", "dbt");
  }

  return {
    evidence,
    projects: projectIndex.projects,
    skillUniverse
  };
}

export function rankEvidenceByQuery(query: string, evidence: EvidenceItem[], limit = 10): EvidenceItem[] {
  if (!query.trim()) {
    return evidence.slice(0, limit);
  }

  return [...evidence]
    .map((item) => ({ item, score: scoreEvidence(query, item) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}

export function inferPrioritySkills(input: {
  requestedSkills: string[];
  fallbackSkills: string[];
  evidence: EvidenceItem[];
  limit?: number;
}): string[] {
  const limit = input.limit ?? 8;
  const normalizedRequested = input.requestedSkills.map((skill) => normalize(skill)).filter(Boolean);
  if (normalizedRequested.length > 0) {
    return Array.from(new Set(normalizedRequested)).slice(0, limit);
  }

  const counts = new Map<string, number>();
  for (const skill of input.fallbackSkills) {
    counts.set(skill, 0);
  }

  for (const item of input.evidence) {
    const haystack = tokenize(`${item.title} ${item.snippet} ${item.tags.join(" ")}`);
    const haystackSet = new Set(haystack);
    for (const skill of input.fallbackSkills) {
      if (haystackSet.has(skill)) {
        counts.set(skill, (counts.get(skill) || 0) + 1);
      }
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([skill]) => skill);
}

export function buildCapabilityRadar(input: {
  skills: string[];
  evidence: EvidenceItem[];
}): Array<{ skill: string; score: number; confidence: number }> {
  return input.skills.map((skill) => {
    const ranked = rankEvidenceByQuery(skill, input.evidence, 6);
    const score = Math.min(100, 35 + ranked.length * 11);
    const confidence = Math.min(1, 0.42 + ranked.length * 0.08);
    return {
      skill,
      score,
      confidence
    };
  });
}

export function buildCapabilityHeatmap(input: {
  skills: string[];
  projects: ProjectMeta[];
  evidence: EvidenceItem[];
  maxProjectsPerSkill?: number;
}): CapabilityHeatmapCell[] {
  const maxProjectsPerSkill = input.maxProjectsPerSkill ?? 4;
  const projectEvidenceBySlug = new Map<string, EvidenceItem>();
  for (const item of input.evidence) {
    if (item.sourceType === "project" && item.projectSlug) {
      projectEvidenceBySlug.set(item.projectSlug, item);
    }
  }

  const cells: CapabilityHeatmapCell[] = [];

  for (const skill of input.skills) {
    const rankedProjects = input.projects
      .map((project) => {
        const context = `${project.name} ${project.tagline} ${project.description} ${project.stack.join(" ")} ${project.tags.join(" ")}`;
        const strength = overlapScore(tokenize(skill), tokenize(context));
        return {
          project,
          strength
        };
      })
      .filter((entry) => entry.strength > 0)
      .sort((a, b) => b.strength - a.strength)
      .slice(0, maxProjectsPerSkill);

    for (const match of rankedProjects) {
      const evidence = projectEvidenceBySlug.get(match.project.slug);
      if (!evidence) continue;

      cells.push({
        skill,
        projectSlug: match.project.slug,
        strength: Math.max(0.14, Math.min(1, match.strength)),
        evidenceId: evidence.id
      });
    }
  }

  return cells;
}

export function extractSkillCandidatesFromJobDescription(jobDescription: string): string[] {
  const tokens = tokenize(jobDescription);
  const counts = new Map<string, number>();

  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map(([token]) => token);
}

export function computeSkillMatch(input: {
  jdSkills: string[];
  knownSkills: string[];
}): {
  matched: string[];
  missing: string[];
} {
  const known = new Set(input.knownSkills.map((skill) => normalize(skill)));
  const matched: string[] = [];
  const missing: string[] = [];

  for (const jdSkill of input.jdSkills.map((skill) => normalize(skill))) {
    if (!jdSkill) continue;
    if (known.has(jdSkill)) {
      matched.push(jdSkill);
    } else {
      missing.push(jdSkill);
    }
  }

  return {
    matched: Array.from(new Set(matched)),
    missing: Array.from(new Set(missing))
  };
}
