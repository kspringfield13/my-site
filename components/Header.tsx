import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";

const navItems = [
  { href: "/#projects", label: "Projects" },
  { href: "/#skills", label: "Skills" },
  { href: "/writing", label: "Writing" },
  { href: "/#now", label: "Now" },
  { href: "/#contact", label: "Contact" }
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-strong bg-bg backdrop-blur-md">
      <div className="section-wrap flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-5">
          <Link href="/" className="font-mono text-xs uppercase tracking-[0.22em] text-faint transition hover:text-link">
            Kyle Springfield
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-4 overflow-x-auto text-sm">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-muted transition hover:text-link-hover">
                {item.label}
              </Link>
            ))}
            <Link href="/resume" className="text-muted transition hover:text-link-hover">
              Resume
            </Link>
          </nav>
        </div>
        <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
          <SearchBox />
        </div>
      </div>
    </header>
  );
}
