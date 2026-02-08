import Link from "next/link";
import { getResumeDerived } from "@/lib/content";

export async function SectionHero() {
  const resume = await getResumeDerived();
  const bullets = resume.proofBullets.slice(0, 3);

  return (
    <section id="hero" className="section-wrap py-14 md:py-20">
      <p className="eyebrow">Analytics + AI Engineering</p>
      <h1 className="display mt-4 max-w-4xl">Kyle builds data pipelines, analytics systems, and AI-powered apps.</h1>
      <p className="lede mt-6 max-w-2xl">
        I use SQL, Python, dbt, Snowflake, and AWS to turn noisy data into decision-ready systems.
      </p>

      <ul className="mt-8 grid gap-3 md:grid-cols-3">
        {bullets.map((bullet) => (
          <li key={bullet} className="card-base text-sm">
            {bullet}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/#projects" className="btn-primary">
          Explore projects
        </Link>
        <Link href="/resume" className="btn-secondary">
          View resume
        </Link>
      </div>
    </section>
  );
}
