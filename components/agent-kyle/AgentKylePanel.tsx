"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  agentChatResponseSchema,
  agentStatusResponseSchema,
  type AgentChatResponse,
  type AgentStatusResponse
} from "@/lib/agent-kyle/types";
import styles from "./AgentKylePanel.module.css";

interface AgentKylePanelProps {
  open: boolean;
  seedQuestion?: string;
  onClose: () => void;
}

interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  result?: AgentChatResponse;
}

const RECOMMENDED_QUESTIONS = [
  "What roles is Kyle best suited for?",
  "Show me Kyle's strongest data engineering work.",
  "How does Kyle use AI in real projects?",
  "Walk me through Kyle's career progression."
];

const WELCOME_TURN: ChatTurn = {
  id: "welcome",
  role: "assistant",
  content:
    "I can help you explore Kyle's experience, technical work, and current interests. I answer from his public site, resume and LinkedIn context, and GitHub-backed project evidence."
};

const DEFAULT_STATUS: AgentStatusResponse = {
  available: false,
  reason: "rate_limited",
  usageWindow: {
    remainingInWindow: 0,
    sessionRemaining: 0,
    windowLimit: 8,
    sessionLimit: 20,
    remainingTokens: 0,
    resetAt: new Date().toISOString()
  }
};

function statusText(status: AgentStatusResponse, loading: boolean): string {
  if (loading) return "Connecting";
  if (status.available) return "Ready";
  if (status.reason === "cooldown") return "Cooling down";
  if (status.reason === "daily_budget_exceeded") return "Daily limit reached";
  if (status.reason === "missing_api_key") return "Offline";
  return "Unavailable";
}

function allowanceError(status: AgentStatusResponse): string {
  if (status.usageWindow.sessionRemaining === 0) {
    return `You've used all ${status.usageWindow.sessionLimit} Agent Kyle turns for this 24-hour session.`;
  }

  if (status.reason === "cooldown" || status.usageWindow.remainingInWindow === 0) {
    const retry = status.retryAfterSec ? ` Try again in about ${status.retryAfterSec} seconds.` : "";
    return `You've reached the short-term limit of ${status.usageWindow.windowLimit} turns per 10 minutes.${retry}`;
  }

  if (status.reason === "daily_budget_exceeded") {
    return "Agent Kyle has reached its shared daily AI budget. Please try again later.";
  }

  return "Agent Kyle is unavailable right now. The public resume, projects, GitHub, and LinkedIn links are still available.";
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M4 10h11M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AgentKylePanel({ open, seedQuestion, onClose }: AgentKylePanelProps) {
  const [turns, setTurns] = useState<ChatTurn[]>([WELCOME_TURN]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<AgentStatusResponse>(DEFAULT_STATUS);
  const [statusLoading, setStatusLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStarter, setSelectedStarter] = useState<string | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLTextAreaElement>(null);
  const submissionPendingRef = useRef(false);
  const submittedSeedRef = useRef<string | null>(null);
  const askQuestionRef = useRef<(question: string) => Promise<void>>(async () => {});

  const refreshStatus = useCallback(async (showLoading = true) => {
    if (showLoading) setStatusLoading(true);
    try {
      const response = await fetch("/api/agent-kyle/status", { cache: "no-store" });
      const json = await response.json();
      const parsed = agentStatusResponseSchema.safeParse(json);
      if (!parsed.success) throw new Error("Unexpected status response");
      setStatus(parsed.data);
      return parsed.data;
    } catch {
      setStatus(DEFAULT_STATUS);
      return DEFAULT_STATUS;
    } finally {
      if (showLoading) setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    refreshStatus();
    const interval = window.setInterval(refreshStatus, 30000);
    return () => window.clearInterval(interval);
  }, [open, refreshStatus]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousOverscrollBehavior = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscrollBehavior;
    };
  }, [open]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const updateViewport = () => setIsMobileViewport(media.matches);

    updateViewport();
    media.addEventListener("change", updateViewport);
    return () => media.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (seedQuestion) setDraft(seedQuestion);

    if (!window.matchMedia("(min-width: 768px)").matches) return;
    const focusTimer = window.setTimeout(() => desktopInputRef.current?.focus(), 180);
    return () => window.clearTimeout(focusTimer);
  }, [open, seedQuestion]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: turns.length > 2 ? "smooth" : "auto"
    });
  }, [sending, turns]);

  const requestMessages = useMemo(
    () =>
      turns
        .filter((turn) => turn.id !== "welcome")
        .map((turn) => ({ role: turn.role, content: turn.content }))
        .slice(-9),
    [turns]
  );

  async function askQuestion(question: string) {
    const content = question.trim();
    if (!content || sending || submissionPendingRef.current) return;
    submissionPendingRef.current = true;
    setSending(true);

    const currentStatus = statusLoading ? await refreshStatus() : status;
    if (!currentStatus.available) {
      submissionPendingRef.current = false;
      setSending(false);
      setError(allowanceError(currentStatus));
      return;
    }

    const userTurn: ChatTurn = {
      id: `user-${Date.now()}`,
      role: "user",
      content
    };

    setTurns((current) => [...current, userTurn]);
    setDraft("");
    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/agent-kyle/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...requestMessages, { role: "user", content }],
          pagePath: window.location.pathname + window.location.hash
        })
      });
      const json = await response.json();

      if (!response.ok) {
        const parsedStatus = agentStatusResponseSchema.safeParse(json);
        if (parsedStatus.success) {
          setStatus(parsedStatus.data);
          setError(allowanceError(parsedStatus.data));
          return;
        }
        throw new Error("Chat request failed");
      }

      const parsed = agentChatResponseSchema.safeParse(json);
      if (!parsed.success) throw new Error("Unexpected chat response");

      setTurns((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: parsed.data.answer,
          result: parsed.data
        }
      ]);
      refreshStatus(false);
    } catch {
      setError("I couldn't answer that just now. Try again in a moment or use one of the public links below.");
    } finally {
      submissionPendingRef.current = false;
      setSending(false);
    }
  }

  askQuestionRef.current = askQuestion;

  useEffect(() => {
    if (!open) {
      submittedSeedRef.current = null;
      return;
    }

    const seed = seedQuestion?.trim();
    if (!seed || submittedSeedRef.current === seed) return;

    submittedSeedRef.current = seed;
    setDraft("");
    void askQuestionRef.current(seed);
  }, [open, seedQuestion]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    askQuestion(draft);
  }

  function chooseStarter(question: string) {
    if (selectedStarter) return;
    setSelectedStarter(question);
    void askQuestion(question);
    window.setTimeout(() => setSelectedStarter(null), 180);
  }

  function resetConversation() {
    setTurns([WELCOME_TURN]);
    setDraft("");
    setError(null);
    setSelectedStarter(null);
    window.setTimeout(
      () => (isMobileViewport ? mobileInputRef.current : desktopInputRef.current)?.focus(),
      0
    );
  }

  if (!open) return null;

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-label="Chat with Agent Kyle"
      className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[1.4rem] border border-border-strong bg-surface-1 shadow-panel md:rounded-b-none md:rounded-t-[1.4rem]"
    >
      <header className="relative z-20 flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface-1 px-4 py-2.5 md:gap-4 md:px-5 md:py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border-accent bg-surface-3 text-xs font-semibold text-link-hover md:h-10 md:w-10 md:rounded-xl md:text-sm">
            AK
            <span
              className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-surface-1 ${
                status.available ? "bg-emerald-400" : "bg-faint"
              }`}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-base font-semibold text-fg">Agent Kyle</h2>
              <span className="hidden rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.12em] text-faint sm:inline">
                {statusText(status, statusLoading)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {turns.length > 1 ? (
            <button
              type="button"
              onClick={resetConversation}
              className="hidden rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-border-accent hover:text-link-hover sm:inline-flex"
            >
              New chat
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Agent Kyle"
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface-2 text-muted transition hover:border-border-accent hover:text-link-hover md:h-8 md:w-8"
          >
            <span aria-hidden="true" className="text-lg leading-none">×</span>
          </button>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="relative z-10 min-h-0 flex-1 overscroll-contain overflow-y-auto bg-surface-1 px-4 py-4 [scrollbar-gutter:stable] md:px-6 md:py-5"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
          {turns.map((turn) => {
            const isLatestAssistant =
              turn.role === "assistant" &&
              turn.id !== WELCOME_TURN.id &&
              turn.id === turns[turns.length - 1]?.id;

            return (
              <div
                key={turn.id}
                className={`${turn.role === "assistant" ? styles.assistantTurn : styles.userTurn} ${
                  isLatestAssistant ? styles.latestAssistant : ""
                } ${
                  turn.role === "user" ? "ml-auto max-w-[88%] md:max-w-[76%]" : "mr-auto w-full max-w-[94%]"
                }`}
              >
                <div
                  className={
                    turn.role === "user"
                      ? "rounded-2xl rounded-br-md border border-border-accent bg-surface-3 px-4 py-3 text-sm leading-6 text-fg"
                      : "text-sm leading-7 text-muted"
                  }
                >
                  {turn.role === "assistant" ? (
                    <p className="mb-1 text-[0.65rem] uppercase tracking-[0.16em] text-faint">Agent Kyle</p>
                  ) : null}
                  <p className="whitespace-pre-line">{turn.content}</p>
                </div>

                {turn.result?.actions.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {turn.result.actions.map((action) => (
                      <a
                        key={`${turn.id}-${action.url}`}
                        href={action.url}
                        target={action.url.startsWith("http") ? "_blank" : undefined}
                        rel={action.url.startsWith("http") ? "noreferrer" : undefined}
                        title={action.description}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-link transition hover:border-border-accent hover:bg-surface-3 hover:text-link-hover"
                      >
                        {action.label}
                        <span className="h-3.5 w-3.5"><ArrowIcon /></span>
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}

          {turns.length === 1 || selectedStarter ? (
            <div className={`${styles.starterTray} ${selectedStarter ? styles.starterTrayLeaving : ""}`}>
              <div className="grid gap-2 sm:grid-cols-2">
                {RECOMMENDED_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => chooseStarter(question)}
                    disabled={sending || selectedStarter !== null}
                    aria-pressed={selectedStarter === question}
                    className={`${selectedStarter === question ? styles.starterSelected : ""} group flex min-h-[4.6rem] items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 p-3 text-left text-sm text-muted transition hover:border-border-accent hover:bg-surface-3 hover:text-fg disabled:cursor-not-allowed disabled:opacity-55`}
                  >
                    <span>{question}</span>
                    <span className="h-4 w-4 shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:text-link-hover">
                      <ArrowIcon />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {sending ? (
            <div className={`${styles.loadingState} flex items-center gap-2 text-xs text-faint`} role="status">
              <span className="flex items-center gap-1" aria-hidden="true">
                <span className={`${styles.loadingDot} h-1.5 w-1.5 rounded-full bg-link`} />
                <span className={`${styles.loadingDot} h-1.5 w-1.5 rounded-full bg-link`} />
                <span className={`${styles.loadingDot} h-1.5 w-1.5 rounded-full bg-link`} />
              </span>
              Reading Kyle's public evidence...
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-muted">
              {error}
              <div className="mt-2 flex gap-3 text-xs">
                <a href="/resume">Resume</a>
                <a href="/projects">Projects</a>
                <a href="https://github.com/kspringfield13" target="_blank" rel="noreferrer">GitHub</a>
                <a href="https://www.linkedin.com/in/kylespringfield" target="_blank" rel="noreferrer">LinkedIn</a>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <footer className="relative z-20 min-w-0 shrink-0 border-t border-border bg-surface-2 py-2.5 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] md:px-5 md:py-3">
        <form onSubmit={submit} className="mx-auto w-full min-w-0 max-w-3xl">
          <div className="mb-2.5" aria-label={`${status.usageWindow.sessionRemaining} Agent Kyle turns remaining`}>
            <div className="flex items-center justify-between gap-3 text-[0.65rem] text-faint">
              <span className="uppercase tracking-[0.12em]">Turn allowance</span>
              {statusLoading ? (
                <span>Checking allowance...</span>
              ) : (
                <span>
                  <strong className="font-medium text-muted">{status.usageWindow.sessionRemaining}</strong>
                  {" / "}
                  {status.usageWindow.sessionLimit} remaining
                </span>
              )}
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--c-accent-700),var(--c-link-hover))] transition-[width] duration-300"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(
                      100,
                      (status.usageWindow.sessionRemaining / Math.max(1, status.usageWindow.sessionLimit)) * 100
                    )
                  )}%`
                }}
              />
            </div>
            {statusLoading ? null : (
              <p className="mt-1 hidden text-right text-[0.62rem] text-faint sm:block">
                {status.usageWindow.remainingInWindow} available now · up to {status.usageWindow.windowLimit} every 10 minutes
              </p>
            )}
          </div>
          <div className={`${styles.composerShell} flex w-full min-w-0 max-w-full items-center gap-3 rounded-2xl border border-border bg-surface-1 p-1.5`}>
            {isMobileViewport ? (
              <input
                ref={mobileInputRef}
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={6000}
                placeholder="Ask about Kyle…"
                aria-label="Ask Agent Kyle a question"
                autoComplete="off"
                className={`${styles.composerField} h-10 w-0 min-w-0 flex-1 bg-transparent px-2 text-base leading-5 text-fg outline-none placeholder:text-faint`}
              />
            ) : (
              <textarea
                ref={desktopInputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    askQuestion(draft);
                  }
                }}
                rows={1}
                maxLength={6000}
                placeholder="Ask about Kyle's experience, projects, skills, or fit..."
                aria-label="Ask Agent Kyle a question"
                className={`${styles.composerField} max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-fg outline-none placeholder:text-faint`}
              />
            )}
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              aria-label="Send question"
              className={`${styles.sendButton} grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-focus bg-focus text-surface-1 transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:border-border disabled:bg-accent disabled:text-button-primary-text disabled:opacity-40 md:h-10 md:w-10`}
            >
              <span className="h-5 w-5"><ArrowIcon /></span>
            </button>
          </div>
          <p className="mt-2 hidden text-center text-[0.64rem] text-faint sm:block">
            Grounded in public information. Verify important details with Kyle directly.
          </p>
        </form>
      </footer>
    </section>
  );
}
