import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="section-wrap py-20">
      <p className="eyebrow">404</p>
      <h1 className="display mt-4 max-w-2xl">Couldn&apos;t find that page.</h1>
      <p className="lede mt-4 max-w-prose">
        Jump back to flagship work or browse the latest projects.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="btn-primary" href="/">
          Home
        </Link>
        <Link className="btn-secondary" href="/projects">
          Browse projects
        </Link>
      </div>
    </section>
  );
}
