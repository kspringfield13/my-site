"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { rankSearchResults } from "@/lib/search";
import type { SearchDoc } from "@/lib/types";

interface SearchBoxProps {
  autoFocus?: boolean;
  className?: string;
  onEscape?: () => void;
  onNavigate?: () => void;
}

export function SearchBox({
  autoFocus = false,
  className = "",
  onEscape,
  onNavigate
}: SearchBoxProps) {
  const inputId = `${useId()}-search`;
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<SearchDoc[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      }
    }

    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

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
    onNavigate?.();
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
      onEscape?.();
    }
  }

  return (
    <div ref={boxRef} className={`relative w-full max-w-[20rem] ${className}`}>
      <label className="sr-only" htmlFor={inputId}>
        Search site
      </label>
      <input
        id={inputId}
        ref={inputRef}
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
      {open && query.trim() ? (
        <div className="absolute right-0 z-50 mt-2 w-full rounded-lg border border-border-strong bg-surface-2 p-2 shadow-panel">
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted">No results.</p>
          ) : (
            <ul className="space-y-1">
              {results.map((result, index) => (
                <li key={result.id}>
                  <button
                    type="button"
                    className={`w-full rounded-md px-3 py-2 text-left text-sm ${
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
