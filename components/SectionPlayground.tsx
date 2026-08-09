import { EmberwildLauncher } from "@/components/playground/EmberwildLauncher";
import { getSiteConfig } from "@/lib/site-config";

export async function SectionPlayground() {
  const site = await getSiteConfig();
  const launchUrl = site.playground.emberwildLaunchUrl;

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
            Emberwild: building a survival world for the browser.
          </h2>
        </div>
        <p className="m-0 text-sm leading-relaxed text-muted md:text-right">
          Emberwild is an evolving Three.js game where you forage, craft, brave the elements, and build a foothold in
          the wild. I&apos;m developing its gameplay systems and 3D world with Codex and Claude Code—the latest
          work-in-progress build is playable below.
        </p>
      </div>

      <div className="mt-8">
        <EmberwildLauncher launchUrl={launchUrl} />
      </div>
    </section>
  );
}
