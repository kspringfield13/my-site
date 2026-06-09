"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AgentKylePanel } from "@/components/agent-kyle/AgentKylePanel";

const DOCK_QUESTIONS = [
  "What does Kyle build?",
  "Is Kyle a fit for my team?"
];

export function AgentKyleDock() {
  const pathname = usePathname();
  const isHomeRoute = pathname === "/";
  const [hasReachedProjects, setHasReachedProjects] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [seedQuestion, setSeedQuestion] = useState("");

  useEffect(() => {
    if (!isHomeRoute) {
      setHasReachedProjects(false);
      setIsExpanded(false);
      return;
    }

    let observer: IntersectionObserver | null = null;
    let rafId: number | null = null;

    const connectObserver = () => {
      const projects = document.getElementById("projects");
      if (!projects) {
        rafId = window.requestAnimationFrame(connectObserver);
        return;
      }

      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          const reachedProjects = entry.isIntersecting || entry.boundingClientRect.top < 0;
          setHasReachedProjects(reachedProjects);
          if (!reachedProjects) setIsExpanded(false);
        },
        { threshold: 0, rootMargin: "0px 0px -10% 0px" }
      );
      observer.observe(projects);
    };

    connectObserver();
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      observer?.disconnect();
    };
  }, [isHomeRoute]);

  const isVisible = isHomeRoute && hasReachedProjects;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "k" && isVisible) {
        event.preventDefault();
        setIsExpanded((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isVisible]);

  if (!isHomeRoute) return null;

  function openWithQuestion(question = "") {
    setSeedQuestion(question);
    setIsExpanded(true);
  }

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[75] px-2 transition-all duration-300 motion-reduce:transition-none md:px-4 ${
        isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      {isExpanded ? (
        <button
          type="button"
          aria-label="Close Agent Kyle"
          className="fixed inset-0 -z-10 cursor-default bg-black/55 backdrop-blur-[2px]"
          onClick={() => setIsExpanded(false)}
        />
      ) : null}

      <div className="relative mx-auto max-w-5xl">
        <div
          className={`absolute inset-x-0 bottom-full pb-2 transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${
            isExpanded ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-5 opacity-0"
          }`}
        >
          <div className="h-[min(76vh,760px)] min-h-[31rem]">
            <AgentKylePanel
              open={isExpanded}
              seedQuestion={seedQuestion}
              onClose={() => setIsExpanded(false)}
            />
          </div>
        </div>

        <div
          className={`border border-b-0 border-border-strong bg-surface-1/95 shadow-panel backdrop-blur-xl transition-all duration-300 ${
            isExpanded
              ? "mx-auto w-fit rounded-t-xl px-2 pt-1.5"
              : "rounded-t-2xl px-3 pt-2.5 md:px-4"
          }`}
          style={{ paddingBottom: isExpanded ? "max(0.35rem, env(safe-area-inset-bottom))" : "max(0.6rem, env(safe-area-inset-bottom))" }}
        >
          {isExpanded ? (
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="flex items-center gap-2 rounded-full px-2 py-1 text-[0.65rem] uppercase tracking-[0.12em] text-faint transition hover:text-link-hover"
              aria-label="Collapse Agent Kyle"
            >
              Close
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M3.5 6 8 10.5 12.5 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => openWithQuestion()}
                className="group flex min-w-0 flex-1 items-center gap-3 text-left"
                aria-expanded={false}
                aria-label="Open Agent Kyle"
              >
                <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border-accent bg-surface-3 text-xs font-semibold text-link-hover">
                  AK
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface-1 bg-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-fg">Ask Agent Kyle</span>
                    <span className="hidden text-[0.62rem] uppercase tracking-[0.12em] text-faint sm:inline">Public portfolio guide</span>
                  </div>
                  <p className="truncate text-xs text-muted group-hover:text-link-hover">
                    Ask about experience, projects, skills, or what Kyle could bring to your team.
                  </p>
                </div>
              </button>

              <div className="hidden items-center gap-2 lg:flex">
                {DOCK_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => openWithQuestion(question)}
                    className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-muted transition hover:border-border-accent hover:text-link-hover"
                  >
                    {question}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-surface-2 text-muted transition hover:border-border-accent hover:text-link-hover"
                aria-label="Expand Agent Kyle"
                aria-expanded={false}
              >
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="M3.5 10 8 5.5 12.5 10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
