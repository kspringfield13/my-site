import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border-strong py-10">
      <div className="section-wrap flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">Kyle Springfield · Analytics + AI Engineering</p>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-4 text-sm text-muted">
          <Link href="/resume" className="transition hover:text-link-hover">
            Resume
          </Link>
        </nav>
      </div>
    </footer>
  );
}
