import { getNowEntries } from "@/lib/content";
import { formatNowEntryDate, partitionNowEntries } from "@/lib/now";

export const metadata = {
  title: "Now Archive",
  description: "Archived experiments and iteration notes."
};

export default async function NowArchivePage() {
  const now = await getNowEntries();
  const { archivedEntries } = partitionNowEntries(now);

  return (
    <section className="section-wrap py-16">
      <h1 className="display">Now Archive</h1>
      <p className="lede mt-4 max-w-2xl">Past experiments are kept visible for continuity.</p>
      <div className="mt-10 space-y-4">
        {archivedEntries.map((entry) => {
          return (
            <article key={entry.id} className="card-base">
              <p className="eyebrow">{formatNowEntryDate(entry.date)} · {entry.category}</p>
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
