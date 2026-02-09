export const metadata = {
  title: "Colophon",
  description: "How this site is built, designed, and measured."
};

export default function ColophonPage() {
  return (
    <section className="section-wrap py-16">
      <h1 className="display">Colophon</h1>
      <p className="lede mt-4 max-w-2xl">Built with Next.js App Router, TypeScript, Tailwind CSS, MDX content, and lightweight SVG visualizations.</p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <article className="card-base">
          <h2 className="subhead">Stack</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            <li>Next.js + TypeScript + Tailwind</li>
            <li>MDX case studies and writing</li>
            <li>Build-time search index for fast content discovery</li>
            <li>GitHub + resume ingestion scripts</li>
          </ul>
        </article>
        <article className="card-base">
          <h2 className="subhead">Performance strategy</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            <li>Server-rendered primary content</li>
            <li>Client-side panels loaded only when needed</li>
            <li>SVG visualizations with no runtime chart library</li>
            <li>Reduced-motion and accessibility defaults</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
