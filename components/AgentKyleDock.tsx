"use client";

import { useEffect, useRef, useState } from "react";
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
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  function closePanel() {
    setIsExpanded(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  return (
    <div
      className={`fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-[75] isolate transition-opacity duration-300 motion-reduce:transition-none md:bottom-5 ${
        isExpanded ? "md:inset-x-5" : "md:inset-x-auto md:right-5"
      } ${
        isVisible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {isExpanded ? (
        <button
          type="button"
          aria-label="Close Agent Kyle"
          className="fixed inset-0 -z-10 cursor-default bg-black/55 backdrop-blur-[2px]"
          onClick={closePanel}
        />
      ) : null}

      <div className={`relative ${isExpanded ? "mx-auto w-full max-w-5xl" : "ml-auto w-fit"}`}>
        <div
          className={`fixed inset-x-3 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] top-[calc(0.75rem+env(safe-area-inset-top))] z-10 pb-2 transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none md:absolute md:inset-x-0 md:bottom-full md:top-auto ${
            isExpanded ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-5 opacity-0"
          }`}
        >
          <div className="h-full min-h-0 md:h-[min(76vh,760px)] md:min-h-[31rem]">
            <AgentKylePanel
              open={isExpanded}
              seedQuestion={seedQuestion}
              onClose={closePanel}
            />
          </div>
        </div>

        <div
          className={`relative z-20 border bg-surface-1 shadow-panel transition-all duration-300 motion-reduce:transition-none ${
            isExpanded
              ? "mx-auto w-fit rounded-full border-border-strong px-2 py-1"
              : "group/dock rounded-full border-border px-1.5 py-1.5 hover:border-border-strong focus-within:border-border-strong"
          }`}
        >
          {isExpanded ? (
            <button
              type="button"
              onClick={closePanel}
              className="flex items-center gap-2 rounded-full px-2 py-1 text-[0.65rem] uppercase tracking-[0.12em] text-faint transition hover:text-link-hover"
              aria-label="Collapse Agent Kyle"
            >
              Close
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M3.5 6 8 10.5 12.5 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <>
              <button
                ref={triggerRef}
                type="button"
                onClick={() => openWithQuestion()}
                className="group flex items-center gap-2 rounded-full px-1.5 py-1 text-left"
                aria-expanded={false}
                aria-label="Open Agent Kyle, a guide to Kyle's portfolio"
              >
                <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border-accent bg-surface-2 text-[0.62rem] font-semibold tracking-wide text-link">
                  AK
                  <span className="absolute -bottom-px -right-px h-2 w-2 rounded-full border-2 border-surface-1 bg-emerald-400" />
                </span>
                <span className="text-xs font-medium text-muted transition group-hover:text-link-hover motion-reduce:transition-none">
                  Ask Agent Kyle
                </span>
                <svg className="h-3.5 w-3.5 text-faint transition group-hover:-translate-y-0.5 group-hover:text-link-hover motion-reduce:transition-none" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="M3.5 10 8 5.5 12.5 10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div
                className="pointer-events-none absolute bottom-full right-0 z-10 w-[calc(100vw-1.5rem)] max-w-[22rem] translate-y-2 pb-3 opacity-0 transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none group-hover/dock:pointer-events-auto group-hover/dock:translate-y-0 group-hover/dock:opacity-100 group-focus-within/dock:pointer-events-auto group-focus-within/dock:translate-y-0 group-focus-within/dock:opacity-100 sm:w-[min(20rem,calc(100vw-1.5rem))]"
              >
                <div className="rounded-2xl border border-border-strong bg-surface-1 p-3 shadow-panel">
                  <p className="px-1 text-xs leading-relaxed text-muted">
                    Explore Kyle&apos;s experience, projects, and fit for your team.
                  </p>
                  <div className="mt-3 grid gap-1.5">
                    {DOCK_QUESTIONS.map((question) => (
                      <button
                        key={question}
                        type="button"
                        onClick={() => openWithQuestion(question)}
                        className="rounded-xl border border-transparent bg-surface-2 px-3 py-2 text-left text-xs text-muted transition hover:border-border-accent hover:text-link-hover motion-reduce:transition-none"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
