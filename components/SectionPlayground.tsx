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
            A wild place to build something of your own.
          </h2>
        </div>
        <p className="m-0 text-sm leading-relaxed text-muted md:text-right">
          Emberwild is a solitary survival and crafting game in development for the browser.
        </p>
      </div>

      <div className="mt-8">
        <EmberwildLauncher launchUrl={launchUrl} />
      </div>
    </section>
  );
}
