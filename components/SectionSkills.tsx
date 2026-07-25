import { getResumeDerived } from "@/lib/content";
import { SkillsStudio } from "@/components/SkillsStudio";

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
      <div className="grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_minmax(16rem,0.56fr)]">
        <div>
          <p className="eyebrow">Skills</p>
          <h2 className="subhead mt-2">What I ship with in production.</h2>
        </div>
        <p className="m-0 text-sm leading-relaxed text-muted md:text-right">
          Four connected disciplines, one production-ready delivery practice—from data foundations through deployment.
        </p>
      </div>

      <div className="mt-8">
        <SkillsStudio capabilities={rows} />
      </div>
    </section>
  );
}
