"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CapabilityRadarChart } from "@/components/agent-kyle/charts/CapabilityRadarChart";
import { ConfidenceGauge } from "@/components/agent-kyle/charts/ConfidenceGauge";
import { EvidenceHeatmap } from "@/components/agent-kyle/charts/EvidenceHeatmap";
import { FitBreakdownBar } from "@/components/agent-kyle/charts/FitBreakdownBar";
import {
  agentStatusResponseSchema,
  opportunityFitResponseSchema,
  signalScorecardResponseSchema,
  type AgentKyleTab,
  type AgentStatusResponse,
  type OpportunityFitResponse,
  type SignalScorecardResponse
} from "@/lib/agent-kyle/types";

interface AgentKylePanelProps {
  open: boolean;
  initialTab?: AgentKyleTab;
  onClose: () => void;
}

interface ScorecardRequestContext {
  role?: string;
  industry?: string;
  prioritySkills: string[];
}

const defaultStatus: AgentStatusResponse = {
  available: false,
  reason: "rate_limited",
  usageWindow: {
    remainingInWindow: 0,
    sessionRemaining: 0,
    remainingTokens: 0,
    resetAt: new Date().toISOString()
  }
};

function statusLabel(status: AgentStatusResponse): string {
  if (status.available) return "Online";
  if (status.reason === "cooldown") return "Cooling Down";
  if (status.reason === "daily_budget_exceeded") return "Out Of Service";
  if (status.reason === "missing_api_key") return "Misconfigured";
  if (status.reason === "disabled") return "Disabled";
  return "Rate Limited";
}

function toLocalTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function parsePrioritySkills(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ).slice(0, 12);
}

function labelSourceType(value: string): string {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}

export function AgentKylePanel({ open, initialTab = "scorecard", onClose }: AgentKylePanelProps) {
  const [tab, setTab] = useState<AgentKyleTab>(initialTab);
  const [status, setStatus] = useState<AgentStatusResponse>(defaultStatus);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [role, setRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [prioritySkills, setPrioritySkills] = useState("");
  const [scorecardLoading, setScorecardLoading] = useState(false);
  const [scorecardError, setScorecardError] = useState<string | null>(null);
  const [scorecardResult, setScorecardResult] = useState<SignalScorecardResponse | null>(null);
  const [scorecardContext, setScorecardContext] = useState<ScorecardRequestContext | null>(null);

  const [jobDescription, setJobDescription] = useState("");
  const [fitLoading, setFitLoading] = useState(false);
  const [fitError, setFitError] = useState<string | null>(null);
  const [fitResult, setFitResult] = useState<OpportunityFitResponse | null>(null);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
  }, [initialTab, open]);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const refreshStatus = useCallback(async () => {
    if (!open) return;
    setStatusLoading(true);
    setStatusError(null);

    try {
      const response = await fetch("/api/agent-kyle/status", {
        method: "GET",
        cache: "no-store"
      });
      const payload = await response.json();
      const parsed = agentStatusResponseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error("Unexpected status payload");
      }
      setStatus(parsed.data);
    } catch {
      setStatus(defaultStatus);
      setStatusError("Unable to load Agent Kyle status.");
    } finally {
      setStatusLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    refreshStatus();
    const interval = window.setInterval(refreshStatus, 30000);
    return () => window.clearInterval(interval);
  }, [open, refreshStatus]);

  async function submitScorecard(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setScorecardError(null);

    if (!status.available) {
      setScorecardError("Agent Kyle is currently unavailable.");
      return;
    }

    setScorecardLoading(true);
    try {
      const parsedPrioritySkills = parsePrioritySkills(prioritySkills);
      const payload = {
        role: role.trim() || undefined,
        industry: industry.trim() || undefined,
        prioritySkills: parsedPrioritySkills
      };

      const response = await fetch("/api/agent-kyle/signal-scorecard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      if (!response.ok) {
        const parsedStatus = agentStatusResponseSchema.safeParse(json);
        if (parsedStatus.success) {
          setStatus(parsedStatus.data);
        }
        throw new Error("Signal Scorecard request failed");
      }

      const parsed = signalScorecardResponseSchema.safeParse(json);
      if (!parsed.success) {
        throw new Error("Invalid scorecard response");
      }

      setScorecardResult(parsed.data);
      setScorecardContext({
        role: payload.role,
        industry: payload.industry,
        prioritySkills: parsedPrioritySkills
      });
      refreshStatus();
    } catch {
      setScorecardError("Signal Scorecard is temporarily unavailable. Try again in a moment.");
    } finally {
      setScorecardLoading(false);
    }
  }

  function resetScorecard() {
    setRole("");
    setIndustry("");
    setPrioritySkills("");
    setScorecardError(null);
    setScorecardResult(null);
    setScorecardContext(null);
  }

  function resetOpportunityFit() {
    setJobDescription("");
    setFitError(null);
    setFitResult(null);
  }

  async function submitFit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFitError(null);

    if (!status.available) {
      setFitError("Agent Kyle is currently unavailable.");
      return;
    }

    if (jobDescription.trim().length < 40) {
      setFitError("Paste at least 40 characters from a job description.");
      return;
    }

    setFitLoading(true);
    try {
      const response = await fetch("/api/agent-kyle/opportunity-fit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          jobDescription
        })
      });

      const json = await response.json();
      if (!response.ok) {
        const parsedStatus = agentStatusResponseSchema.safeParse(json);
        if (parsedStatus.success) {
          setStatus(parsedStatus.data);
        }
        throw new Error("Opportunity Fit request failed");
      }

      const parsed = opportunityFitResponseSchema.safeParse(json);
      if (!parsed.success) {
        throw new Error("Invalid fit response");
      }

      setFitResult(parsed.data);
      refreshStatus();
    } catch {
      setFitError("Opportunity Fit is temporarily unavailable. Try again in a moment.");
    } finally {
      setFitLoading(false);
    }
  }

  const remainingLabel = useMemo(() => {
    if (!status.usageWindow) return "";
    return `${status.usageWindow.remainingInWindow} req / 10m · ${status.usageWindow.sessionRemaining} req left today · ${status.usageWindow.remainingTokens} tokens left`;
  }, [status]);

  const scorecardInsights = useMemo(() => {
    if (!scorecardResult) return null;

    const rankedSkills = [...scorecardResult.capabilityRadar].sort((a, b) => b.score - a.score);
    const topSkill = rankedSkills[0];
    const avgSkillScore = Math.round(
      rankedSkills.reduce((total, item) => total + item.score, 0) / Math.max(1, rankedSkills.length)
    );
    const projectCoverage = new Set(scorecardResult.heatmap.map((item) => item.projectSlug)).size;
    const skillCoverage = new Set(scorecardResult.heatmap.map((item) => item.skill)).size;
    const focusSkills = scorecardContext?.prioritySkills.length
      ? scorecardContext.prioritySkills.slice(0, 6)
      : rankedSkills.slice(0, 6).map((item) => item.skill);

    return {
      avgSkillScore,
      topSkillLabel: topSkill?.skill || "N/A",
      topSkillScore: Math.round(topSkill?.score || 0),
      evidenceCount: scorecardResult.evidence.length,
      projectCoverage,
      skillCoverage,
      focusSkills
    };
  }, [scorecardContext, scorecardResult]);

  if (!open) {
    return null;
  }

  return (
    <section
      id="agent-kyle-dock-panel"
      role="region"
      aria-label="Agent Kyle Mission Control"
      className="flex h-full w-full flex-col overflow-hidden bg-surface-2"
    >
      <header className="border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Agent Kyle</p>
            <h2 className="text-xl font-semibold">Mission Control</h2>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs ${
                status.available
                  ? "border-border-accent bg-surface-3 text-link-hover"
                  : "border-border bg-surface-3 text-muted"
              }`}
            >
              {statusLoading ? "Checking..." : statusLabel(status)}
            </span>
            <button
              type="button"
              className="inline-flex h-7 w-7 pb-0.5 items-center justify-center rounded-full border border-border bg-surface-3 text-muted transition hover:border-border-accent hover:text-link-hover"
              aria-label="Close Agent Kyle"
              onClick={onClose}
            >
              <span aria-hidden="true" className="text-lg leading-none">
                ×
              </span>
            </button>
          </div>
        </div>

        <p className="mt-2 text-xs text-faint">{remainingLabel}</p>
        {status.retryAfterSec ? (
          <p className="mt-1 text-xs text-muted">Retry in about {status.retryAfterSec} seconds.</p>
        ) : null}
        {statusError ? <p className="mt-1 text-xs text-muted">{statusError}</p> : null}
      </header>

      <div className="border-b border-border px-4 py-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-full border px-3 py-1 text-sm ${
              tab === "scorecard" ? "border-border-accent bg-surface-3 text-link-hover" : "border-border text-muted"
            }`}
            onClick={() => setTab("scorecard")}
          >
            Signal Scorecard
          </button>
          <button
            type="button"
            className={`rounded-full border px-3 py-1 text-sm ${
              tab === "fit" ? "border-border-accent bg-surface-3 text-link-hover" : "border-border text-muted"
            }`}
            onClick={() => setTab("fit")}
          >
            Opportunity Fit Matcher
          </button>
        </div>
        {tab === "scorecard" ? (
          <div className="mt-2 rounded-lg border border-border bg-surface-1 px-3 py-2">
            <p className="text-[0.65rem] uppercase tracking-[0.14em] text-faint">Why Use Signal Scorecard</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Recruiters, hiring managers, founders, and collaborators can use this for a fast, evidence-backed read on how my strengths map to a target role and business context.
            </p>
            <ul className="mt-2 space-y-1 text-xs text-muted">
              <li>
                <span className="text-fg">What you learn:</span> Whether my strongest capabilities align with the priorities that matter most for your team.
              </li>
              <li>
                <span className="text-fg">Why it is credible:</span> Every signal is tied to concrete portfolio evidence, not generic claims.
              </li>
              <li>
                <span className="text-fg">Best time to use it:</span> Early screening, interview prep, or evaluating fit for startup/founding-stage scope.
              </li>
            </ul>
          </div>
        ) : null}

        {tab === "fit" ? (
          <div className="mt-2 rounded-lg border border-border bg-surface-1 px-3 py-2">
            <p className="text-[0.65rem] uppercase tracking-[0.14em] text-faint">Why Use Opportunity Fit Matcher</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Use this when you have a specific role in mind and want a practical view of fit against the actual requirements.
            </p>
            <ul className="mt-2 space-y-1 text-xs text-muted">
              <li>
                <span className="text-fg">What you learn:</span> A direct fit read with confidence for that exact role, not a generic career summary.
              </li>
              <li>
                <span className="text-fg">Why it is actionable:</span> It surfaces matched evidence, clear gaps, and targeted next steps in one view.
              </li>
              <li>
                <span className="text-fg">Best time to use it:</span> Hiring calibration, interview planning, or deciding if now is the right time to engage.
              </li>
            </ul>
          </div>
        ) : null}
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-4 py-4">
        {tab === "scorecard" ? (
          <div className="min-w-0 space-y-4">
            <form className="card-base grid gap-3 md:grid-cols-3" onSubmit={submitScorecard}>
              <label className="text-sm text-muted">
                Role focus
                <input
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  placeholder="Analytics Engineering Manager"
                  className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-fg"
                />
              </label>
              <label className="text-sm text-muted">
                Industry focus
                <input
                  value={industry}
                  onChange={(event) => setIndustry(event.target.value)}
                  placeholder="Healthcare, Fintech"
                  className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-fg"
                />
              </label>
              <label className="text-sm text-muted">
                Priority skills (comma-separated)
                <input
                  value={prioritySkills}
                  onChange={(event) => setPrioritySkills(event.target.value)}
                  placeholder="dbt, orchestration, llm"
                  className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-fg"
                />
              </label>

              <div className="md:col-span-3">
                <div className="flex items-center gap-2">
                  <button type="submit" className="btn-primary" disabled={scorecardLoading || !status.available}>
                    {scorecardLoading ? "Generating scorecard..." : "Generate Signal Scorecard"}
                  </button>
                  {scorecardResult ? (
                    <button
                      type="button"
                      onClick={resetScorecard}
                      aria-label="Reset scorecard"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-2 text-muted transition hover:border-border-accent hover:bg-surface-3 hover:text-link-hover"
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M3 12a9 9 0 1 0 3-6.7" />
                        <path d="M3 4v5h5" />
                      </svg>
                    </button>
                  ) : null}
                </div>
              </div>
            </form>

            {scorecardError ? <p className="text-sm text-muted">{scorecardError}</p> : null}

            {scorecardResult ? (
              <div className="space-y-4">
                <article className="card-base overflow-hidden p-0">
                  <div className="bg-[radial-gradient(circle_at_82%_18%,color-mix(in_srgb,var(--c-link-hover)_16%,transparent)_0%,transparent_42%)] p-5 md:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="eyebrow">Signal Scorecard</p>
                      </div>
                      <span className="tag-chip">Evidence-grounded narrative</span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {scorecardContext?.role ? (
                        <span className="tag-chip break-words">Role: {scorecardContext.role}</span>
                      ) : null}
                      {scorecardContext?.industry ? (
                        <span className="tag-chip break-words">Industry: {scorecardContext.industry}</span>
                      ) : null}
                      {scorecardInsights?.focusSkills.map((skill) => (
                        <span key={skill} className="tag-chip">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <p className="mt-4 max-w-4xl whitespace-pre-line break-words text-sm leading-7 text-muted">
                      {scorecardResult.summary}
                    </p>

                    <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-lg border border-border bg-surface-1 px-3 py-2">
                        <p className="text-[0.64rem] uppercase tracking-[0.12em] text-faint">Top Skill</p>
                        <p className="mt-1 text-sm font-semibold text-fg">{scorecardInsights?.topSkillLabel}</p>
                        <p className="text-xs text-muted">{scorecardInsights?.topSkillScore}% signal</p>
                      </div>
                      <div className="rounded-lg border border-border bg-surface-1 px-3 py-2">
                        <p className="text-[0.64rem] uppercase tracking-[0.12em] text-faint">Average Skill Score</p>
                        <p className="mt-1 text-sm font-semibold text-fg">{scorecardInsights?.avgSkillScore}%</p>
                        <p className="text-xs text-muted">Across radar dimensions</p>
                      </div>
                      <div className="rounded-lg border border-border bg-surface-1 px-3 py-2">
                        <p className="text-[0.64rem] uppercase tracking-[0.12em] text-faint">Project Coverage</p>
                        <p className="mt-1 text-sm font-semibold text-fg">{scorecardInsights?.projectCoverage} projects</p>
                        <p className="text-xs text-muted">{scorecardInsights?.skillCoverage} mapped skills</p>
                      </div>
                      <div className="rounded-lg border border-border bg-surface-1 px-3 py-2">
                        <p className="text-[0.64rem] uppercase tracking-[0.12em] text-faint">Evidence Inputs</p>
                        <p className="mt-1 text-sm font-semibold text-fg">{scorecardInsights?.evidenceCount} links</p>
                        <p className="text-xs text-muted">Ranked supporting artifacts</p>
                      </div>
                    </div>

                    <p className="mt-4 text-xs text-faint">
                      Generated {toLocalTimestamp(scorecardResult.generatedAt)} · Model {scorecardResult.model}
                    </p>
                  </div>
                </article>

                <div className="grid gap-4 lg:grid-cols-2">
                  <article className="card-base min-w-0">
                    <div className="mb-3">
                      <h3 className="text-base font-semibold">Capability Radar</h3>
                      <p className="text-xs text-faint">Confidence-weighted capability profile against focus skills.</p>
                    </div>
                    <CapabilityRadarChart data={scorecardResult.capabilityRadar} />
                  </article>
                  <article className="card-base min-w-0">
                    <div className="mb-3">
                      <h3 className="text-base font-semibold">Project Evidence Strength</h3>
                      <p className="text-xs text-faint">Relative coverage by project, with top-skill context.</p>
                    </div>
                    <EvidenceHeatmap data={scorecardResult.heatmap} />
                  </article>
                </div>

                <article className="card-base">
                  <h3 className="text-sm font-semibold">Evidence Links</h3>
                  <ul className="mt-3 grid gap-2 md:grid-cols-2">
                    {scorecardResult.evidence.map((item: SignalScorecardResponse["evidence"][number]) => (
                      <li key={item.id} className="min-w-0 rounded-lg border border-border bg-surface-1 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 break-words text-sm font-medium text-fg">{item.title}</p>
                          <span className="tag-chip shrink-0 px-2 py-0.5 text-[0.62rem] tracking-[0.06em]">
                            {labelSourceType(item.sourceType)}
                          </span>
                        </div>
                        <p className="mt-1 break-words text-xs text-muted">{item.snippet}</p>
                        <a
                          href={item.url}
                          className="mt-2 inline-flex text-xs text-link hover:text-link-hover"
                          target={item.url.startsWith("http") ? "_blank" : undefined}
                          rel={item.url.startsWith("http") ? "noreferrer" : undefined}
                        >
                          Open evidence
                        </a>
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="min-w-0 space-y-4">
            <form className="card-base space-y-3" onSubmit={submitFit}>
              <label className="text-sm text-muted">
                Job description
                <textarea
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  rows={7}
                  placeholder="Paste the job description here..."
                  className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-fg"
                />
              </label>

              <div className="flex items-center gap-2">
                <button type="submit" className="btn-primary" disabled={fitLoading || !status.available}>
                  {fitLoading ? "Scoring opportunity..." : "Run Opportunity Fit Matcher"}
                </button>
                {fitResult ? (
                  <button
                    type="button"
                    onClick={resetOpportunityFit}
                    aria-label="Reset opportunity fit matcher"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-2 text-muted transition hover:border-border-accent hover:bg-surface-3 hover:text-link-hover"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 12a9 9 0 1 0 3-6.7" />
                      <path d="M3 4v5h5" />
                    </svg>
                  </button>
                ) : null}
              </div>
            </form>

            {fitError ? <p className="text-sm text-muted">{fitError}</p> : null}

            {fitResult ? (
              <div className="min-w-0 space-y-4">
                <article className="card-base w-full max-w-full overflow-hidden p-0">
                  <div className="bg-[radial-gradient(circle_at_84%_18%,color-mix(in_srgb,var(--c-link-hover)_18%,transparent)_0%,transparent_42%)] p-5 md:p-6">
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                          <p className="eyebrow">Fit score</p>
                          <span className="tag-chip px-2 py-0.5 text-[0.62rem] tracking-[0.06em] md:px-[0.65rem] md:py-[0.2rem] md:text-[0.75rem] md:tracking-[0.08em]">
                            {fitResult.fitScore >= 85 ? "Strong match" : fitResult.fitScore >= 70 ? "Viable match" : "Needs work"}
                          </span>
                          <span className="tag-chip px-2 py-0.5 text-[0.62rem] tracking-[0.06em] md:px-[0.65rem] md:py-[0.2rem] md:text-[0.75rem] md:tracking-[0.08em]">
                            {fitResult.matchingEvidence.length} evidence matches
                          </span>
                        </div>
                        <p className="mt-2 text-center text-6xl font-display font-semibold leading-none text-fg lg:text-left">
                          {fitResult.fitScore}
                        </p>
                        <p className="mt-4 max-w-3xl break-words text-sm leading-6 text-muted">{fitResult.rationale}</p>
                      </div>
                      <div className="rounded-2xl border border-border bg-surface-1 px-4 py-3">
                        <ConfidenceGauge confidence={fitResult.confidence} />
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <p className="max-w-full break-words rounded-full border border-border bg-surface-1 px-3 py-1 text-xs text-faint">
                        Generated {toLocalTimestamp(fitResult.generatedAt)}
                      </p>
                      <p className="max-w-full break-words rounded-full border border-border bg-surface-1 px-3 py-1 text-xs text-faint">
                        Model {fitResult.model}
                      </p>
                    </div>
                  </div>
                </article>

                <article className="card-base">
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold">Fit Breakdown</h3>
                      <p className="text-xs text-faint">All metrics are normalized on a 0-100 scale.</p>
                    </div>
                    <span className="tag-chip">At-a-glance comparison</span>
                  </div>
                  <FitBreakdownBar
                    fitScore={fitResult.fitScore}
                    confidence={fitResult.confidence}
                    evidenceCount={fitResult.matchingEvidence.length}
                  />
                </article>

                <article className="card-base">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold">Matching Evidence</h3>
                    <span className="tag-chip">{fitResult.matchingEvidence.length} items</span>
                  </div>
                  <ul className="mt-4 grid w-full min-w-0 gap-3 md:grid-cols-2">
                    {fitResult.matchingEvidence.map((item: OpportunityFitResponse["matchingEvidence"][number]) => (
                      <li key={item.evidenceId} className="min-w-0 rounded-xl border border-border bg-surface-1 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 break-words text-sm font-semibold text-fg">{item.title}</p>
                          <span className="tag-chip shrink-0 whitespace-nowrap px-2 py-0.5 text-[0.62rem] tracking-[0.06em] md:px-[0.55rem] md:text-[0.7rem] md:tracking-[0.08em]">
                            Relevance {item.relevance}%
                          </span>
                        </div>
                        <p className="mt-2 break-words text-sm leading-6 text-muted">{item.reason}</p>

                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,var(--c-accent-700),var(--c-link-hover))]"
                            style={{ width: `${Math.max(8, Math.min(100, Math.round(item.relevance)))}%` }}
                          />
                        </div>

                        <a
                          href={item.url}
                          className="mt-3 inline-flex text-xs text-link hover:text-link-hover"
                          target={item.url.startsWith("http") ? "_blank" : undefined}
                          rel={item.url.startsWith("http") ? "noreferrer" : undefined}
                        >
                          Open evidence
                        </a>
                      </li>
                    ))}
                  </ul>
                </article>

                <div className="grid gap-4 md:grid-cols-2">
                  <article className="card-base">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-semibold">Gaps</h3>
                      <span className="tag-chip">{fitResult.gaps.length}</span>
                    </div>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
                      {fitResult.gaps.length > 0 ? (
                        fitResult.gaps.map((gap: string) => (
                          <li key={gap} className="break-words">
                            {gap}
                          </li>
                        ))
                      ) : (
                        <li>No major gaps identified.</li>
                      )}
                    </ul>
                  </article>
                  <article className="card-base">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-semibold">Recommendations</h3>
                      <span className="tag-chip">{fitResult.recommendations.length}</span>
                    </div>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
                      {fitResult.recommendations.map((recommendation: string) => (
                        <li key={recommendation} className="break-words">
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </article>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
