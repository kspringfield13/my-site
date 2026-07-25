"use client";

import { HexFloat } from "@/components/canvasui/HexFloat";
import styles from "@/components/SkillsStudio.module.css";

export type SkillCapability = {
  label: string;
  items: string[];
};

export function SkillsStudio({ capabilities }: { capabilities: SkillCapability[] }) {
  if (capabilities.length === 0) return null;

  return (
    <div className={styles.studio} data-testid="skills-studio">
      <HexFloat
        className={styles.hexSurface}
        size={78}
        gap={3}
        bevel={2.2}
        tilt={16}
        perspective={0.42}
        float={0.32}
        speed={0.42}
        shine={0.82}
        lift={0.22}
        radius={265}
        flow={1.15}
        swirl={6.5}
        trail={0.72}
        iridescence={0.48}
        bloom={0.16}
        grain={0.16}
        gapColor={[0.018, 0.038, 0.07]}
      >
        <div className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <span>Capabilities</span>
            <span>{String(capabilities.length).padStart(2, "0")} production disciplines</span>
            <span className={styles.explore}>
              <span className={styles.readyDot} />
              Move to reveal
            </span>
          </div>

          <div className={styles.capabilityGrid} aria-label="Production skill capabilities">
            {capabilities.map((capability, index) => (
              <article className={styles.capability} key={capability.label}>
                <div className={styles.capabilityHeading}>
                  <span className={styles.capabilityIndex} aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3>{capability.label}</h3>
                </div>

                <ul className={styles.skillInventory}>
                  {capability.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </HexFloat>
    </div>
  );
}
