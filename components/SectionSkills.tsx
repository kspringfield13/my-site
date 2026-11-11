import { getResumeDerived } from "@/lib/content";

export async function SectionSkills() {
  const resume = await getResumeDerived();

  const rows = [
    { label: "Data engineering", items: resume.skillClusters.data },
    { label: "Analytics and measurement", items: resume.skillClusters.analytics },
    { label: "AI engineering", items: resume.skillClusters.ai },
    { label: "Development and delivery", items: resume.skillClusters.dev }
  ].filter((row) => row.items.length > 0);

  return (
    <section id="skills" className="section-wrap py-14">
      <div>
        <p className="eyebrow">Skills</p>
        <h2 className="subhead mt-2 text-balance">What I ship with in production.</h2>
        <p className="mb-0 mt-3 max-w-[40rem] text-sm leading-relaxed text-muted text-pretty">
          Four disciplines I use together, from data foundations through deployment.
        </p>
      </div>

      <dl className="mb-0 mt-8 border-t border-border" data-testid="skills-list">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-x-10 gap-y-2 border-b border-border py-5 last:border-b-0 md:grid-cols-[16rem_minmax(0,1fr)] md:py-6"
          >
            <dt className="text-lg font-semibold leading-snug text-fg">{row.label}</dt>
            <dd className="m-0 max-w-[46rem] text-base leading-relaxed text-muted">{row.items.join(", ")}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
