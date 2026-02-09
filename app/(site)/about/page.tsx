import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "About",
  description: "A quick introduction to Kyle Springfield, his focus areas, and how he collaborates."
};

const HIGHLIGHTS = [
  {
    title: "Focus",
    description: "Product analytics, data systems, and AI enablement for teams that ship fast."
  },
  {
    title: "Based",
    description: "Working remotely across North America with occasional on-site strategy sprints."
  },
  {
    title: "Collaborations",
    description: "Partnering with founders, product leads, and data teams to turn ambiguity into momentum."
  }
];

const TIMELINE = [
  {
    year: "Now",
    title: "Independent consultant",
    description: "Helping teams launch analytics, experimentation, and AI readiness initiatives."
  },
  {
    year: "2021-2024",
    title: "Head of Data Systems",
    description: "Built modern data stacks and operational intelligence tooling for growth orgs."
  },
  {
    year: "2016-2021",
    title: "Product analytics lead",
    description: "Scaled insight programs, dashboards, and forecasting for multi-product portfolios."
  }
];

export default function AboutPage() {
  return (
    <section className="section-wrap py-16">
      <div className="flex flex-col gap-4">
        <span className="eyebrow">About</span>
        <h1 className="display">Designing systems that make data feel inevitable.</h1>
        <p className="lede max-w-3xl">
          I partner with teams that want their data layer to feel as intentional as their product layer. From blueprinting
          analytics stacks to building AI-ready workflows, I help translate big goals into calm, repeatable systems that
          empower every decision-maker.
        </p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="flex flex-col gap-8">
          <div className="card-base">
            <h2 className="subhead">Strategic backbone</h2>
            <p className="mt-3 text-sm text-muted">
              Inspired by the editorial rhythm of joseocando.com, this page blends a concise bio with modular highlights
              so visitors can quickly scan what I do and how I work.
            </p>
            <p className="mt-4 text-sm text-muted">
              I am most energized by product and data teams that are ready to modernize their stack, sharpen their
              measurement discipline, and build analytical confidence across every function.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <div key={item.title} className="card-base h-full">
                <p className="eyebrow">{item.title}</p>
                <p className="mt-3 text-sm text-muted">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="card-base">
            <h2 className="subhead">Selected timeline</h2>
            <div className="mt-4 space-y-4">
              {TIMELINE.map((item) => (
                <div key={item.year} className="border-b border-[color:var(--c-border)] pb-4 last:border-none">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="eyebrow">{item.year}</span>
                    <span className="text-sm font-semibold text-[color:var(--c-text)]">{item.title}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="card-base">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-[color:var(--c-border)]">
              <Image
                src="/hero-me.png"
                alt="Portrait of Kyle Springfield"
                fill
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover"
                priority
              />
            </div>
            <div className="mt-5 space-y-3 text-sm text-muted">
              <p>
                My work bridges analytics strategy with the craft of delivery. I care just as much about the experience
                of the data consumer as I do about warehouse performance.
              </p>
              <p>
                I’m based in the Pacific Northwest and collaborate globally with teams who want to ship better decisions,
                faster.
              </p>
            </div>
          </div>

          <div className="card-base">
            <h2 className="subhead">Let’s work together</h2>
            <p className="mt-3 text-sm text-muted">
              If you are planning a new data platform, rethinking your experimentation workflow, or aligning teams around
              a new operating model, I would love to help.
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
