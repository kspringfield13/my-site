import Link from "next/link";
import { getResumeDerived } from "@/lib/content";

export const metadata = {
  title: "Resume",
  description: "Experience, technical skills, and certifications for Kyle Springfield."
};

export default async function ResumePage() {
  const resume = await getResumeDerived();
  const formatMonth = (value: string) => {
    if (!value || value === "Present") return value;
    const [year, month = "01"] = value.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  };

  return (
    <section className="section-wrap py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display">Resume</h1>
        <Link href="/resume/source" className="btn-secondary" target="_blank">
          Source markdown
        </Link>
      </div>

      <p className="lede mt-4 max-w-2xl">{resume.about}</p>

      <section className="mt-12">
        <h2 className="subhead">Experience</h2>
        <ol className="mt-4 space-y-4">
          {resume.experience.map((role) => (
            <li key={`${role.company}-${role.title}-${role.start}`} className="card-base">
              <h3 className="font-semibold">{role.title}</h3>
              <p className="text-sm text-muted">
                {role.company} · {formatMonth(role.start)} - {formatMonth(role.end)}
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                {role.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="subhead">Skills</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {resume.skills.map((skill) => (
              <span key={skill} className="tag-chip">
                {skill}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h2 className="subhead">Certifications</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {resume.certifications.map((cert) => (
              <li key={cert} className="card-base">
                {cert}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </section>
  );
}
