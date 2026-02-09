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
      const payload = {
        role: role.trim() || undefined,
        industry: industry.trim() || undefined,
        prioritySkills: prioritySkills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
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
      refreshStatus();
    } catch {
      setScorecardError("Signal Scorecard is temporarily unavailable. Try again in a moment.");
    } finally {
      setScorecardLoading(false);
    }
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

          <span
            className={`rounded-full border px-3 py-1 text-xs ${
              status.available
                ? "border-border-accent bg-surface-3 text-link-hover"
                : "border-border bg-surface-3 text-muted"
            }`}
          >
            {statusLoading ? "Checking..." : statusLabel(status)}
          </span>
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
      </div>

      <div className="flex-1 overflow-auto px-4 py-4">
        {tab === "scorecard" ? (
          <div className="space-y-4">
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
                <button type="submit" className="btn-primary" disabled={scorecardLoading || !status.available}>
                  {scorecardLoading ? "Generating scorecard..." : "Generate Signal Scorecard"}
                </button>
              </div>
            </form>

            {scorecardError ? <p className="text-sm text-muted">{scorecardError}</p> : null}

            {scorecardResult ? (
              <div className="space-y-4">
                <article className="card-base">
                  <p className="text-sm text-muted">{scorecardResult.summary}</p>
                  <p className="mt-2 text-xs text-faint">
                    Generated {toLocalTimestamp(scorecardResult.generatedAt)} · Model {scorecardResult.model}
                  </p>
                </article>

                <div className="grid gap-4 xl:grid-cols-2">
                  <article className="card-base">
                    <h3 className="text-sm font-semibold">Capability Radar</h3>
                    <CapabilityRadarChart data={scorecardResult.capabilityRadar} />
                  </article>
                  <article className="card-base">
                    <h3 className="text-sm font-semibold">Skill-Project Evidence Matrix</h3>
                    <EvidenceHeatmap data={scorecardResult.heatmap} />
                  </article>
                </div>

                <article className="card-base">
                  <h3 className="text-sm font-semibold">Evidence Links</h3>
                  <ul className="mt-3 grid gap-2 md:grid-cols-2">
                    {scorecardResult.evidence.map((item: SignalScorecardResponse["evidence"][number]) => (
                      <li key={item.id} className="rounded-lg border border-border bg-surface-1 p-3">
                        <p className="text-sm font-medium text-fg">{item.title}</p>
                        <p className="mt-1 text-xs text-muted">{item.snippet}</p>
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
          <div className="space-y-4">
            <form className="card-base space-y-3" onSubmit={submitFit}>
              <label className="text-sm text-muted">
                Paste job description
                <textarea
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  rows={7}
                  placeholder="Paste the role description here..."
                  className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-fg"
                />
              </label>

              <button type="submit" className="btn-primary" disabled={fitLoading || !status.available}>
                {fitLoading ? "Scoring opportunity..." : "Run Opportunity Fit Matcher"}
              </button>
            </form>

            {fitError ? <p className="text-sm text-muted">{fitError}</p> : null}

            {fitResult ? (
              <div className="space-y-4">
                <article className="card-base">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="eyebrow">Fit score</p>
                      <p className="mt-1 text-5xl font-display font-semibold">{fitResult.fitScore}</p>
                    </div>
                    <div className="w-52">
                      <ConfidenceGauge confidence={fitResult.confidence} />
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted">{fitResult.rationale}</p>
                  <p className="mt-2 text-xs text-faint">
                    Generated {toLocalTimestamp(fitResult.generatedAt)} · Model {fitResult.model}
                  </p>
                </article>

                <article className="card-base">
                  <h3 className="text-sm font-semibold">Fit Breakdown</h3>
                  <FitBreakdownBar
                    fitScore={fitResult.fitScore}
                    confidence={fitResult.confidence}
                    evidenceCount={fitResult.matchingEvidence.length}
                  />
                </article>

                <article className="card-base">
                  <h3 className="text-sm font-semibold">Matching Evidence</h3>
                  <ul className="mt-3 grid gap-2 md:grid-cols-2">
                    {fitResult.matchingEvidence.map((item: OpportunityFitResponse["matchingEvidence"][number]) => (
                      <li key={item.evidenceId} className="rounded-lg border border-border bg-surface-1 p-3">
                        <p className="text-sm font-medium text-fg">{item.title}</p>
                        <p className="mt-1 text-xs text-muted">{item.reason}</p>
                        <p className="mt-1 text-xs text-faint">Relevance: {item.relevance}</p>
                        <a href={item.url} className="mt-2 inline-flex text-xs text-link hover:text-link-hover">
                          Open evidence
                        </a>
                      </li>
                    ))}
                  </ul>
                </article>

                <div className="grid gap-4 md:grid-cols-2">
                  <article className="card-base">
                    <h3 className="text-sm font-semibold">Gaps</h3>
                    <ul className="mt-2 space-y-2 text-sm text-muted">
                      {fitResult.gaps.length > 0 ? (
                        fitResult.gaps.map((gap: string) => <li key={gap}>- {gap}</li>)
                      ) : (
                        <li>- No major gaps identified.</li>
                      )}
                    </ul>
                  </article>
                  <article className="card-base">
                    <h3 className="text-sm font-semibold">Recommendations</h3>
                    <ul className="mt-2 space-y-2 text-sm text-muted">
                      {fitResult.recommendations.map((recommendation: string) => (
                        <li key={recommendation}>- {recommendation}</li>
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
