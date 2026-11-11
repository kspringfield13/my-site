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
      <div className="grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_minmax(16rem,0.56fr)]">
        <div>
          <p className="eyebrow">Playground</p>
          <h2 id="playground-title" className="subhead mt-2">
            Momentum: a sales contest platform, built end to end.
          </h2>
        </div>
        <p className="m-0 text-sm leading-relaxed text-muted md:text-right">
          Momentum turns a sales enablement program into a staged race with verified points, team coaching, and
          auditable standings. I&apos;m building the React, FastAPI, and PostgreSQL prototype with Claude Code and
          Codex. The live demo below runs on fictional data.
        </p>
      </div>

      <div className="mt-8">
        <MomentumLauncher launchUrl={launchUrl} />
      </div>
    </section>
  );
}
