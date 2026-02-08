import { getResumeDerived } from "@/lib/content";

export async function SectionSkills() {
  const resume = await getResumeDerived();

  const rows = [
    { label: "Data Engineering", items: resume.skillClusters.data },
    { label: "Analytics & Measurement", items: resume.skillClusters.analytics },
    { label: "AI Engineering", items: resume.skillClusters.ai },
    { label: "Dev + Delivery", items: resume.skillClusters.dev }
  ];

  return (
    <section id="skills" className="section-wrap py-14">
      <p className="eyebrow">Skills</p>
      <h2 className="subhead mt-2">What I ship with in production.</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {rows.map((row) => (
          <article key={row.label} className="card-base">
            <h3 className="text-lg font-semibold">{row.label}</h3>
            <p className="mt-3 text-sm text-muted">{row.items.join(" · ")}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
