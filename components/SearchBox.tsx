"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { rankSearchResults } from "@/lib/search";
import type { SearchDoc } from "@/lib/types";
import { useRouter } from "next/navigation";

interface SearchBoxProps {
  compactOnMobile?: boolean;
}

export function SearchBox({ compactOnMobile = false }: SearchBoxProps) {
  const inputBaseId = useId();
  const desktopInputId = `${inputBaseId}-search`;
  const mobileInputId = `${inputBaseId}-search-mobile`;
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<SearchDoc[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [isCompactOpen, setIsCompactOpen] = useState(false);
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/search-index.json")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: SearchDoc[]) => {
        if (mounted) {
          setDocs(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => setDocs([]));

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) {
        setOpen(false);
        if (compactOnMobile) {
          setIsCompactOpen(false);
        }
      }
    }

    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [compactOnMobile]);

  useEffect(() => {
    if (!compactOnMobile || !isCompactOpen) {
      return;
    }

    mobileInputRef.current?.focus();
  }, [compactOnMobile, isCompactOpen]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return rankSearchResults(docs, query).slice(0, 8);
  }, [docs, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function openResult(index: number) {
    const target = results[index];
    if (!target) return;
    router.push(target.url);
    setOpen(false);
    setQuery("");
    if (compactOnMobile) {
      setIsCompactOpen(false);
    }
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      if (results.length > 0) {
        event.preventDefault();
        openResult(activeIndex);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
      if (compactOnMobile) {
        setIsCompactOpen(false);
      }
    }
  }

  return (
    <div ref={boxRef} className={compactOnMobile ? "relative w-10 sm:w-full sm:max-w-[20rem]" : "relative w-full max-w-[20rem]"}>
      <div className={compactOnMobile ? "hidden sm:block" : undefined}>
        <label className="sr-only" htmlFor={desktopInputId}>
          Search site
        </label>
        <input
          id={desktopInputId}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onInputKeyDown}
          autoComplete="off"
          placeholder="Search here"
          className="w-full rounded-full border border-border bg-surface-2 px-4 py-2 text-sm text-fg placeholder:text-faint"
        />
      </div>
      {compactOnMobile ? (
        <div className="relative sm:hidden">
          <div
            className={`pointer-events-none absolute right-11 top-1/2 -translate-y-1/2 overflow-hidden transition-all duration-250 ${
              isCompactOpen ? "w-[12.5rem] opacity-100" : "w-0 opacity-0"
            }`}
          >
            <label className="sr-only" htmlFor={mobileInputId}>
              Search site
            </label>
            <input
              id={mobileInputId}
              ref={mobileInputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onInputKeyDown}
              autoComplete="off"
              placeholder="Search"
              className="pointer-events-auto w-[12.5rem] rounded-full border border-border bg-surface-2 px-4 py-2 text-sm text-fg placeholder:text-faint"
            />
          </div>
          <button
            type="button"
            aria-label="Search site"
            aria-expanded={isCompactOpen}
            onClick={() => {
              if (isCompactOpen) {
                setIsCompactOpen(false);
                setOpen(false);
                return;
              }
              setIsCompactOpen(true);
              setOpen(true);
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-2 text-muted transition hover:border-border-accent hover:text-link-hover"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="7" cy="7" r="4.25" />
              <path d="M10.4 10.4 14 14" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ) : null}
      {open && query.trim() ? (
        <div
          className={`absolute right-0 z-50 mt-2 rounded-xl border border-border-strong bg-surface-2 p-2 shadow-panel ${
            compactOnMobile ? "w-[15.5rem] sm:w-full" : "w-full"
          }`}
        >
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted">No results.</p>
          ) : (
            <ul className="space-y-1">
              {results.map((result, index) => (
                <li key={result.id}>
                  <button
                    type="button"
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                      index === activeIndex ? "bg-surface-3" : "token-hover-wash"
                    }`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => openResult(index)}
                  >
                    <div className="font-semibold">{result.title}</div>
                    <div className="text-xs text-muted">
                      {result.type} · {result.tags.slice(0, 3).join(" · ")}
                    </div>
                    <div className="mt-1 text-xs text-muted">{result.body.slice(0, 90)}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
