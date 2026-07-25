"use client";

import { useCallback, useState } from "react";
import { Cloth } from "@/components/canvasui/Cloth";
import styles from "@/components/SkillsStudio.module.css";

export type SkillCapability = {
  label: string;
  items: string[];
};

const capabilityCodes = ["DATA", "MEASURE", "AI", "SHIP"] as const;

export function SkillsStudio({ capabilities }: { capabilities: SkillCapability[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeCapability = capabilities[activeIndex] ?? capabilities[0];

  const paintFallback = useCallback(
    (context: CanvasRenderingContext2D, width: number, height: number) => {
      if (!activeCapability) return;
      context.clearRect(0, 0, width, height);

      const base = context.createLinearGradient(0, 0, width, height);
      base.addColorStop(0, "#101d31");
      base.addColorStop(0.56, "#09111f");
      base.addColorStop(1, "#060b13");
      context.fillStyle = base;
      context.fillRect(0, 0, width, height);

      const glow = context.createRadialGradient(width * 0.78, height * 0.15, 0, width * 0.78, height * 0.15, width * 0.7);
      glow.addColorStop(0, "rgba(141, 167, 198, 0.22)");
      glow.addColorStop(1, "rgba(141, 167, 198, 0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      const pad = Math.max(24, width * 0.075);
      context.textBaseline = "top";
      context.fillStyle = "#8da7c6";
      context.font = `600 ${Math.max(11, width * 0.024)}px monospace`;
      context.fillText(capabilityCodes[activeIndex] ?? "SYSTEM", pad, pad);
      context.textAlign = "right";
      context.fillText(
        `${String(activeIndex + 1).padStart(2, "0")} / ${String(capabilities.length).padStart(2, "0")}`,
        width - pad,
        pad,
      );

      context.textAlign = "left";
      context.fillStyle = "#7d8798";
      context.font = `600 ${Math.max(10, width * 0.022)}px monospace`;
      context.fillText("ACTIVE CAPABILITY", pad, height * 0.27);

      const titleSize = Math.max(28, Math.min(58, width * 0.105));
      context.fillStyle = "#e8ecf3";
      context.font = `600 ${titleSize}px monospace`;
      const words = activeCapability.label.split(" ");
      const titleLines: string[] = [];
      let line = "";
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (line && context.measureText(candidate).width > width - pad * 2) {
          titleLines.push(line);
          line = word;
        } else {
          line = candidate;
        }
      }
      if (line) titleLines.push(line);
      titleLines.slice(0, 3).forEach((titleLine, index) => {
        context.fillText(titleLine, pad, height * 0.34 + index * titleSize * 0.9);
      });

      const skillY = height * 0.72;
      context.fillStyle = "#aeb7c7";
      context.font = `500 ${Math.max(10, width * 0.021)}px monospace`;
      let skillX = pad;
      for (const item of activeCapability.items.slice(0, 4)) {
        const label = `• ${item}`;
        const labelWidth = context.measureText(label).width + 18;
        if (skillX + labelWidth > width - pad) break;
        context.fillText(label, skillX, skillY);
        skillX += labelWidth;
      }

      const footerY = height - pad * 1.5;
      context.strokeStyle = "rgba(65, 82, 105, 0.48)";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(pad, footerY - 18);
      context.lineTo(width - pad, footerY - 18);
      context.stroke();
      context.fillStyle = "#7d8798";
      context.font = `600 ${Math.max(9, width * 0.018)}px monospace`;
      context.fillText("BUILT FOR REAL DELIVERY", pad, footerY);
      context.textAlign = "right";
      context.fillText("BRUSH THE SURFACE", width - pad, footerY);
    },
    [activeCapability, activeIndex, capabilities.length],
  );

  if (!activeCapability) return null;

  return (
    <div className={styles.studio} data-testid="skills-studio">
      <div className={styles.studioHeader} aria-hidden="true">
        <span>Capability surface</span>
        <span>{String(capabilities.length).padStart(2, "0")} working systems</span>
        <span className={styles.ready}>
          <span className={styles.readyDot} />
          Production ready
        </span>
      </div>

      <div className={styles.studioGrid}>
        <div className={styles.clothBay} aria-hidden="true">
          <Cloth
            className={styles.cloth}
            fallbackPainter={paintFallback}
            pin="top"
            wind={1.65}
            speed={0.38}
            amplitude={18}
            drape={20}
            brush={1.35}
            brushSize={120}
            damping={1.45}
            light={0.42}
            sheen={0.12}
            shadow={0.22}
            cornerRadius={24}
            perspective={1500}
            backing={[0.035, 0.065, 0.12]}
          >
            <div className={styles.clothSurface}>
              <div className={styles.clothTopline}>
                <span>{capabilityCodes[activeIndex] ?? "SYSTEM"}</span>
                <span>{String(activeIndex + 1).padStart(2, "0")} / {String(capabilities.length).padStart(2, "0")}</span>
              </div>

              <div className={styles.clothIdentity}>
                <p>Active capability</p>
                <h3>{activeCapability.label}</h3>
              </div>

              <ul className={styles.clothSkills}>
                {activeCapability.items.slice(0, 4).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <div className={styles.clothFooter}>
                <span>Built for real delivery</span>
                <span>Brush the surface</span>
              </div>
            </div>
          </Cloth>
        </div>

        <div className={styles.capabilityMap} aria-label="Production skill capabilities">
          {capabilities.map((capability, index) => {
            const active = index === activeIndex;

            return (
              <article
                key={capability.label}
                className={styles.capability}
                data-active={active ? "true" : "false"}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
              >
                <div className={styles.capabilityHeading}>
                  <span className={styles.capabilityIndex} aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3>
                    <button
                      type="button"
                      className={styles.capabilityButton}
                      aria-pressed={active}
                      onClick={() => setActiveIndex(index)}
                    >
                      {capability.label}
                    </button>
                  </h3>
                  <span className={styles.focusCue} aria-hidden="true">
                    {active ? "On surface" : "View surface"}
                  </span>
                </div>

                <ul className={styles.skillInventory}>
                  {capability.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
