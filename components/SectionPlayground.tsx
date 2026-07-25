import { PlaygroundTower } from "@/components/playground/PlaygroundTower";

export function SectionPlayground() {
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
            Small experiments. Real systems underneath.
          </h2>
        </div>
        <p className="m-0 text-sm leading-relaxed text-muted md:text-right">
          First up: build upward with real-time 3D physics. How high can you keep it together?
        </p>
      </div>

      <div className="mt-8">
        <PlaygroundTower />
      </div>
    </section>
  );
}
