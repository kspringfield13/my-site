import Image from "next/image";

export const metadata = {
  title: "About",
  description: "A structured overview with placeholder content for bio, skills, capabilities, and work history."
};

const QUICK_LINKS = [
  {
    href: "#fun-facts",
    title: "Fun Facts",
    description: "Quick personality notes and favorites."
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
  }
];

const FUN_FACTS = [
  {
    title: "Rich Dad Poor Dad",
    imageSrc: "/rich_dad_poor_dad.png",
    imageLabel: "favorite book",
    description:
      "Robert Kiyosaki"
  },
  {
    title: "The Joe Rogan Experience",
    imageSrc: "/the-joe-rogan-experience.png",
    imageLabel: "favorite podcast",
    description:
      "Joe Rogan & Jamie"
  },
  {
    title: "Everybody Loves Raymond",
    imageSrc: "/everybody-loves-raymond.png",
    imageLabel: "favorite show",
    description:
      "Ray Barone is a successful sports writer and family man who deals with a brother and parents who happen to live across the street"
  },
  {
    title: "Vibe Coding",
    imageSrc: "/vibe-coding.png",
    imageLabel: "active hobby",
    description:
      "Building software by feel. Moving fast, experimenting freely, and refining as clarity emerges rather than following rigid plans"
  }
];

function ImagePlaceholder({ label, src, alt, aspectClass }: { label: string; src: string; alt: string; aspectClass: string }) {
  return (
    <div
      className={`relative ${aspectClass} w-full overflow-hidden rounded-xl border border-[color:var(--c-border)] bg-[color:var(--c-surface-3)]`}
      aria-label={label}
      role="img"
    >
      <Image src={src} alt={alt} fill className="object-cover object-center" sizes="(max-width: 768px) 100vw, 50vw" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--c-bg)_6%,transparent)_0%,transparent_46%,color-mix(in_srgb,var(--c-bg)_36%,transparent)_100%)]" />
      <p className="absolute left-3 top-3 rounded-full border border-[color:var(--c-border-strong)] bg-[color:var(--c-surface-2)] px-3 py-1 text-[0.65rem] uppercase tracking-[0.16em] text-[color:var(--c-text-muted)]">
        {label}
      </p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <section className="section-wrap py-14">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.34fr)_minmax(0,0.66fr)]">
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-2">
            <p className="eyebrow">About</p>
          </div>
          <div className="card-base">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-[color:var(--c-border)] bg-[color:var(--c-surface-3)]">
              <Image src="/me-cali.png" alt="Kyle Springfield portrait" fill className="object-cover object-center" sizes="(max-width: 1024px) 100vw, 34vw" />
            </div>
            <p className="mt-3 text-xs text-muted">
              Me and my dog, Cali
            </p>
          </div>
        </aside>

        <div className="space-y-12">
          <header className="space-y-4">
            <h1 className="display">Building systems where product, data, and AI move as one.</h1>
            <p className="lede max-w-3xl">
              Welcome. I’m Kyle! a business analyst by title, a systems builder by instinct, and a lifelong tinkerer by habit.
            </p>
            <p className="max-w-3xl text-sm text-muted">
              My career began with inventory data, but quickly expanded beyond any single role or function. I’ve worked across nearly the entire data lifecycle: analytics, reporting, pipelines, modeling, experimentation, automation, survey research, dashboards, and decision support. I am consistently bridging the gap between technical teams and decision-makers. That means working closely with executives, product leaders, and operators, seeing firsthand when data clarifies reality and when it quietly distorts it. Those experiences shaped how I approach problems today: less fixation on tools or titles, more focus on building durable systems that reduce friction, surface truth, and make good decisions the default rather than the exception.
            </p>
            <p className="max-w-3xl text-sm text-muted">
              Today I’m a Business Analyst at Cisco, partnering with sales leadership to turn business needs into governed datasets and decision-ready reporting. I build Tableau dashboards and Streamlit apps, maintain scalable dbt models in Snowflake for pipeline and productivity visibility, and use Cursor to accelerate modeling and recurring analytics workflows. Alongside that role, I explore AI tools, data platforms, and experimental projects at the intersection of analytics, engineering, and creativity. Most projects here didn’t start as “portfolio work.” They started as curiosity, annoyance, or obsession.
            </p>
            <p className="max-w-3xl text-sm text-muted">
              Outside of work, I’m driven by the same curiosity, just expressed through movement, exploration, and play. I run, do pull-ups, and spend a lot of time outdoors because physical effort keeps my thinking sharp. I love long walks in nature, hiking new trails, traveling to unfamiliar places, and picking up new hobbies simply to see what they teach me about myself. Progress, to me, isn’t only intellectual, it’s physical, emotional, and relational.
            </p>
            <p className="max-w-3xl text-sm text-muted">
              I spend most weekends with my girlfriend, exploring, relaxing, and building a life together. I’m close with my family and often collaborate on projects with my twin brother, which keeps my work grounded and personal. I’m a dog dad, a used-Tesla driver, and someone who values simple routines as much as ambitious ideas. Board games, video games, and a good time with friends and family are how I reset and stay connected.
            </p>
            <p className="max-w-3xl text-sm text-muted">
              I’ve always been drawn to spaces where technology feels playful and alive. FPV drone flying hooked me because it’s systems thinking under pressure, feedback loops, precision, intuition, and trust. I explored NFTs and crypto early, not for speculation, but for the underlying ideas: digital ownership, coordination at scale, incentives, and programmable trust. I’m a long-term believer in those concepts and enjoy learning by experimenting, breaking things, and rebuilding them better.
            </p>
            <p className="max-w-3xl text-sm text-muted">
              Lately, I’ve been completely absorbed by AI and rapidly advancing technology like ChatGPT, Claude, Cursor, OpenClaw, and whatever comes next. Not as magic, but as a new interface for thinking, building, and creativity. These tools feel like collaborators, ways to explore ideas faster, prototype systems sooner, and stretch what a single person can create.
            </p>
            <p className="max-w-3xl text-sm text-muted">
              This site captures that intersection: work and life, rigor and play, structure and curiosity. It’s a place to share what I’m building, what I’m learning, and what I’m currently excited about. I’m deeply grateful to be living in this moment of technological change and I try to enjoy every step of the journey while it unfolds.
            </p>
            <p className="lede max-w-3xl">
              Thanks for being here.
            </p>
          </header>

          <section id="fun-facts" className="scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="subhead">Fun facts</h2>
              <p className="text-xs text-muted">Last updated: February 2026</p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {FUN_FACTS.map((fact) => (
                <article key={fact.title} className="card-base">
                  <ImagePlaceholder label={fact.imageLabel} src={fact.imageSrc} alt={fact.title} aspectClass="aspect-[16/16]" />
                  <h3 className="mt-4 text-base font-display font-semibold text-[color:var(--c-text)]">{fact.title}</h3>
                  <p className="mt-2 text-sm text-muted">{fact.description}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
