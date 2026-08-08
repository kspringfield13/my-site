import styles from "@/components/playground/EmberwildLauncher.module.css";

interface EmberwildLauncherProps {
  launchUrl: string;
}

export function EmberwildLauncher({ launchUrl }: EmberwildLauncherProps) {
  return (
    <article className={styles.launcher} aria-labelledby="emberwild-title">
      <div className={styles.artwork} aria-hidden="true" />
      <div className={styles.shade} aria-hidden="true" />
      <div className={styles.frame} aria-hidden="true" />

      <div className={styles.content}>
        <div className={styles.meta}>
          <p className={styles.kicker}>ORRIS ISLE · WILD SEASON</p>
          <span className={styles.status}>
            <i aria-hidden="true" />
            IN DEVELOPMENT
          </span>
        </div>

        <h3 id="emberwild-title" className={styles.title}>
          EMBERWILD
        </h3>

        <div className={styles.rule} aria-hidden="true">
          <span />
          <i />
          <span />
        </div>

        <p className={styles.copy}>
          Arrive nearly empty-handed. Forage the wild. Outlast the cold. Raise your own fort.
        </p>

        <a
          className={styles.cta}
          href={launchUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={styles.ctaText}>
            <strong>ENTER THE WILD</strong>
            <small>
              Launch the full-screen browser game
              <span className="sr-only"> (opens in a new tab)</span>
            </small>
          </span>
          <span className={styles.arrow} aria-hidden="true">
            ›
          </span>
        </a>
      </div>
    </article>
  );
}
