import Link from "next/link";

export const metadata = {
  title: "About",
  description: "A structured overview with placeholder content for bio, skills, capabilities, and work history."
};

const QUICK_LINKS = [
  {
    href: "#fun-facts",
    title: "Fun Facts",
    description: "Quick personality notes and image placeholders."
  },
  {
    href: "#skills",
    title: "Skills",
    description: "Core domains and tooling focus."
  },
  {
    href: "#work-history",
    title: "Work History",
    description: "A concise timeline of roles."
  },
  {
    href: "#recognition",
    title: "Recognition",
    description: "Talks, interviews, and notable mentions."
  }
];

const FUN_FACTS = [
  {
    title: "Favorite Build Cycle",
    imageLabel: "Landscape image placeholder 01",
    description:
      "Placeholder text: I enjoy short, high-feedback build cycles where data instrumentation and UX evolve together."
  },
  {
    title: "Current Obsession",
    imageLabel: "Landscape image placeholder 02",
    description:
      "Placeholder text: I am exploring how retrieval workflows and analytics pipelines can share one operational model."
  },
  {
    title: "Learning Goal",
    imageLabel: "Landscape image placeholder 03",
    description:
      "Placeholder text: Deepening applied systems design for AI products that require reliability and traceability."
  },
  {
    title: "Outside Work",
    imageLabel: "Landscape image placeholder 04",
    description:
      "Placeholder text: Long walks, strong coffee, and collecting references from architecture, film, and industrial design."
  }
];

const SKILL_GROUPS = [
  {
    label: "Analytics Engineering",
    description: "Placeholder text for event design, experimentation, semantic layers, and reporting standards."
  },
  {
    label: "Data Platforms",
    description: "Placeholder text for warehouse modeling, orchestration, observability, and governance."
  },
  {
    label: "AI Product Delivery",
    description: "Placeholder text for prompt workflows, eval design, and production guardrails."
  }
];

const CAPABILITIES = [
  "Placeholder capability 01",
  "Placeholder capability 02",
  "Placeholder capability 03",
  "Placeholder capability 04",
  "Placeholder capability 05",
  "Placeholder capability 06",
  "Placeholder capability 07",
  "Placeholder capability 08",
  "Placeholder capability 09",
  "Placeholder capability 10",
  "Placeholder capability 11",
  "Placeholder capability 12"
];

const WORK_HISTORY = [
  {
    period: "2024-Present",
    role: "Independent Consultant",
    company: "Placeholder Studio",
    summary: "Placeholder text for strategy and execution across analytics modernization and AI enablement."
  },
  {
    period: "2021-2024",
    role: "Head of Data Systems",
    company: "Placeholder Company",
    summary: "Placeholder text for owning end-to-end data architecture and decision support systems."
  },
  {
    period: "2018-2021",
    role: "Product Analytics Lead",
    company: "Placeholder Product Org",
    summary: "Placeholder text for scaling measurement frameworks, forecasting, and insight operations."
  }
];

const RECOGNITION = [
  {
    date: "January 2026",
    platform: "Placeholder Publication",
    title: "Interview Placeholder",
    subject: "Placeholder topic about product analytics and AI operations."
  },
  {
    date: "September 2025",
    platform: "Placeholder Event",
    title: "Talk Placeholder",
    subject: "Placeholder topic covering practical AI delivery for lean teams."
  },
  {
    date: "May 2025",
    platform: "Placeholder Podcast",
    title: "Episode Placeholder",
    subject: "Placeholder conversation on decision systems and workflow reliability."
  }
];

function ImagePlaceholder({ label, aspectClass }: { label: string; aspectClass: string }) {
  return (
    <div
      className={`relative ${aspectClass} w-full overflow-hidden rounded-xl border border-[color:var(--c-border)] bg-[color:var(--c-surface-3)]`}
      aria-label={label}
      role="img"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_srgb,var(--c-accent-700)_32%,transparent)_0%,transparent_45%),radial-gradient(circle_at_80%_70%,color-mix(in_srgb,var(--c-accent-800)_35%,transparent)_0%,transparent_55%)]" />
      <p className="absolute left-3 top-3 rounded-full border border-[color:var(--c-border-strong)] bg-[color:var(--c-surface-2)] px-3 py-1 text-[0.65rem] uppercase tracking-[0.16em] text-[color:var(--c-text-muted)]">
        {label}
      </p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <section className="section-wrap py-16">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.34fr)_minmax(0,0.66fr)]">
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-2">
            <p className="eyebrow">About</p>
            <h2 className="text-xl font-display font-semibold text-[color:var(--c-text)]">Get to know me</h2>
          </div>

          <nav className="card-base" aria-label="About sections">
            <ul className="space-y-4">
              {QUICK_LINKS.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="group block">
                    <p className="text-sm font-semibold text-[color:var(--c-text)] transition group-hover:text-[color:var(--c-link-hover)]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-muted">{item.description}</p>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="card-base">
            <ImagePlaceholder label="Portrait image placeholder" aspectClass="aspect-[4/5]" />
            <p className="mt-3 text-xs text-muted">
              Placeholder image area matching the profile visual from the reference layout.
            </p>
          </div>
        </aside>

        <div className="space-y-12">
          <header className="space-y-4">
            <h1 className="display">Building systems where product, data, and AI move as one.</h1>
            <p className="lede max-w-3xl">
              Placeholder introduction text. This section mirrors the long-form personal intro from the reference page and
              can later be replaced with your full narrative.
            </p>
            <p className="max-w-3xl text-sm text-muted">
              Placeholder continuation text: describe your background, current focus, and the type of work you want to be
              known for. Keep this in first person.
            </p>
          </header>

          <section id="fun-facts" className="scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="subhead">Fun facts</h2>
              <p className="text-xs text-muted">Last updated: Placeholder Month YYYY</p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {FUN_FACTS.map((fact) => (
                <article key={fact.title} className="card-base">
                  <ImagePlaceholder label={fact.imageLabel} aspectClass="aspect-[16/10]" />
                  <h3 className="mt-4 text-base font-display font-semibold text-[color:var(--c-text)]">{fact.title}</h3>
                  <p className="mt-2 text-sm text-muted">{fact.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="skills" className="scroll-mt-24">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2 className="subhead">Skills</h2>
                <div className="mt-4 space-y-3">
                  {SKILL_GROUPS.map((group) => (
                    <article key={group.label} className="card-base">
                      <p className="eyebrow">{group.label}</p>
                      <p className="mt-2 text-sm text-muted">{group.description}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="subhead">All capabilities</h2>
                <p className="mt-3 text-sm text-muted">
                  Placeholder capability index that mirrors the grouped capabilities section from the reference page.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {CAPABILITIES.map((item) => (
                    <span key={item} className="tag-chip">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="work-history" className="scroll-mt-24">
            <h2 className="subhead">Work history</h2>
            <div className="mt-4 space-y-4">
              {WORK_HISTORY.map((item) => (
                <article key={`${item.period}-${item.company}`} className="card-base">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[color:var(--c-text)]">{item.company}</p>
                    <p className="eyebrow">{item.period}</p>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--c-text)]">{item.role}</p>
                  <p className="mt-2 text-sm text-muted">{item.summary}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="recognition" className="scroll-mt-24">
            <h2 className="subhead">Recognition</h2>
            <p className="mt-3 text-sm text-muted">
              Placeholder entries for publications, talks, and media references similar to the source layout.
            </p>

            <div className="mt-4 overflow-hidden rounded-2xl border border-[color:var(--c-border)]">
              {RECOGNITION.map((item) => (
                <article
                  key={`${item.platform}-${item.title}`}
                  className="grid gap-3 border-b border-[color:var(--c-border)] bg-[color:var(--c-surface-2)] p-4 last:border-none md:grid-cols-[130px_minmax(0,1fr)]"
                >
                  <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--c-text-faint)]">{item.date}</p>
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--c-text)]">
                      {item.platform} · {item.title}
                    </p>
                    <p className="mt-1 text-sm text-muted">{item.subject}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="card-base">
            <h2 className="subhead">Want this page personalized next?</h2>
            <p className="mt-3 text-sm text-muted">
              Placeholder closing section. Replace with your real bio details, production images, and verified links.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/projects" className="btn-primary">
                View projects
              </Link>
              <Link href="/resume" className="btn-secondary">
                View resume
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
