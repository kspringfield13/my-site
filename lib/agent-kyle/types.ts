import { z } from "zod";

export const agentKyleTabSchema = z.enum(["scorecard", "fit"]);
export type AgentKyleTab = z.infer<typeof agentKyleTabSchema>;

export const evidenceSourceSchema = z.enum(["project", "resume", "now", "section"]);
export type EvidenceSource = z.infer<typeof evidenceSourceSchema>;

export const evidenceItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().min(1),
  sourceType: evidenceSourceSchema,
  snippet: z.string().min(1),
  tags: z.array(z.string()).default([]),
  projectSlug: z.string().optional()
});
export type EvidenceItem = z.infer<typeof evidenceItemSchema>;

export const capabilityRadarPointSchema = z.object({
  skill: z.string().min(1),
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1)
});
export type CapabilityRadarPoint = z.infer<typeof capabilityRadarPointSchema>;

export const capabilityHeatmapCellSchema = z.object({
  skill: z.string().min(1),
  projectSlug: z.string().min(1),
  strength: z.number().min(0).max(1),
  evidenceId: z.string().min(1)
});
export type CapabilityHeatmapCell = z.infer<typeof capabilityHeatmapCellSchema>;

export const signalScorecardInputSchema = z.object({
  role: z.string().trim().max(100).optional(),
  industry: z.string().trim().max(100).optional(),
  prioritySkills: z.array(z.string().trim().min(1).max(60)).max(12).optional()
});
export type SignalScorecardInput = z.infer<typeof signalScorecardInputSchema>;

export const signalScorecardResponseSchema = z.object({
  capabilityRadar: z.array(capabilityRadarPointSchema).min(1),
  heatmap: z.array(capabilityHeatmapCellSchema),
  evidence: z.array(evidenceItemSchema),
  summary: z.string().min(1),
  generatedAt: z.string().min(1),
  model: z.string().min(1)
});
export type SignalScorecardResponse = z.infer<typeof signalScorecardResponseSchema>;

export const opportunityFitInputSchema = z.object({
  jobDescription: z.string().trim().min(40).max(8000)
});
export type OpportunityFitInput = z.infer<typeof opportunityFitInputSchema>;

export const opportunityEvidenceSchema = z.object({
  evidenceId: z.string().min(1),
  title: z.string().min(1),
  url: z.string().min(1),
  reason: z.string().min(1),
  relevance: z.number().min(0).max(100),
  sourceType: evidenceSourceSchema
});
export type OpportunityEvidence = z.infer<typeof opportunityEvidenceSchema>;

export const opportunityFitResponseSchema = z.object({
  fitScore: z.number().min(0).max(100),
  rationale: z.string().min(1),
  matchingEvidence: z.array(opportunityEvidenceSchema),
  gaps: z.array(z.string().min(1)).max(12),
  recommendations: z.array(z.string().min(1)).max(12),
  confidence: z.number().min(0).max(1),
  generatedAt: z.string().min(1),
  model: z.string().min(1)
});
export type OpportunityFitResponse = z.infer<typeof opportunityFitResponseSchema>;

export interface RateLimitStatus {
  allowed: boolean;
  reason?: "cooldown" | "window_limit" | "session_limit";
  retryAfterSec?: number;
  remainingInWindow: number;
  sessionRemaining: number;
}

export interface BudgetStatus {
  available: boolean;
  usedTokens: number;
  tokenBudget: number;
  remainingTokens: number;
  resetAt: string;
}

export const agentStatusResponseSchema = z.object({
  available: z.boolean(),
  reason: z.enum(["ok", "disabled", "missing_api_key", "daily_budget_exceeded", "cooldown", "rate_limited"]).optional(),
  retryAfterSec: z.number().int().nonnegative().optional(),
  usageWindow: z.object({
    remainingInWindow: z.number().int().nonnegative(),
    sessionRemaining: z.number().int().nonnegative(),
    remainingTokens: z.number().int().nonnegative(),
    resetAt: z.string().min(1)
  })
});
export type AgentStatusResponse = z.infer<typeof agentStatusResponseSchema>;

export interface GroqUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface GroqCompletionResult {
  model: string;
  content: string;
  usage: GroqUsage;
}

export interface AgentGenerated<T> {
  payload: T;
  usage: GroqUsage;
}
