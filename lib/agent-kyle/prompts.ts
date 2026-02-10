import type { EvidenceItem } from "@/lib/agent-kyle/types";

function formatEvidence(evidence: EvidenceItem[]): string {
  return evidence
    .map((item) => {
      const tags = item.tags.length ? `tags=${item.tags.join(",")}` : "tags=none";
      return `- id=${item.id} | title=${item.title} | source=${item.sourceType} | ${tags} | snippet=${item.snippet}`;
    })
    .join("\n");
}

export function buildSignalScorecardPrompt(input: {
  role?: string;
  industry?: string;
  prioritySkills: string[];
  evidence: EvidenceItem[];
}): string {
  const role = input.role?.trim() || "unspecified";
  const industry = input.industry?.trim() || "unspecified";
  const skills = input.prioritySkills.join(", ") || "unspecified";

  return [
    "You are Agent Kyle, an AI capability analyst for a technical portfolio.",
    "Use only the provided evidence. Do not invent projects, links, or claims.",
    "Write a concise executive summary grounded in real portfolio proof.",
    "The summary must synthesize role + industry + priority skills with evidence from experience artifacts.",
    "Summary requirements:",
    "- 110-170 words, plain text, no markdown",
    "- Open with a direct fit statement for the target role and industry",
    "- Call out the top 3 priority skills with concrete signal",
    "- Mention at least two evidence titles explicitly",
    "- Include one risk or weak-signal area and one practical next move",
    `Target role: ${role}`,
    `Target industry: ${industry}`,
    `Priority skills: ${skills}`,
    "Return strict JSON with this shape:",
    '{"summary":"string","capabilityRadar":[{"skill":"string","score":0-100,"confidence":0-1,"evidenceIds":["id"]}]}',
    "Use evidenceIds that exist in the evidence list.",
    "Evidence:",
    formatEvidence(input.evidence)
  ].join("\n");
}

export function buildOpportunityFitPrompt(input: {
  jobDescription: string;
  knownSkills: string[];
  evidence: EvidenceItem[];
}): string {
  return [
    "You are Agent Kyle, evaluating portfolio fit against a job description.",
    "Use only provided evidence IDs and known skills.",
    "Return strict JSON with this shape:",
    '{"fitScore":0-100,"rationale":"string","matchingEvidence":[{"id":"string","reason":"string","relevance":0-100}],"gaps":["string"],"recommendations":["string"],"confidence":0-1}',
    "Keep recommendations concrete and short.",
    `Known skills: ${input.knownSkills.join(", ")}`,
    `Job description: ${input.jobDescription}`,
    "Evidence:",
    formatEvidence(input.evidence)
  ].join("\n");
}
