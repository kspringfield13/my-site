"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AgentKylePanel } from "@/components/agent-kyle/AgentKylePanel";

export function AgentKyleDock() {
  const pathname = usePathname();
  const isHomeRoute = pathname === "/";
  const [hasReachedProjects, setHasReachedProjects] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
        (entries) => {
          const entry = entries[0];
          if (!entry) return;

          // Show the dock when the visitor reaches Projects, and hide it again above that section.
          const reachedProjects = entry.isIntersecting || entry.boundingClientRect.top < 0;
          setHasReachedProjects(reachedProjects);
          if (!reachedProjects) {
            setIsExpanded(false);
          }
        },
        {
          threshold: 0,
          rootMargin: "0px 0px -10% 0px"
        }
      );

      observer.observe(projects);
    };

    connectObserver();

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      observer?.disconnect();
    };
  }, [isHomeRoute]);

  const isVisible = isHomeRoute && hasReachedProjects;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "k") {
        if (!isVisible) return;
        event.preventDefault();
        setIsExpanded((value) => !value);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isVisible]);

  if (!isHomeRoute) {
    return null;
  }

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[75] transition-all duration-300 motion-reduce:transition-none ${
        isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <div className="relative border-t border-border-strong bg-surface-1/95 shadow-panel backdrop-blur">
        <div
          id="agent-kyle-dock-panel"
          className={`absolute inset-x-0 bottom-full overflow-hidden border-x border-t border-border-strong bg-surface-2/95 backdrop-blur transition-[max-height,transform,opacity] duration-300 ease-out motion-reduce:transition-none ${
            isExpanded ? "max-h-[90vh] translate-y-0 opacity-100" : "max-h-0 translate-y-4 opacity-0"
          }`}
        >
          <div className="h-[88vh] min-h-[24rem] w-full md:h-[90vh] md:max-h-[900px]">
            <AgentKylePanel open={isExpanded} onClose={() => setIsExpanded(false)} />
          </div>
        </div>

        <div
          className="flex items-center justify-between px-4 pt-2 md:px-6 md:pt-2.5"
          style={{ paddingBottom: "max(0.45rem, env(safe-area-inset-bottom))" }}
        >
          <p className="eyebrow text-faint">Agent Kyle</p>
          <div className="group relative mb-1">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-2 text-muted transition hover:border-border-accent hover:text-link-hover"
              aria-label={isExpanded ? "Collapse Agent Kyle" : "Expand Agent Kyle"}
              aria-expanded={isExpanded}
              aria-controls="agent-kyle-dock-panel"
              title={isExpanded ? "Collapse Agent Kyle (Ctrl/⌘+Shift+K)" : "Expand Agent Kyle (Ctrl/⌘+Shift+K)"}
              onClick={() => setIsExpanded((value) => !value)}
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                {isExpanded ? (
                  <path d="M3.5 6 8 10.5 12.5 6" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <path d="M3.5 10 8 5.5 12.5 10" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full right-0 mb-2 w-max max-w-[15rem] rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-[0.65rem] uppercase tracking-[0.1em] text-faint opacity-0 shadow-panel transition group-hover:opacity-100 group-focus-within:opacity-100"
            >
              {isExpanded ? "Collapse Agent Kyle" : "Expand Agent Kyle"} · Ctrl/⌘+Shift+K
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
