"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type SVGProps } from "react";
import { SearchBox } from "@/components/SearchBox";

const navItems = [
  { href: "/#projects", label: "Projects" },
  { href: "/#skills", label: "Skills" },
  { href: "/#now", label: "Now" },
  { href: "/#contact", label: "Contact" },
  { href: "/resume", label: "Resume" }
];

type MobilePanel = "search" | "menu" | null;

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="8" />
    </svg>
  );
}

function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 5h16" />
      <path d="M4 12h16" />
      <path d="M4 19h16" />
    </svg>
  );
}

function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const searchPanelId = useId();
  const menuPanelId = useId();
  const headerRef = useRef<HTMLElement>(null);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);

  useEffect(() => {
    setMobilePanel(null);
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!headerRef.current?.contains(event.target as Node)) {
        setMobilePanel(null);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobilePanel(null);
      }
    }

    function onViewportChange(event: MediaQueryListEvent) {
      if (event.matches) {
        setMobilePanel(null);
      }
    }

    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    desktopQuery.addEventListener("change", onViewportChange);

    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      desktopQuery.removeEventListener("change", onViewportChange);
    };
  }, []);

  const searchOpen = mobilePanel === "search";
  const menuOpen = mobilePanel === "menu";

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-border-strong bg-bg backdrop-blur-md"
    >
      <div className="section-wrap relative py-3 lg:hidden">
        <div className="flex h-10 items-center justify-between gap-4">
          <Link
            href="/"
            className="whitespace-nowrap font-mono text-xs uppercase tracking-[0.22em] text-faint transition hover:text-link"
          >
            Kyle Springfield
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={searchOpen ? "Close site search" : "Search site"}
              aria-controls={searchPanelId}
              aria-expanded={searchOpen}
              onClick={() => setMobilePanel(searchOpen ? null : "search")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-2 text-muted transition hover:border-border-accent hover:text-link-hover motion-reduce:transition-none"
            >
              <SearchIcon className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-controls={menuPanelId}
              aria-expanded={menuOpen}
              onClick={() => setMobilePanel(menuOpen ? null : "menu")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-2 text-muted transition hover:border-border-accent hover:text-link-hover motion-reduce:transition-none"
            >
              <span className="relative h-5 w-5" aria-hidden="true">
                <MenuIcon
                  className={`absolute inset-0 h-5 w-5 transition duration-200 motion-reduce:transition-none ${
                    menuOpen ? "rotate-90 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100"
                  }`}
                />
                <CloseIcon
                  className={`absolute inset-0 h-5 w-5 transition duration-200 motion-reduce:transition-none ${
                    menuOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-75 opacity-0"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>

        <div
          id={searchPanelId}
          aria-hidden={!searchOpen}
          className={`absolute left-0 right-0 top-full z-50 bg-bg px-0 pb-3 pt-2 shadow-panel backdrop-blur-md transition duration-200 motion-reduce:transition-none ${
            searchOpen
              ? "visible translate-y-0 opacity-100"
              : "pointer-events-none invisible -translate-y-2 opacity-0"
          }`}
        >
          <div className="ml-auto w-full max-w-md">
            <SearchBox
              autoFocus={searchOpen}
              className="max-w-none"
              onEscape={() => setMobilePanel(null)}
              onNavigate={() => setMobilePanel(null)}
            />
          </div>
        </div>

        <div
          id={menuPanelId}
          aria-hidden={!menuOpen}
          className={`absolute left-0 right-0 top-full z-40 pb-3 pt-2 transition duration-200 motion-reduce:transition-none ${
            menuOpen
              ? "visible translate-y-0 opacity-100"
              : "pointer-events-none invisible -translate-y-2 opacity-0"
          }`}
        >
          <nav aria-label="Primary" className="ml-auto w-max min-w-[10rem] rounded-lg border border-border bg-surface-2 p-2 shadow-panel">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobilePanel(null)}
                className="block rounded-md px-3 py-2.5 text-sm text-muted transition hover:bg-surface-3 hover:text-link-hover"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="section-wrap hidden grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-6 py-4 lg:grid">
        <Link
          href="/"
          className="justify-self-start whitespace-nowrap font-mono text-xs uppercase tracking-[0.22em] text-faint transition hover:text-link"
        >
          Kyle Springfield
        </Link>

        <nav aria-label="Primary" className="flex items-center justify-center gap-4 text-sm">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-muted transition hover:text-link-hover">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="w-full max-w-[20rem] justify-self-end">
          <SearchBox />
        </div>
      </div>
    </header>
  );
}
