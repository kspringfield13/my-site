"use client";

import { useEffect, useRef, type ReactNode } from "react";

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

const TEXT_SELECTOR = "h1, h2, h3, h4, p, dt, dd, button, a";
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const random = (index: number, salt: number) => {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

function visibleText(element: HTMLElement) {
  const text = element.innerText.trim();
  if (!text) return "";

  const transform = getComputedStyle(element).textTransform;
  if (transform === "uppercase") return text.toUpperCase();
  if (transform === "lowercase") return text.toLowerCase();
  return text;
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
  lineHeight: number,
  align: CanvasTextAlign
) {
  const paragraphs = text.split(/\n+/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/);
    let line = "";

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && context.measureText(candidate).width > width) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }

    if (line) lines.push(line);
  }

  const x = align === "center" ? width / 2 : align === "right" || align === "end" ? width : 0;
  lines.slice(0, Math.max(1, Math.floor(height / lineHeight))).forEach((line, index) => {
    context.fillText(line, x, index * lineHeight);
  });
}

/**
 * A viewport-sized, post-hero adaptation of Canvas UI's Particle Scroll.
 * Semantic DOM stays interactive while a moving mask and capped particle
 * facsimile make content settle into place across a broad formation band.
 */
export function ParticleScrollStage({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const content = contentRef.current;
    const canvas = canvasRef.current;
    if (!stage || !content || !canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = motionQuery.matches;
    let width = Math.max(window.innerWidth, 1);
    let height = Math.max(window.innerHeight, 1);
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let particles: Particle[] = [];
    let frame = 0;
    let rebuildFrame = 0;
    let visible = false;
    let destroyed = false;
    let targetScroll = window.scrollY;
    let smoothScroll = targetScroll;
    let lastTime = performance.now();
    let elapsed = 0;

    const formationMetrics = () => {
      const compact = width < 640;
      return {
        line: height * (compact ? 0.7 : 0.66),
        band: clamp(height * 0.52, compact ? 240 : 280, compact ? 360 : 460)
      };
    };

    const targetProgressFor = (particle: Particle, scroll: number, rootTop: number) => {
      const { line, band } = formationMetrics();
      const viewportHomeY = rootTop + particle.homeY - scroll;
      const rowProgress = clamp((line + band * 0.48 - viewportHomeY) / band);
      return clamp((rowProgress - particle.delay) / Math.max(1 - particle.delay, 0.01));
    };

    const addParticle = (
      candidates: Particle[],
      homeX: number,
      homeY: number,
      color: string,
      index: number,
      compact: boolean
    ) => {
      const spread = compact ? 88 : 146;
      candidates.push({
        homeX,
        homeY,
        scatterX: homeX + (random(index, 3) - 0.5) * spread * 1.45,
        scatterY: homeY + spread * (0.34 + random(index, 5) * 0.96),
        delay: random(index, 7) * 0.34,
        drift: (random(index, 13) - 0.5) * (compact ? 24 : 38),
        radius: (compact ? 0.62 : 0.72) + random(index, 19) * 0.76,
        color,
        progress: 0
      });
    };

    const buildParticles = () => {
      if (reducedMotion || destroyed) {
        particles = [];
        return;
      }

      const contentRect = content.getBoundingClientRect();
      const compact = width < 640;
      const sampleStep = compact ? 3 : 4;
      const candidates: Particle[] = [];
      let particleIndex = 0;

      const textElements = Array.from(content.querySelectorAll<HTMLElement>(TEXT_SELECTOR))
        .filter((element) => {
          if (element.closest("[aria-hidden='true']")) return false;
          const parentTextSource = element.parentElement?.closest(TEXT_SELECTOR);
          return !parentTextSource || !content.contains(parentTextSource);
        })
        .slice(0, 140);

      for (const element of textElements) {
        const rect = element.getBoundingClientRect();
        const styles = getComputedStyle(element);
        if (
          rect.width < 2 ||
          rect.height < 2 ||
          styles.display === "none" ||
          styles.visibility === "hidden" ||
          Number(styles.opacity) === 0
        ) {
          continue;
        }

        const text = visibleText(element);
        if (!text) continue;

        const rasterWidth = Math.min(Math.ceil(rect.width), 1200);
        const rasterHeight = Math.min(Math.ceil(rect.height), 260);
        const raster = document.createElement("canvas");
        raster.width = Math.max(1, rasterWidth);
        raster.height = Math.max(1, rasterHeight);
        const rasterContext = raster.getContext("2d", { alpha: true, willReadFrequently: true });
        if (!rasterContext) continue;

        const fontSize = Number.parseFloat(styles.fontSize) || 16;
        const parsedLineHeight = Number.parseFloat(styles.lineHeight);
        const lineHeight = Number.isFinite(parsedLineHeight) ? parsedLineHeight : fontSize * 1.35;
        const textAlign = styles.textAlign as CanvasTextAlign;
        rasterContext.font = `${styles.fontStyle} ${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
        rasterContext.textBaseline = "top";
        rasterContext.textAlign = textAlign;
        rasterContext.fillStyle = styles.color;
        rasterContext.globalAlpha = clamp(Number(styles.opacity) || 1);
        drawWrappedText(rasterContext, text, rasterWidth, rasterHeight, lineHeight, textAlign);

        const image = rasterContext.getImageData(0, 0, rasterWidth, rasterHeight);
        const localLeft = rect.left - contentRect.left;
        const localTop = rect.top - contentRect.top;

        for (let y = 0; y < rasterHeight; y += sampleStep) {
          for (let x = 0; x < rasterWidth; x += sampleStep) {
            const pixelIndex = (y * rasterWidth + x) * 4;
            if (image.data[pixelIndex + 3] < 42) continue;
            const color = `rgba(${image.data[pixelIndex]}, ${image.data[pixelIndex + 1]}, ${
              image.data[pixelIndex + 2]
            }, ${(image.data[pixelIndex + 3] / 255).toFixed(3)})`;
            addParticle(candidates, localLeft + x, localTop + y, color, particleIndex, compact);
            particleIndex += 1;
          }
        }
      }

      const outlinedElements = Array.from(content.querySelectorAll<HTMLElement>("article, hr")).slice(0, 36);
      for (const element of outlinedElements) {
        const rect = element.getBoundingClientRect();
        const styles = getComputedStyle(element);
        if (rect.width < 8 || rect.height < 1 || styles.display === "none") continue;

        const localLeft = rect.left - contentRect.left;
        const localTop = rect.top - contentRect.top;
        const edgeStep = compact ? 14 : 18;
        const edgeColor =
          styles.borderTopColor && styles.borderTopColor !== "rgba(0, 0, 0, 0)"
            ? styles.borderTopColor
            : styles.color;

        for (let x = 0; x <= rect.width; x += edgeStep) {
          addParticle(candidates, localLeft + x, localTop, edgeColor, particleIndex, compact);
          particleIndex += 1;
          addParticle(candidates, localLeft + x, localTop + rect.height, edgeColor, particleIndex, compact);
          particleIndex += 1;
        }
      }

      const maxParticles = compact ? 1600 : 2800;
      if (candidates.length <= maxParticles) {
        particles = candidates;
      } else {
        const stride = candidates.length / maxParticles;
        particles = Array.from({ length: maxParticles }, (_, index) => candidates[Math.floor(index * stride)]);
      }

      const rootTop = window.scrollY + content.getBoundingClientRect().top;
      particles.forEach((particle) => {
        particle.progress = targetProgressFor(particle, window.scrollY, rootTop);
      });
    };

    const resizeCanvas = () => {
      width = Math.max(window.innerWidth, 1);
      height = Math.max(window.innerHeight, 1);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const updateMask = (rootTop: number) => {
      const { line, band } = formationMetrics();
      const localLine = smoothScroll + line - rootTop;
      content.style.setProperty("--particle-mask-crisp", `${localLine - band * 0.52}px`);
      content.style.setProperty("--particle-mask-soft", `${localLine - band * 0.2}px`);
      content.style.setProperty("--particle-mask-dissolve", `${localLine + band * 0.14}px`);
      content.style.setProperty("--particle-mask-hidden", `${localLine + band * 0.48}px`);
    };

    const draw = (now: number) => {
      frame = 0;
      if (destroyed || reducedMotion || !visible) return;

      const delta = Math.min((now - lastTime) / 1000, 1 / 30);
      lastTime = now;
      elapsed += delta;
      const smoothing = 1 - Math.exp(-delta / 0.13);
      smoothScroll += (targetScroll - smoothScroll) * smoothing;
      if (Math.abs(targetScroll - smoothScroll) < 0.15) smoothScroll = targetScroll;

      const contentRect = content.getBoundingClientRect();
      const rootTop = window.scrollY + contentRect.top;
      const { line, band } = formationMetrics();
      updateMask(rootTop);
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";

      const accent = getComputedStyle(stage).getPropertyValue("--c-link").trim() || "#91b6d8";
      const lineStart = Math.max(20, contentRect.left);
      const lineEnd = Math.min(width - 20, contentRect.right);
      const formationLine = context.createLinearGradient(lineStart, 0, lineEnd, 0);
      formationLine.addColorStop(0, "transparent");
      formationLine.addColorStop(0.16, accent);
      formationLine.addColorStop(0.5, accent);
      formationLine.addColorStop(0.84, accent);
      formationLine.addColorStop(1, "transparent");
      context.fillStyle = formationLine;
      context.globalAlpha = 0.2;
      context.fillRect(lineStart, line, lineEnd - lineStart, 1);
      context.globalAlpha = 0.06;
      context.fillRect(lineStart + (lineEnd - lineStart) * 0.08, line + band * 0.16, (lineEnd - lineStart) * 0.84, 1);

      let particlesAnimating = false;
      particles.forEach((particle, index) => {
        const viewportHomeY = rootTop + particle.homeY - smoothScroll;
        if (viewportHomeY < line - band * 0.85 || viewportHomeY > line + band * 1.2) return;

        const targetProgress = targetProgressFor(particle, smoothScroll, rootTop);
        const settleTime = targetProgress > particle.progress ? 0.62 : 0.4;
        const step = delta / settleTime;
        if (Math.abs(targetProgress - particle.progress) <= step) {
          particle.progress = targetProgress;
        } else {
          particle.progress += Math.sign(targetProgress - particle.progress) * step;
          particlesAnimating = true;
        }

        const settled = 1 - Math.pow(1 - particle.progress, 3);
        const arc = Math.sin(settled * Math.PI);
        const localX =
          particle.scatterX +
          (particle.homeX - particle.scatterX) * settled +
          particle.drift * arc +
          Math.sin(index * 0.71 + elapsed * (2.5 + random(index, 23) * 2)) * (1 - settled) * 2.8;
        const localY =
          particle.scatterY +
          (particle.homeY - particle.scatterY) * settled -
          Math.abs(particle.drift) * 0.25 * arc;
        const viewportY = rootTop + localY - smoothScroll;
        const edgeFade = clamp(1 - Math.abs(viewportHomeY - line) / (band * 1.2));
        const mergeFade = 1 - clamp((particle.progress - 0.86) / 0.14);
        const opacity = (0.28 + edgeFade * 0.72) * (0.35 + mergeFade * 0.65);

        context.globalAlpha = opacity;
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(localX, viewportY, particle.radius * (0.74 + settled * 0.34), 0, Math.PI * 2);
        context.fill();
      });

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

    const scheduleRebuild = () => {
      if (destroyed || reducedMotion || rebuildFrame) return;
      rebuildFrame = window.requestAnimationFrame(() => {
        rebuildFrame = 0;
        buildParticles();
        requestDraw();
      });
    };

    const onScroll = () => {
      targetScroll = window.scrollY;
      requestDraw();
    };

    const onWindowResize = () => {
      resizeCanvas();
      scheduleRebuild();
    };

    const onMotionChange = () => {
      reducedMotion = motionQuery.matches;
      stage.dataset.particleScroll = reducedMotion ? "fallback" : "active";
      if (reducedMotion) {
        window.cancelAnimationFrame(frame);
        frame = 0;
        particles = [];
        context.clearRect(0, 0, width, height);
        content.style.removeProperty("--particle-mask-crisp");
        content.style.removeProperty("--particle-mask-soft");
        content.style.removeProperty("--particle-mask-dissolve");
        content.style.removeProperty("--particle-mask-hidden");
      } else {
        targetScroll = window.scrollY;
        smoothScroll = targetScroll;
        resizeCanvas();
        buildParticles();
        requestDraw();
      }
    };

    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          targetScroll = window.scrollY;
          smoothScroll = targetScroll;
          buildParticles();
          requestDraw();
        } else {
          window.cancelAnimationFrame(frame);
          frame = 0;
          context.clearRect(0, 0, width, height);
        }
      },
      { rootMargin: "12% 0px" }
    );

    const resizeObserver = new ResizeObserver(scheduleRebuild);

    stage.dataset.particleScroll = reducedMotion ? "fallback" : "active";
    resizeCanvas();
    if (!reducedMotion) buildParticles();
    intersection.observe(stage);
    resizeObserver.observe(content);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onWindowResize, { passive: true });
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      destroyed = true;
      intersection.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onWindowResize);
      motionQuery.removeEventListener("change", onMotionChange);
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(rebuildFrame);
      particles = [];
      canvas.width = 1;
      canvas.height = 1;
      delete stage.dataset.particleScroll;
      content.removeAttribute("style");
    };
  }, []);

  return (
    <div ref={stageRef} className="particle-scroll-stage">
      <canvas ref={canvasRef} className="particle-scroll-canvas" aria-hidden="true" />
      <div ref={contentRef} className="particle-scroll-content">
        {children}
      </div>
    </div>
  );
}
