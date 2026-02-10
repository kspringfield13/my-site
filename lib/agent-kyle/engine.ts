import { z } from "zod";
import {
  buildCapabilityHeatmap,
  buildCapabilityRadar,
  buildEvidenceContext,
  computeSkillMatch,
  extractSkillCandidatesFromJobDescription,
  inferPrioritySkills,
  rankEvidenceByQuery
} from "@/lib/agent-kyle/evidence";
import { createGroqJsonCompletion } from "@/lib/agent-kyle/groq";
import { buildOpportunityFitPrompt, buildSignalScorecardPrompt } from "@/lib/agent-kyle/prompts";
import { clampNumber, sanitizeFreeText, stripMarkdownCodeFence } from "@/lib/agent-kyle/sanitize";
import type {
  AgentGenerated,
  OpportunityFitInput,
  OpportunityFitResponse,
  SignalScorecardInput,
  SignalScorecardResponse
} from "@/lib/agent-kyle/types";
import { opportunityFitResponseSchema, signalScorecardResponseSchema } from "@/lib/agent-kyle/types";

const AGENT_SYSTEM_PROMPT =
  "You are Agent Kyle, a strict JSON portfolio analysis assistant. Use provided evidence only and keep output concise.";

const scorecardModelSchema = z.object({
  summary: z.string().min(1),
  capabilityRadar: z
    .array(
      z.object({
        skill: z.string().min(1),
        score: z.number().min(0).max(100),
        confidence: z.number().min(0).max(1),
        evidenceIds: z.array(z.string()).optional()
      })
    )
    .optional()
});

const fitModelSchema = z.object({
  fitScore: z.number().min(0).max(100),
  rationale: z.string().min(1),
  matchingEvidence: z
    .array(
      z.object({
        id: z.string().min(1),
        reason: z.string().min(1),
        relevance: z.number().min(0).max(100)
      })
    )
    .optional(),
  gaps: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1).optional()
});

function parseJsonObject(raw: string): unknown {
  const stripped = stripMarkdownCodeFence(raw);
  return JSON.parse(stripped);
}

function fallbackScorecardSummary(input: {
  role?: string;
  industry?: string;
  topSkills: string[];
  topEvidenceTitles: string[];
}): string {
  const role = input.role?.trim() ? input.role.trim() : "the target role";
  const industry = input.industry?.trim() ? input.industry.trim() : "the target industry";
  const topSkills = input.topSkills.slice(0, 3).join(", ") || "core analytics engineering skills";
  const evidenceExamples = input.topEvidenceTitles.slice(0, 2).join(" and ");

  return [
    `For ${role} in ${industry}, portfolio signal is strongest around ${topSkills}.`,
    evidenceExamples
      ? `Evidence from ${evidenceExamples} reinforces delivery across data systems, analytics execution, and cross-functional ownership.`
      : "Evidence from projects and resume artifacts reinforces delivery across data systems and analytics execution.",
    "Primary risk is uneven depth in specialized role-tailored artifacts, especially when requirements call for niche tooling.",
    "Best next move: add one targeted case study that mirrors the target role language and includes measurable business impact."
  ].join(" ");
}

function normalizeSkill(value: string): string {
  return sanitizeFreeText(value.toLowerCase(), 80);
}

export async function generateSignalScorecard(
  input: SignalScorecardInput
): Promise<AgentGenerated<SignalScorecardResponse>> {
  const context = await buildEvidenceContext();
  const prioritySkills = inferPrioritySkills({
    requestedSkills: input.prioritySkills || [],
    fallbackSkills: context.skillUniverse,
    evidence: context.evidence,
    limit: 8
  });

  const evidenceQuery = [input.role, input.industry, ...prioritySkills].filter(Boolean).join(" ");
  const evidence = rankEvidenceByQuery(evidenceQuery, context.evidence, 16);

  const fallbackRadar = buildCapabilityRadar({
    skills: prioritySkills,
    evidence
  });

  const heatmap = buildCapabilityHeatmap({
    skills: prioritySkills,
    projects: context.projects,
    evidence,
    maxProjectsPerSkill: 4
  });

  const completion = await createGroqJsonCompletion({
    systemPrompt: AGENT_SYSTEM_PROMPT,
    userPrompt: buildSignalScorecardPrompt({
      role: input.role,
      industry: input.industry,
      prioritySkills,
      evidence
    })
  });

  let summary = fallbackScorecardSummary({
    role: input.role,
    industry: input.industry,
    topSkills: prioritySkills,
    topEvidenceTitles: evidence.slice(0, 4).map((item) => item.title)
  });

  let capabilityRadar = fallbackRadar;

  try {
    const parsed = scorecardModelSchema.parse(parseJsonObject(completion.content));
    summary = sanitizeFreeText(parsed.summary, 920);

    if (parsed.capabilityRadar?.length) {
      const bySkill = new Map(fallbackRadar.map((item) => [normalizeSkill(item.skill), item]));

      for (const item of parsed.capabilityRadar) {
        const key = normalizeSkill(item.skill);
        const existing = bySkill.get(key);
        if (!existing) continue;
        existing.score = clampNumber(item.score, 0, 100);
        existing.confidence = clampNumber(item.confidence, 0, 1);
      }

      capabilityRadar = Array.from(bySkill.values());
    }
  } catch {
    // Keep fallback summary and radar if model JSON is malformed.
  }

  const response = signalScorecardResponseSchema.parse({
    capabilityRadar,
    heatmap,
    evidence,
    summary,
    generatedAt: new Date().toISOString(),
    model: completion.model
  });

  return {
    payload: response,
    usage: completion.usage
  };
}

function fallbackFitReasoning(input: {
  matchedSkills: string[];
  missingSkills: string[];
}): {
  rationale: string;
  recommendations: string[];
} {
  const rationale = `Agent Kyle found alignment in ${input.matchedSkills.slice(0, 5).join(", " ) || "core portfolio themes"}. Fit is constrained by gaps in ${input.missingSkills
    .slice(0, 3)
    .join(", ") || "specialized requirements"}.`;

  const recommendations = [
    input.missingSkills[0] ? `Add a portfolio proof artifact for ${input.missingSkills[0]}.` : "Add one targeted case study for role-specific requirements.",
    "Mirror job language in project summaries to improve recruiter scanning.",
    "Attach quantified outcomes to top three matching projects."
  ];

  return {
    rationale,
    recommendations
  };
}

export async function generateOpportunityFit(
  input: OpportunityFitInput
): Promise<AgentGenerated<OpportunityFitResponse>> {
  const jobDescription = sanitizeFreeText(input.jobDescription, 8000);
  const context = await buildEvidenceContext();

  const evidence = rankEvidenceByQuery(jobDescription, context.evidence, 16);
  const jdSkillCandidates = extractSkillCandidatesFromJobDescription(jobDescription);
  const match = computeSkillMatch({
    jdSkills: jdSkillCandidates,
    knownSkills: context.skillUniverse
  });

  const matchedCount = match.matched.length;
  const totalCompared = Math.max(1, match.matched.length + match.missing.length);
  const heuristicFit = Math.round(clampNumber((matchedCount / totalCompared) * 100, 18, 96));
  const fallbackReasoning = fallbackFitReasoning({
    matchedSkills: match.matched,
    missingSkills: match.missing
  });

  const completion = await createGroqJsonCompletion({
    systemPrompt: AGENT_SYSTEM_PROMPT,
    userPrompt: buildOpportunityFitPrompt({
      jobDescription,
      knownSkills: context.skillUniverse.slice(0, 80),
      evidence
    })
  });

  let fitScore = heuristicFit;
  let rationale = fallbackReasoning.rationale;
  let gaps = match.missing.slice(0, 6);
  let recommendations = fallbackReasoning.recommendations;
  let confidence = clampNumber(0.4 + match.matched.length * 0.06, 0.35, 0.92);
  let matchingEvidence: OpportunityFitResponse["matchingEvidence"] = evidence.slice(0, 6).map((item, index) => ({
    evidenceId: item.id,
    title: item.title,
    url: item.url,
    sourceType: item.sourceType,
    relevance: clampNumber(92 - index * 11, 45, 99),
    reason: "Evidence aligns with role requirements and portfolio outcomes."
  }));

  try {
    const parsed = fitModelSchema.parse(parseJsonObject(completion.content));
    fitScore = Math.round(clampNumber(parsed.fitScore, 0, 100));
    rationale = sanitizeFreeText(parsed.rationale, 520);
    gaps = (parsed.gaps || gaps).map((value: string) => sanitizeFreeText(value, 120)).filter(Boolean).slice(0, 8);
    recommendations = (parsed.recommendations || recommendations)
      .map((value: string) => sanitizeFreeText(value, 140))
      .filter(Boolean)
      .slice(0, 8);
    confidence = clampNumber(parsed.confidence ?? confidence, 0, 1);

    if (parsed.matchingEvidence?.length) {
      const evidenceById = new Map(evidence.map((item) => [item.id, item]));
      matchingEvidence = parsed.matchingEvidence
        .map((item: { id: string; reason: string; relevance: number }) => {
          const resolved = evidenceById.get(item.id);
          if (!resolved) return null;
          return {
            evidenceId: resolved.id,
            title: resolved.title,
            url: resolved.url,
            sourceType: resolved.sourceType,
            reason: sanitizeFreeText(item.reason, 200),
            relevance: Math.round(clampNumber(item.relevance, 0, 100))
          };
        })
        .filter(
          (item: unknown): item is {
            evidenceId: string;
            title: string;
            url: string;
            sourceType: OpportunityFitResponse["matchingEvidence"][number]["sourceType"];
            reason: string;
            relevance: number;
          } => Boolean(item)
        )
        .slice(0, 8);
    }
  } catch {
    // Keep heuristic values when the model output is malformed.
  }

  const response = opportunityFitResponseSchema.parse({
    fitScore,
    rationale,
    matchingEvidence,
    gaps,
    recommendations,
    confidence,
    generatedAt: new Date().toISOString(),
    model: completion.model
  });

  return {
    payload: response,
    usage: completion.usage
  };
}
