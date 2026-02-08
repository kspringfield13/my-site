import Link from "next/link";

const principles = [
  "Design for trust first: reproducible metrics before visual polish.",
  "Bias toward pipelines that are inspectable, testable, and cheap to operate.",
  "Use AI where it compounds throughput, not where it adds variance.",
  "Treat experimentation as product infrastructure, not side analysis."
];

export function SectionHowIThink() {
  return (
    <section id="how-i-think" className="section-wrap py-14">
      <p className="eyebrow">How I Think</p>
      <h2 className="subhead mt-2">Decision heuristics for data and AI systems.</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {principles.map((item) => (
          <article key={item} className="card-base text-sm">
            {item}
          </article>
        ))}
      </div>
      <Link className="btn-secondary mt-6 inline-flex" href="/writing">
        Read short notes
      </Link>
    </section>
  );
}
