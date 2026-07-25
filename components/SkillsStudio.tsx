"use client";

import { useCallback } from "react";
import { Cloth } from "@/components/canvasui/Cloth";
import styles from "@/components/SkillsStudio.module.css";

export type SkillCapability = {
  label: string;
  items: string[];
};

export function SkillsStudio({ capabilities }: { capabilities: SkillCapability[] }) {
  const paintFabric = useCallback(
    (context: CanvasRenderingContext2D, width: number, height: number) => {
      context.clearRect(0, 0, width, height);

      const base = context.createLinearGradient(0, 0, width, height);
      base.addColorStop(0, "#14243a");
      base.addColorStop(0.48, "#0c1728");
      base.addColorStop(1, "#070d17");
      context.fillStyle = base;
      context.fillRect(0, 0, width, height);

      const highlight = context.createRadialGradient(
        width * 0.18,
        height * 0.08,
        0,
        width * 0.18,
        height * 0.08,
        width * 0.8,
      );
      highlight.addColorStop(0, "rgba(131, 165, 207, 0.24)");
      highlight.addColorStop(0.55, "rgba(70, 99, 135, 0.08)");
      highlight.addColorStop(1, "rgba(6, 11, 19, 0)");
      context.fillStyle = highlight;
      context.fillRect(0, 0, width, height);

      const lowlight = context.createRadialGradient(
        width * 0.88,
        height * 0.92,
        0,
        width * 0.88,
        height * 0.92,
        width * 0.62,
      );
      lowlight.addColorStop(0, "rgba(1, 5, 11, 0.46)");
      lowlight.addColorStop(1, "rgba(1, 5, 11, 0)");
      context.fillStyle = lowlight;
      context.fillRect(0, 0, width, height);

      context.lineWidth = 1;
      for (let y = 1; y < height; y += 4) {
        context.strokeStyle = y % 8 === 1
          ? "rgba(208, 224, 242, 0.026)"
          : "rgba(3, 8, 15, 0.08)";
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }

      for (let x = 1; x < width; x += 5) {
        context.strokeStyle = x % 10 === 1
          ? "rgba(185, 205, 229, 0.018)"
          : "rgba(2, 7, 14, 0.055)";
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
    },
    [],
  );

  if (capabilities.length === 0) return null;

  return (
    <div className={styles.studio} data-testid="skills-studio">
      <div className={styles.fabricLayer} aria-hidden="true">
        <Cloth
          className={styles.cloth}
          fallbackPainter={paintFabric}
          pin="top"
          wind={0.9}
          speed={0.3}
          amplitude={12}
          drape={15}
          brush={0.85}
          brushSize={150}
          damping={1.65}
          light={0.38}
          sheen={0.08}
          shadow={0.2}
          cornerRadius={24}
          perspective={1700}
          backing={[0.045, 0.085, 0.145]}
        >
          <div className={styles.fabricTexture} />
        </Cloth>
      </div>

      <div className={styles.content}>
        <div className={styles.surfaceHeader}>
          <span>Capability cloth</span>
          <span>{String(capabilities.length).padStart(2, "0")} production disciplines</span>
          <span className={styles.ready}>
            <span className={styles.readyDot} />
            Built for delivery
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
    </div>
  );
}
