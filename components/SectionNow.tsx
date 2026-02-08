import Link from "next/link";
import { getNowEntries, getNowEntryAgeDays, getWeeklySummary } from "@/lib/content";

export async function SectionNow() {
  const [now, weekly] = await Promise.all([getNowEntries(), getWeeklySummary()]);
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
              <h3 className="mt-2 text-xl font-semibold">{entry.title}</h3>
              <p className="mt-3 text-sm"><strong>Tried:</strong> {entry.tried}</p>
              <p className="mt-1 text-sm"><strong>Outcome:</strong> {entry.outcome}</p>
              <p className="mt-1 text-sm"><strong>Next:</strong> {entry.nextStep}</p>
            </article>
          );
        })}
      </div>

      {weekly.summary ? (
        <article className="card-base mt-6">
          <p className="eyebrow">Weekly summary · {weekly.weekOf || "Current"}</p>
          <p className="mt-2 text-sm">{weekly.summary}</p>
          {weekly.bullets.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              {weekly.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </article>
      ) : null}
    </section>
  );
}
