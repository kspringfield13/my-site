import Link from "next/link";
import { getNowEntries } from "@/lib/content";
import { formatNowEntryDate, partitionNowEntries } from "@/lib/now";

export async function SectionNow() {
  const now = await getNowEntries();
  const { currentEntries } = partitionNowEntries(now);
  const [primaryEntry, ...supportingEntries] = currentEntries;

  return (
    <section id="now" className="section-wrap py-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Now</p>
          <h2 className="subhead mt-2">What I&apos;m exploring right now.</h2>
        </div>
        <Link
          href="/archive/now"
          className="text-sm text-muted underline decoration-border underline-offset-4 transition hover:text-link-hover"
        >
          Browse the archive
        </Link>
      </div>

      {primaryEntry ? (
        <div className="mt-8 grid gap-4 md:grid-cols-[minmax(0,1.65fr)_minmax(16rem,0.85fr)]">
          <article className="card-base relative overflow-hidden border-border-strong p-5 md:p-6">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-link to-transparent opacity-70"
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="eyebrow">Current focus</p>
              <p className="text-xs text-faint">
                {formatNowEntryDate(primaryEntry.date)}
              </p>
            </div>
            <h3 className="mt-4 text-xl font-semibold text-fg md:text-2xl">
              {primaryEntry.title ?? primaryEntry.category}
            </h3>
            <div className="mt-4 space-y-3">
              {primaryEntry.details.map((paragraph, index) => (
                <p
                  key={`${primaryEntry.id}-${index}`}
                  className={index === 0 ? "text-base leading-relaxed text-fg" : "text-sm leading-relaxed text-muted"}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </article>

          {supportingEntries.length > 0 ? (
            <div className="grid gap-4">
              {supportingEntries.map((entry) => (
                <article key={entry.id} className="card-base p-5">
                  <p className="eyebrow">{entry.title ?? entry.category}</p>
                  <ul className="mt-4 space-y-3">
                    {entry.details.map((detail, index) => (
                      <li
                        key={`${entry.id}-${index}`}
                        className="flex gap-3 text-sm leading-relaxed text-muted"
                      >
                        <span className="mt-[0.65em] h-1 w-1 shrink-0 rounded-full bg-link" aria-hidden="true" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted">New notes are on the way. Previous entries remain in the archive.</p>
      )}
    </section>
  );
}
