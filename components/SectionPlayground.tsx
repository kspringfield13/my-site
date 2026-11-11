import { MomentumLauncher } from "@/components/playground/MomentumLauncher";
import { getSiteConfig } from "@/lib/site-config";

export async function SectionPlayground() {
  const site = await getSiteConfig();
  const launchUrl = site.playground.momentumDemoUrl;

  return (
    <section
      id="playground"
      className="section-wrap py-14"
      aria-labelledby="playground-title"
    >
      <div>
        <p className="eyebrow">Playground</p>
        <h2 id="playground-title" className="subhead mt-2 text-balance">
          A sales contest platform I&apos;m building with AI agents.
        </h2>
        <p className="mb-0 mt-3 max-w-[40rem] text-sm leading-relaxed text-muted text-pretty">
          React, FastAPI, and PostgreSQL, written daily with Claude Code and Codex. The demo below is the real app
          on fictional data.
        </p>
      </div>

      <div className="mt-8">
        <MomentumLauncher launchUrl={launchUrl} />
      </div>
    </section>
  );
}
