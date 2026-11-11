import Image from "next/image";
import { GeistSans } from "geist/font/sans";
import styles from "@/components/playground/MomentumLauncher.module.css";

interface MomentumLauncherProps {
  launchUrl: string;
}

const ROLES = [
  { role: "Seller", view: "My Race, the leaderboard and a Race Coach" },
  { role: "Manager", view: "A Command Center for one team" },
  { role: "Admin", view: "Contest Studio and Race Control" }
] as const;

export function MomentumLauncher({ launchUrl }: MomentumLauncherProps) {
  return (
    <article className={`${styles.launcher} ${GeistSans.className}`} aria-labelledby="momentum-title">
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.stage}>
        <figure className={`${styles.window} ${styles.windowBack}`} aria-hidden="true">
          <span className={styles.chrome}>
            <i />
            <i />
            <i />
          </span>
          <Image
            src="/playground/momentum-leaderboard.webp"
            alt=""
            width={1800}
            height={1125}
            sizes="(max-width: 720px) 0px, 640px"
            className={styles.shot}
          />
        </figure>
        <figure className={`${styles.window} ${styles.windowFront}`}>
          <span className={styles.chrome} aria-hidden="true">
            <i />
            <i />
            <i />
            <b>momentum · my race</b>
          </span>
          <Image
            src="/playground/momentum-race.webp"
            alt="Momentum's My Race screen: the next Task, points earned and locked, rank, and a three-Stage track"
            width={1800}
            height={1125}
            sizes="(max-width: 720px) 92vw, 736px"
            className={styles.shot}
          />
        </figure>
      </div>
      <div className={styles.shade} aria-hidden="true" />

      <div className={styles.content}>
        <div className={styles.meta}>
          <p className={styles.kicker}>Sales contest platform</p>
          <span className={styles.status}>
            <i aria-hidden="true" />
            Live demo
          </span>
        </div>

        <h3 id="momentum-title" className={styles.title}>
          <Image
            src="/playground/momentum-logo.webp"
            alt=""
            width={256}
            height={256}
            sizes="56px"
            className={styles.mark}
          />
          Momentum
        </h3>

        <p className={styles.copy}>
          Sales enablement, run as a staged race. Points come only from verified work, and every standing can be
          audited.
        </p>

        <dl className={styles.roles}>
          {ROLES.map(({ role, view }) => (
            <div key={role}>
              <dt>{role}</dt>
              <dd>{view}</dd>
            </div>
          ))}
        </dl>

        <a className={styles.cta} href={launchUrl} target="_blank" rel="noopener noreferrer">
          <span className={styles.ctaText}>
            <strong>Open the live demo</strong>
            <small>
              Enter as any role. Fictional data, reset daily.
              <span className="sr-only"> (opens in a new tab)</span>
            </small>
          </span>
          <span className={styles.arrow} aria-hidden="true">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </a>
      </div>
    </article>
  );
}
