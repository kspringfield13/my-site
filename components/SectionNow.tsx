import Link from "next/link";
import { getNowEntries, getNowEntryAgeDays } from "@/lib/content";

export async function SectionNow() {
  const now = await getNowEntries();
  const entries = [...now.entries].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 6);

  return (
    <section id="now" className="section-wrap py-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Now</p>
          <h2 className="subhead mt-2">What I&apos;m experimenting with right now.</h2>
        </div>
        <Link href="/archive/now" className="btn-secondary">
          Archive
        </Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {entries.map((entry) => {
          const age = getNowEntryAgeDays(entry.date);
          const stale = age > now.expireDays;
          return (
            <article key={entry.id} className={`card-base ${stale ? "opacity-65" : ""}`}>
              <p className="eyebrow">{new Date(entry.date).toLocaleDateString()} · {entry.category}</p>
              <div className="mt-3 space-y-2">
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
