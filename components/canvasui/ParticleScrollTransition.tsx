"use client";

import { useEffect, useRef } from "react";

type Particle = {
  homeX: number;
  homeY: number;
  scatterX: number;
  scatterY: number;
  delay: number;
  drift: number;
  radius: number;
  color: string;
  progress: number;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const random = (index: number, salt: number) => {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

function drawSpacedText(
  context: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  baselineY: number,
  spacing: number
) {
  const glyphs = [...text];
  const widths = glyphs.map((glyph) => context.measureText(glyph).width);
  const totalWidth = widths.reduce((sum, width) => sum + width, 0) + spacing * (glyphs.length - 1);
  let x = centerX - totalWidth / 2;

  glyphs.forEach((glyph, index) => {
    context.fillText(glyph, x, baselineY);
    x += widths[index] + spacing;
  });
}

/**
 * A section-scoped adaptation of Canvas UI's Particle Scroll behavior.
 * The bridge is rasterized into capped particles that dissolve below a
 * viewport formation line and reassemble row-by-row as it scrolls upward.
 */
export function ParticleScrollTransition() {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const source = document.createElement("canvas");
    const sourceContext = source.getContext("2d", { alpha: true, willReadFrequently: true });
    if (!sourceContext) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = motionQuery.matches;
    let width = 1;
    let height = 1;
    let dpr = 1;
    let particles: Particle[] = [];
    let frame = 0;
    let visible = false;
    let destroyed = false;
    let targetScroll = window.scrollY;
    let smoothScroll = targetScroll;
    let lastTime = performance.now();
    let elapsed = 0;

    const buildParticles = () => {
      source.width = Math.max(1, Math.round(width));
      source.height = Math.max(1, Math.round(height));
      sourceContext.clearRect(0, 0, width, height);

      const styles = getComputedStyle(root);
      const muted = styles.getPropertyValue("--c-text-muted").trim() || "#AEB7C7";
      const faint = styles.getPropertyValue("--c-text-faint").trim() || "#7D8798";
      const accent = styles.getPropertyValue("--c-link").trim() || "#91B6D8";
      const strong = styles.getPropertyValue("--c-text").trim() || "#E8ECF3";
      const compact = width < 560;
      const centerY = height * (compact ? 0.37 : 0.4);
      const lineStart = width * (compact ? 0.045 : 0.09);
      const lineEnd = width * (compact ? 0.955 : 0.91);
      const labelOffset = compact ? width * 0.245 : Math.min(180, width * 0.17);
      const fontSize = compact ? 11 : 15;

      const line = sourceContext.createLinearGradient(lineStart, 0, lineEnd, 0);
      line.addColorStop(0, "transparent");
      line.addColorStop(0.16, faint);
      line.addColorStop(0.48, accent);
      line.addColorStop(0.52, accent);
      line.addColorStop(0.84, faint);
      line.addColorStop(1, "transparent");
      sourceContext.fillStyle = line;
      sourceContext.globalAlpha = 0.62;
      sourceContext.fillRect(lineStart, centerY, lineEnd - lineStart, 1);

      sourceContext.globalAlpha = 0.22;
      sourceContext.fillRect(lineStart + width * 0.06, centerY - 15, lineEnd - lineStart - width * 0.12, 1);
      sourceContext.fillRect(lineStart + width * 0.12, centerY + 17, lineEnd - lineStart - width * 0.24, 1);

      sourceContext.font = `600 ${fontSize}px var(--font-mono), monospace`;
      sourceContext.textBaseline = "middle";
      sourceContext.globalAlpha = 1;
      sourceContext.fillStyle = muted;
      drawSpacedText(sourceContext, "EXPERIENCE", width / 2 - labelOffset, centerY - 7, compact ? 0.9 : 1.8);
      sourceContext.fillStyle = strong;
      drawSpacedText(sourceContext, "EXPERIMENTS", width / 2 + labelOffset, centerY + 9, compact ? 0.8 : 1.7);

      sourceContext.strokeStyle = accent;
      sourceContext.lineWidth = 1;
      sourceContext.globalAlpha = 0.9;
      sourceContext.beginPath();
      sourceContext.moveTo(width / 2 - 14, centerY);
      sourceContext.lineTo(width / 2 + 13, centerY);
      sourceContext.lineTo(width / 2 + 8, centerY - 5);
      sourceContext.moveTo(width / 2 + 13, centerY);
      sourceContext.lineTo(width / 2 + 8, centerY + 5);
      sourceContext.stroke();

      sourceContext.fillStyle = accent;
      for (let index = 0; index < (compact ? 34 : 52); index += 1) {
        const t = index / (compact ? 33 : 51);
        const arcX = lineStart + (lineEnd - lineStart) * t;
        const arcY = centerY + Math.sin(t * Math.PI * 2.2) * height * 0.12 + (t - 0.5) * height * 0.12;
        sourceContext.globalAlpha = 0.18 + random(index, 11) * 0.38;
        sourceContext.beginPath();
        sourceContext.arc(arcX, arcY, random(index, 17) > 0.75 ? 1.5 : 0.8, 0, Math.PI * 2);
        sourceContext.fill();
      }

      sourceContext.globalAlpha = 1;
      const image = sourceContext.getImageData(0, 0, source.width, source.height);
      const spacing = compact ? 3 : 3;
      const candidates: Particle[] = [];
      let particleIndex = 0;

      for (let y = 0; y < source.height; y += spacing) {
        for (let x = 0; x < source.width; x += spacing) {
          const pixelIndex = (y * source.width + x) * 4;
          const alpha = image.data[pixelIndex + 3];
          if (alpha < 34) continue;

          const red = image.data[pixelIndex];
          const green = image.data[pixelIndex + 1];
          const blue = image.data[pixelIndex + 2];
          const opacity = alpha / 255;
          const spread = compact ? 76 : 128;
          const horizontal = (random(particleIndex, 3) - 0.5) * spread * 1.35;
          const downward = spread * (0.28 + random(particleIndex, 5) * 0.92);

          candidates.push({
            homeX: x,
            homeY: y,
            scatterX: x + horizontal,
            scatterY: y + downward,
            delay: random(particleIndex, 7) * 0.42,
            drift: (random(particleIndex, 13) - 0.5) * (compact ? 18 : 30),
            radius: (compact ? 0.65 : 0.75) + random(particleIndex, 19) * 0.75,
            color: `rgba(${red}, ${green}, ${blue}, ${opacity.toFixed(3)})`,
            progress: 0
          });
          particleIndex += 1;
        }
      }

      const maxParticles = compact ? 1200 : 2200;
      if (candidates.length <= maxParticles) {
        particles = candidates;
      } else {
        const stride = candidates.length / maxParticles;
        particles = Array.from({ length: maxParticles }, (_, index) => candidates[Math.floor(index * stride)]);
      }
    };

    const resize = () => {
      const rect = root.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildParticles();
    };

    const draw = (now: number) => {
      frame = 0;
      if (destroyed || reducedMotion || !visible) return;

      const delta = Math.min((now - lastTime) / 1000, 1 / 30);
      lastTime = now;
      elapsed += delta;
      const smoothing = 1 - Math.exp(-delta / 0.16);
      smoothScroll += (targetScroll - smoothScroll) * smoothing;
      if (Math.abs(targetScroll - smoothScroll) < 0.15) smoothScroll = targetScroll;

      const rootDocumentTop = window.scrollY + root.getBoundingClientRect().top;
      const viewportHeight = Math.max(window.innerHeight, 1);
      const formationLine = viewportHeight * (width < 560 ? 0.7 : 0.66);
      const band = clamp(viewportHeight * 0.5, 230, 430);

      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";

      let particlesAnimating = false;
      let minimumProgress = 1;

      particles.forEach((particle, index) => {
        const viewportHomeY = rootDocumentTop + particle.homeY - smoothScroll;
        const rowProgress = clamp((formationLine + band - viewportHomeY) / band);
        const targetProgress = clamp((rowProgress - particle.delay) / Math.max(1 - particle.delay, 0.01));
        const settleTime = targetProgress > particle.progress ? 0.78 : 0.48;
        const step = delta / settleTime;
        if (Math.abs(targetProgress - particle.progress) <= step) {
          particle.progress = targetProgress;
        } else {
          particle.progress += Math.sign(targetProgress - particle.progress) * step;
          particlesAnimating = true;
        }

        const localProgress = particle.progress;
        minimumProgress = Math.min(minimumProgress, localProgress);
        const settled = 1 - Math.pow(1 - localProgress, 3);
        const arc = Math.sin(settled * Math.PI);
        const x =
          particle.scatterX +
          (particle.homeX - particle.scatterX) * settled +
          particle.drift * arc +
          Math.sin(index * 0.71 + elapsed * (2.6 + random(index, 23) * 2.2)) * (1 - settled) * 2.4;
        const y =
          particle.scatterY +
          (particle.homeY - particle.scatterY) * settled -
          Math.abs(particle.drift) * 0.28 * arc;
        const opacity = 0.58 + settled * 0.42;
        const radius = particle.radius * (0.72 + settled * 0.42);

        context.globalAlpha = opacity;
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      });

      const merge = clamp((minimumProgress - 0.88) / 0.12);
      if (merge > 0) {
        context.globalAlpha = merge;
        context.drawImage(source, 0, 0, width, height);
      }

      context.globalAlpha = 1;
      if (smoothScroll !== targetScroll || particlesAnimating) {
        frame = window.requestAnimationFrame(draw);
      }
    };

    const requestDraw = () => {
      if (destroyed || reducedMotion || !visible || frame) return;
      lastTime = performance.now();
      frame = window.requestAnimationFrame(draw);
    };

    const onScroll = () => {
      targetScroll = window.scrollY;
      requestDraw();
    };

    const onMotionChange = () => {
      reducedMotion = motionQuery.matches;
      root.dataset.particleScroll = reducedMotion ? "fallback" : "active";
      if (reducedMotion) {
        window.cancelAnimationFrame(frame);
        frame = 0;
        context.clearRect(0, 0, width, height);
      } else {
        targetScroll = window.scrollY;
        smoothScroll = targetScroll;
        resize();
        requestDraw();
      }
    };

    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          targetScroll = window.scrollY;
          smoothScroll = targetScroll;
          requestDraw();
        } else {
          window.cancelAnimationFrame(frame);
          frame = 0;
        }
      },
      { rootMargin: "18% 0px" }
    );

    const resizeObserver = new ResizeObserver(() => {
      resize();
      requestDraw();
    });

    root.dataset.particleScroll = reducedMotion ? "fallback" : "active";
    resize();
    intersection.observe(root);
    resizeObserver.observe(root);
    window.addEventListener("scroll", onScroll, { passive: true });
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      destroyed = true;
      intersection.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      motionQuery.removeEventListener("change", onMotionChange);
      window.cancelAnimationFrame(frame);
      particles = [];
      canvas.width = 1;
      canvas.height = 1;
      source.width = 1;
      source.height = 1;
      delete root.dataset.particleScroll;
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="particle-scroll-transition"
      aria-label="Transition from career experience to experimental project work"
    >
      <canvas ref={canvasRef} className="particle-scroll-canvas" aria-hidden="true" />
      <div className="particle-scroll-fallback" aria-hidden="true">
        <span>Experience</span>
        <span className="particle-scroll-arrow">→</span>
        <span>Experiments</span>
      </div>
    </section>
  );
}
