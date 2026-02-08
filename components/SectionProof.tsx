import { getProofMetrics } from "@/lib/content";
import { ImpactTimeline } from "@/components/viz/ImpactTimeline";

export async function SectionProof() {
  const metrics = await getProofMetrics();

  return (
    <section id="proof" className="section-wrap py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Proof</p>
          <h2 className="subhead mt-2">Systems built across analytics, data engineering, and AI delivery.</h2>
        </div>
      </div>

      <div className="mt-8 pt-4">
        <div>
          <ImpactTimeline items={metrics.timelineHighlights} />
        </div>
      </div>
    </section>
  );
}
