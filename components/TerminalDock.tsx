"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { executeTerminalCommand } from "@/lib/commands";
import { getAutocompleteSuggestions } from "@/lib/terminal/registry";
import { jumpToSection } from "@/lib/section-nav";
import type { SearchDoc } from "@/lib/types";
import type { TerminalDataContext, TerminalResultCard } from "@/lib/terminal/types";

const historyKey = "ks-terminal-history";

function applySuggestion(input: string, suggestion: string) {
  const trimmed = input.trimStart();
  if (!trimmed) {
    return `${suggestion} `;
  }

  const hasTrailingSpace = /\s$/.test(input);
  const parts = trimmed.split(/\s+/);

  if (parts.length === 1 && !hasTrailingSpace) {
    return `${suggestion} `;
  }

  if (hasTrailingSpace) {
    return `${input}${suggestion} `;
  }

  parts[parts.length - 1] = suggestion;
  return `${parts.join(" ")} `;
}

function isInternalHref(href: string) {
  return href.startsWith("/") || href.startsWith("#");
}

export function TerminalDock() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<TerminalDataContext | null>(null);
  const [input, setInput] = useState("");
  const [cards, setCards] = useState<TerminalResultCard[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyCursor, setHistoryCursor] = useState<number | null>(null);
  const [lastSearchResults, setLastSearchResults] = useState<SearchDoc[]>([]);

  const router = useRouter();
  const pathname = usePathname();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    let storedHistory: string | null = null;
    try {
      storedHistory = sessionStorage.getItem(historyKey);
    } catch {
      storedHistory = null;
    }

    Promise.all([
      fetch("/api/terminal-context").then((res) => (res.ok ? res.json() : null)),
      Promise.resolve(storedHistory)
    ])
      .then(([ctx, storedHistory]) => {
        if (!active) return;
        if (ctx) setContext(ctx);
        if (storedHistory) {
          try {
            const parsed = JSON.parse(storedHistory) as string[];
            setHistory(Array.isArray(parsed) ? parsed.slice(-60) : []);
          } catch {
            setHistory([]);
          }
        }
      })
      .catch(() => {
        if (active) {
          setContext(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (open && event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        launcherRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open || !dialogRef.current) {
      return;
    }

    function trap(event: KeyboardEvent) {
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((node) => !node.hasAttribute("disabled"));

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeEl === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [open]);

  const projectSlugs = useMemo(() => context?.projects.map((project) => project.slug) ?? [], [context]);
  const suggestions = useMemo(
    () => getAutocompleteSuggestions(input, projectSlugs).slice(0, 6),
    [input, projectSlugs]
  );

  function pushHistory(command: string) {
    const next = [...history, command].slice(-60);
    setHistory(next);
    setHistoryCursor(null);
    try {
      sessionStorage.setItem(historyKey, JSON.stringify(next));
    } catch {
      // Ignore storage failures in strict privacy contexts.
    }
  }

  function navigateSection(sectionId: string) {
    if (pathname !== "/") {
      router.push(`/#${sectionId}`);
      window.setTimeout(() => jumpToSection(sectionId), 120);
      return;
    }
    jumpToSection(sectionId);
  }

  function navigateTo(href: string) {
    if (isInternalHref(href)) {
      if (href.startsWith("#")) {
        navigateSection(href.slice(1));
      } else {
        router.push(href);
      }
    } else {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  }

  function runCommand(command: string) {
    if (!command.trim()) return;
    if (!context) {
      setCards([
        {
          id: "context:loading",
          kind: "error",
          title: "Console context still loading",
          description: "Try again in a second."
        }
      ]);
      return;
    }

    const result = executeTerminalCommand(command, context, lastSearchResults);

    if (result.clear) {
      setCards([]);
    } else {
      setCards((previous) => [...previous, ...result.cards].slice(-24));
    }

    if (result.searchResults) {
      setLastSearchResults(result.searchResults);
    }

    if (result.navigateSection) {
      navigateSection(result.navigateSection);
    }

    if (result.navigateTo) {
      navigateTo(result.navigateTo);
    }

    pushHistory(command);
    setInput("");
  }

  function onAction(command?: string, href?: string, sectionId?: string) {
    if (command) {
      runCommand(command);
      return;
    }
    if (sectionId) {
      navigateSection(sectionId);
      return;
    }
    if (href) {
      navigateTo(href);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        ref={launcherRef}
        type="button"
        className="btn-secondary gap-2 px-4 py-2 text-sm shadow-panel"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="terminal-dialog"
      >
        Data console
      </button>

      {open ? (
        <section
          id="terminal-dialog"
          role="dialog"
          aria-label="Data console"
          aria-modal="true"
          ref={dialogRef}
          className="mt-2 w-[min(44rem,94vw)] rounded-2xl border border-border-strong bg-surface-2 p-3 shadow-panel"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="eyebrow">Command layer</p>
            <button
              type="button"
              className="token-hover-wash rounded-md px-2 py-1 text-xs text-muted"
              onClick={() => {
                setOpen(false);
                launcherRef.current?.focus();
              }}
            >
              Close
            </button>
          </div>

          <div
            aria-live="polite"
            aria-relevant="additions text"
            className="max-h-72 space-y-2 overflow-auto rounded-xl border border-border bg-surface-1 p-2"
          >
            {cards.length === 0 ? (
              <article className="rounded-lg border border-border bg-surface-2 p-3 text-sm text-muted">
                {loading ? "Loading console context..." : 'Try "help", "projects --pinned", or "search \"dbt\"".'}
              </article>
            ) : (
              cards.map((card) => (
                <article key={card.id} className="rounded-lg border border-border bg-surface-2 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold">{card.title}</h3>
                    {card.meta ? <span className="text-xs text-muted">{card.meta}</span> : null}
                  </div>
                  <p className="mt-1 text-sm text-muted">{card.description}</p>
                  {card.actions?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {card.actions.map((action) => (
                        <button
                          key={`${card.id}:${action.label}`}
                          type="button"
                          className="token-hover-wash rounded-full border border-border px-3 py-1 text-xs text-fg"
                          onClick={() => onAction(action.command, action.href, action.sectionId)}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>

          <form
            className="mt-2"
            onSubmit={(event) => {
              event.preventDefault();
              runCommand(input.trim());
            }}
          >
            <label htmlFor="terminal-input" className="sr-only">
              Terminal command
            </label>
            <input
              id="terminal-input"
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Tab") {
                  if (suggestions.length > 0) {
                    event.preventDefault();
                    setInput((current) => applySuggestion(current, suggestions[0]));
                  }
                } else if (event.key === "ArrowUp") {
                  if (history.length > 0) {
                    event.preventDefault();
                    setHistoryCursor((cursor) => {
                      const nextIndex = cursor === null ? history.length - 1 : Math.max(0, cursor - 1);
                      setInput(history[nextIndex]);
                      return nextIndex;
                    });
                  }
                } else if (event.key === "ArrowDown") {
                  if (history.length > 0) {
                    event.preventDefault();
                    setHistoryCursor((cursor) => {
                      if (cursor === null) return null;
                      const nextIndex = cursor + 1;
                      if (nextIndex >= history.length) {
                        setInput("");
                        return null;
                      }
                      setInput(history[nextIndex]);
                      return nextIndex;
                    });
                  }
                }
              }}
              placeholder='help · projects --tag ai · search "snowflake"'
              className="w-full rounded-xl border border-border bg-surface-1 px-3 py-2 text-sm text-fg placeholder:text-faint"
            />
          </form>

          {suggestions.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2" aria-label="Autocomplete suggestions">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="token-hover-wash rounded-full border border-border px-2 py-1 text-[11px] text-muted"
                  onClick={() => setInput((value) => applySuggestion(value, suggestion))}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
