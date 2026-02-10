import Link from "next/link";
import { getResumeDerived } from "@/lib/content";

export const metadata = {
  title: "Resume",
  description: "Experience, technical skills, and certifications for Kyle Springfield."
};

export default async function ResumePage() {
  const resume = await getResumeDerived();
  const highlights = Array.isArray(resume.highlights) ? resume.highlights : [];
  const education = Array.isArray(resume.education) ? resume.education : [];
  const skills = Array.isArray(resume.skills) ? resume.skills : [];
  const experience = Array.isArray(resume.experience) ? resume.experience : [];
  const certifications = Array.isArray(resume.certifications) ? resume.certifications : [];
  const details = Array.isArray(resume.certificationDetails) ? resume.certificationDetails : [];

  const formatMonth = (value: string) => {
    if (!value || value === "Present") return value;
    const [year, month = "01"] = value.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  };

  const contactItems = [
    resume.contact?.email
      ? {
          label: "Email",
          href: `mailto:${resume.contact.email}`,
          value: resume.contact.email
        }
      : null,
    resume.contact?.linkedin
      ? {
          label: "LinkedIn",
          href: resume.contact.linkedin.startsWith("http")
            ? resume.contact.linkedin
            : `https://${resume.contact.linkedin}`,
          value: resume.contact.linkedin
        }
      : null
  ].filter(Boolean) as Array<{ label: string; href: string; value: string }>;

  const certificationDetails =
    details.length > 0
      ? details
      : certifications.map((cert) => ({ name: cert, issuer: "" }));

  return (
    <section className="section-wrap py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display">Resume</h1>
        <Link href="/resume/source" className="btn-secondary" target="_blank">
          Source markdown
        </Link>
      </div>

      {resume.name ? <p className="eyebrow mt-6">{resume.name}</p> : null}
      <p className="lede mt-2 max-w-3xl">{resume.about}</p>

      {contactItems.length > 0 ? (
        <section className="mt-8">
          <h2 className="subhead">Contact</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {contactItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="card-base block"
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noreferrer" : undefined}
              >
                <p className="text-xs uppercase tracking-[0.14em] text-muted">{item.label}</p>
                <p className="mt-1 text-sm">{item.value}</p>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {highlights.length > 0 ? (
        <section className="mt-12">
          <h2 className="subhead">Highlights</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm">
            {highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="subhead">Experience</h2>
        <ol className="mt-4 space-y-4">
          {experience.map((role) => (
            <li key={`${role.company}-${role.title}-${role.start}`} className="card-base">
              <h3 className="font-semibold">
                {role.title}
                {role.company ? ` - ${role.company}` : ""}
              </h3>
              <p className="text-sm text-muted">
                {formatMonth(role.start)} - {formatMonth(role.end)}
                {role.location ? ` · ${role.location}` : ""}
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
          <h2 className="subhead">Education</h2>
          <ul className="mt-4 space-y-3">
            {education.map((entry) => (
              <li key={`${entry.degree}-${entry.school}`} className="card-base">
                <h3 className="text-sm font-semibold">{entry.degree}</h3>
                {entry.concentration ? (
                  <p className="mt-1 text-sm text-muted">Concentration: {entry.concentration}</p>
                ) : null}
                <p className="mt-1 text-sm text-muted">{entry.school}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="subhead">Skills</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span key={skill} className="tag-chip">
                {skill}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h2 className="subhead">Certifications</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {certificationDetails.map((cert) => (
              <li key={`${cert.name}-${cert.issuer}`} className="card-base">
                <p className="font-medium">{cert.name}</p>
                {cert.issuer ? <p className="mt-1 text-xs text-muted">{cert.issuer}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </section>
  );
}
