import { z } from "zod";
import { buildEvidenceContext, rankEvidenceByQuery } from "@/lib/agent-kyle/evidence";
import { createGroqJsonCompletion } from "@/lib/agent-kyle/groq";
import { buildAgentChatPrompt } from "@/lib/agent-kyle/prompts";
import { sanitizeFreeText, stripMarkdownCodeFence } from "@/lib/agent-kyle/sanitize";
import {
  agentChatResponseSchema,
  type AgentChatAction,
  type AgentChatInput,
  type AgentChatResponse,
  type AgentGenerated,
  type EvidenceItem
} from "@/lib/agent-kyle/types";
import { getSiteConfig } from "@/lib/site-config";

const CHAT_SYSTEM_PROMPT =
  "You are Agent Kyle, a grounded portfolio guide. Return strict JSON, cite only supplied evidence IDs, and protect private information.";

const chatModelSchema = z.object({
  answer: z.string().min(1),
  sourceIds: z.array(z.string()).default([]),
  followUps: z.array(z.string()).default([])
});

const DEFAULT_FOLLOW_UPS = [
  "Which projects best show Kyle's technical range?",
  "How has Kyle's career progressed?",
  "What kind of role would be the strongest fit?"
];

function parseJsonObject(raw: string): unknown {
  return JSON.parse(stripMarkdownCodeFence(raw));
}

function buildFallbackAnswer(query: string, evidence: EvidenceItem[]): string {
  const examples = evidence.slice(0, 3);
  const evidenceSummary = examples
    .map((item) => `${item.title}: ${item.snippet}`)
    .join(" ");

  return sanitizeFreeText(
    `Based on Kyle's public portfolio, the strongest relevant evidence for "${query}" is: ${evidenceSummary} Open the linked sources below for the full context.`,
    1200
  );
}

function includesAny(query: string, terms: string[]): boolean {
  return terms.some((term) => query.includes(term));
}

function buildActions(query: string, topEvidence: EvidenceItem[], config: Awaited<ReturnType<typeof getSiteConfig>>): AgentChatAction[] {
  const normalized = query.toLowerCase();
  const actions: AgentChatAction[] = [];
  const add = (action: AgentChatAction) => {
    if (!actions.some((item) => item.url === action.url)) actions.push(action);
  };

  const relevantProject = topEvidence.find((item) => item.sourceType === "project");
  if (relevantProject) {
    add({
      label: "View case study",
      description: `Explore the evidence behind ${relevantProject.title.replace(" case study", "")}.`,
      url: relevantProject.url,
      kind: "site"
    });
  }

  if (includesAny(normalized, ["project", "github", "code", "repo", "build", "technical"])) {
    add({
      label: "Open GitHub",
      description: "Review Kyle's public repositories and implementation work.",
      url: config.contact.github,
      kind: "github"
    });
  }

  if (includesAny(normalized, ["experience", "career", "role", "hire", "job", "background", "resume", "leadership"])) {
    add({
      label: "Read resume",
      description: "See Kyle's full work history, skills, and certifications.",
      url: "/resume",
      kind: "site"
    });
    add({
      label: "Open LinkedIn",
      description: "View Kyle's public professional profile.",
      url: config.contact.linkedin,
      kind: "linkedin"
    });
  }

  if (includesAny(normalized, ["contact", "talk", "meet", "hire", "available", "opportunity", "collaborate"])) {
    add({
      label: "Contact Kyle",
      description: "Start a direct conversation about a role or collaboration.",
      url: `mailto:${config.contact.email}`,
      kind: "email"
    });
  }

  if (actions.length === 0) {
    add({
      label: "Explore projects",
      description: "Browse Kyle's selected technical case studies.",
      url: "/projects",
      kind: "site"
    });
    add({
      label: "Read resume",
      description: "See the career context behind the work.",
      url: "/resume",
      kind: "site"
    });
  }

  return actions.slice(0, 3);
}

export async function generateAgentChat(input: AgentChatInput): Promise<AgentGenerated<AgentChatResponse>> {
  const [context, config] = await Promise.all([buildEvidenceContext(), getSiteConfig()]);
  const latestQuestion = input.messages.filter((message) => message.role === "user").at(-1)?.content || "";
  const conversationQuery = input.messages
    .slice(-5)
    .map((message) => message.content)
    .join(" ");
  const rankedEvidence = rankEvidenceByQuery(conversationQuery, context.evidence, 18);

  const completion = await createGroqJsonCompletion({
    systemPrompt: CHAT_SYSTEM_PROMPT,
    userPrompt: buildAgentChatPrompt({
      messages: input.messages.slice(-8),
      evidence: rankedEvidence,
      pagePath: input.pagePath
    }),
    temperature: 0.25
  });

  let answer = buildFallbackAnswer(latestQuestion, rankedEvidence);
  let sources = rankedEvidence.slice(0, 4);
  let followUps = DEFAULT_FOLLOW_UPS;

  try {
    const parsed = chatModelSchema.parse(parseJsonObject(completion.content));
    const evidenceById = new Map(rankedEvidence.map((item) => [item.id, item]));
    const resolvedSources = parsed.sourceIds
      .map((id) => evidenceById.get(id))
      .filter((item): item is EvidenceItem => Boolean(item));

    answer = sanitizeFreeText(parsed.answer, 1800);
    sources = (resolvedSources.length ? resolvedSources : sources).slice(0, 6);
    followUps = parsed.followUps
      .map((item) => sanitizeFreeText(item, 120))
      .filter(Boolean)
      .slice(0, 4);
    if (followUps.length < 2) followUps = DEFAULT_FOLLOW_UPS;
  } catch {
    // The grounded fallback remains useful if the model returns malformed JSON.
  }

  const response = agentChatResponseSchema.parse({
    answer,
    sources,
    followUps,
    actions: buildActions(latestQuestion, rankedEvidence, config),
    generatedAt: new Date().toISOString(),
    model: completion.model
  });

  return {
    payload: response,
    usage: completion.usage
  };
}
