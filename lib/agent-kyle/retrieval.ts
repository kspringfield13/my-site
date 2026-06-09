import { sanitizeFreeText } from "@/lib/agent-kyle/sanitize";
import type { EvidenceItem } from "@/lib/agent-kyle/types";

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

export function normalizeEvidenceText(value: string): string {
  return sanitizeFreeText(value.toLowerCase(), 5000);
}

export function tokenizeEvidenceText(value: string): string[] {
  return normalizeEvidenceText(value)
    .split(/[^a-z0-9+#.]+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

export function evidenceOverlapScore(needle: string[], haystack: string[]): number {
  if (needle.length === 0 || haystack.length === 0) return 0;
  const haystackSet = new Set(haystack);
  let hits = 0;
  for (const token of needle) {
    if (haystackSet.has(token)) hits += 1;
  }
  return hits / needle.length;
}

function expandQueryTokens(query: string): string[] {
  const normalized = normalizeEvidenceText(query);
  const tokens = tokenizeEvidenceText(query);
  const expansions: string[] = [];

  if (/(ai|artificial intelligence|assisted|coding|development|developer|workflow|model)/.test(normalized)) {
    expansions.push(
      "cursor",
      "claude",
      "claude code",
      "codex",
      "chatgpt",
      "opus",
      "ai-assisted",
      "development assistant"
    );
  }

  if (/(current|currently|now|today|recent|lately|use|uses|using|tool|technology|workflow)/.test(normalized)) {
    expansions.push("now", "tools", "models", "current workflow");
  }

  return Array.from(new Set([...tokens, ...tokenizeEvidenceText(expansions.join(" "))]));
}

function scoreEvidence(query: string, evidence: EvidenceItem): number {
  const queryTokens = expandQueryTokens(query);
  const haystack = tokenizeEvidenceText(`${evidence.title} ${evidence.snippet} ${evidence.tags.join(" ")}`);
  const normalizedQuery = normalizeEvidenceText(query);
  const haystackSet = new Set(haystack);
  let score = evidenceOverlapScore(queryTokens, haystack);

  const asksAboutAiWorkflow =
    /(ai|assisted|coding|development|developer|workflow|model|tool|technology)/.test(normalizedQuery);
  const namesAiDevelopmentTools = ["cursor", "claude", "codex"].filter((tool) => haystackSet.has(tool)).length;

  if (evidence.sourceType === "now" && asksAboutAiWorkflow) {
    score += 0.2 + namesAiDevelopmentTools * 0.18;
  }

  return score;
}

export function rankEvidenceByQuery(query: string, evidence: EvidenceItem[], limit = 10): EvidenceItem[] {
  if (!query.trim()) return evidence.slice(0, limit);

  return [...evidence]
    .map((item) => ({ item, score: scoreEvidence(query, item) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}

export function selectChatEvidence(query: string, evidence: EvidenceItem[], limit = 18): EvidenceItem[] {
  const ranked = rankEvidenceByQuery(query, evidence, limit);
  const normalized = query.toLowerCase();
  const asksAboutCurrentTools =
    /(ai|assisted|coding|development|developer|workflow|model|tool|technology|current|currently|now)/.test(normalized);

  if (!asksAboutCurrentTools) return ranked;

  const relevantNow = rankEvidenceByQuery(
    `${query} Cursor Claude Code Codex ChatGPT models tools`,
    evidence.filter((item) => item.sourceType === "now"),
    4
  );

  const prioritized = [...relevantNow, ...ranked];
  return prioritized
    .filter((item, index) => prioritized.findIndex((candidate) => candidate.id === item.id) === index)
    .slice(0, limit);
}
