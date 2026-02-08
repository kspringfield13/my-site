import { getNowEntries } from "@/lib/content";

export const metadata = {
  title: "Now Archive",
  description: "Archived experiments and iteration notes."
};

export default async function NowArchivePage() {
  const now = await getNowEntries();

  return (
    <section className="section-wrap py-16">
      <h1 className="display">Now Archive</h1>
      <p className="lede mt-4 max-w-2xl">Past experiments are kept visible for continuity.</p>
      <div className="mt-10 space-y-4">
        {now.entries.map((entry) => (
          <article key={entry.id} className="card-base">
            <p className="eyebrow">{new Date(entry.date).toLocaleDateString()}</p>
            <h2 className="mt-2 text-xl font-semibold">{entry.title}</h2>
            <p className="mt-2 text-sm text-muted">{entry.category}</p>
            <p className="mt-3 text-sm">
              <strong>Tried:</strong> {entry.tried}
            </p>
            <p className="mt-1 text-sm">
              <strong>Outcome:</strong> {entry.outcome}
            </p>
            <p className="mt-1 text-sm">
              <strong>Next:</strong> {entry.nextStep}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
