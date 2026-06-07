import { getNowEntries } from "@/lib/content";

export const metadata = {
  title: "Now Archive",
  description: "Archived experiments and iteration notes."
};

export default async function NowArchivePage() {
  const now = await getNowEntries();
  const entries = [...now.entries].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

  return (
    <section className="section-wrap py-16">
      <h1 className="display">Now Archive</h1>
      <p className="lede mt-4 max-w-2xl">Past experiments are kept visible for continuity.</p>
      <div className="mt-10 space-y-4">
        {entries.map((entry) => {
          return (
            <article key={entry.id} className="card-base">
              <p className="eyebrow">{new Date(entry.date).toLocaleDateString()} · {entry.category}</p>
              {entry.title ? <h2 className="mt-3 text-lg font-semibold">{entry.title}</h2> : null}
              <div className={`${entry.title ? "mt-2" : "mt-3"} space-y-2`}>
                {entry.details.map((paragraph, index) => (
                  <p key={`${entry.id}-${index}`} className="text-sm text-muted">
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
