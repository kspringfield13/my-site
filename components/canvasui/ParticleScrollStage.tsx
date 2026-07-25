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
  speed: number;
};

const TEXT_SELECTOR = "h1, h2, h3, h4, p, dt, dd, button, a";
const MEDIA_SELECTOR = "canvas, img, video";
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
 * Section-sized masks preserve the semantic DOM while capped particle
 * facsimiles dissolve and reassemble content through a soft formation band.
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
    let dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
    let particles: Particle[] = [];
    let revealTargets: HTMLElement[] = [];
    const maskedTargets = new Set<HTMLElement>();
    let frame = 0;
    let rebuildFrame = 0;
    let scrollIdleTimer = 0;
    let visible = false;
    let scrollIdle = true;
    let destroyed = false;
    let targetScroll = window.scrollY;
    let smoothScroll = targetScroll;
    let lastTime = performance.now();
    let elapsed = 0;
    let pointerX = -10_000;
    let pointerY = -10_000;
    let pointerActive = 0;

    const formationMetrics = (scroll = smoothScroll) => {
      const compact = width < 640;
      const band = clamp(height * 0.42, compact ? 240 : 280, compact ? 340 : 420);
      const baseLine = height * (compact ? 0.7 : 0.68);
      const maxScroll = Math.max(document.documentElement.scrollHeight - height, 0);
      const endWindow = height * 0.45;
      const endProgress = clamp((scroll - (maxScroll - endWindow)) / Math.max(endWindow, 1));
      return {
        line: baseLine + (height + band - baseLine) * endProgress * endProgress,
        band
      };
    };

    const targetProgressFor = (particle: Particle, scroll: number, rootTop: number) => {
      const { line, band } = formationMetrics(scroll);
      const viewportHomeY = rootTop + particle.homeY - scroll;
      const rowProgress = clamp((line + band - viewportHomeY) / band);
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
      const spread = compact ? 140 : 200;
      const angle = random(index, 3) * Math.PI * 2;
      const reach = 0.08 + 0.92 * Math.pow(random(index, 5), 2.4);
      const gravity = spread * 0.35 * (0.25 + random(index, 11) * 0.75);
      candidates.push({
        homeX,
        homeY,
        scatterX: homeX + Math.cos(angle) * spread * reach,
        scatterY: homeY + Math.sin(angle) * spread * reach + gravity,
        delay: random(index, 7) * 0.62,
        drift: (random(index, 13) - 0.5) * (compact ? 96 : 120),
        radius: (compact ? 0.78 : 0.88) + random(index, 19) * 0.82,
        color,
        progress: 0,
        speed: 2.8 + random(index, 31) * 3.5
      });
    };

    const clearCanvas = () => {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.restore();
    };

    const clearRevealTarget = (target: HTMLElement) => {
      target.removeAttribute("data-particle-reveal");
      target.style.removeProperty("--particle-reveal-solid");
      target.style.removeProperty("--particle-reveal-soft");
      target.style.removeProperty("--particle-reveal-dissolve");
      target.style.removeProperty("--particle-reveal-clear");
      target.style.removeProperty("--particle-reveal-fallback-clip");
      maskedTargets.delete(target);
    };

    const clearVisuals = () => {
      clearCanvas();
      Array.from(maskedTargets).forEach(clearRevealTarget);
    };

    const buildParticles = () => {
      Array.from(maskedTargets).forEach(clearRevealTarget);

      if (reducedMotion || destroyed) {
        particles = [];
        revealTargets = [];
        return;
      }

      const contentRect = content.getBoundingClientRect();
      const compact = width < 640;
      const sampleStep = compact ? 2 : 3;
      const candidates: Particle[] = [];
      let particleIndex = 0;

      const textElements = Array.from(content.querySelectorAll<HTMLElement>(TEXT_SELECTOR))
        .filter((element) => {
          if (element.closest("[aria-hidden='true']")) return false;
          const parentTextSource = element.parentElement?.closest(TEXT_SELECTOR);
          return !parentTextSource || !content.contains(parentTextSource);
        })
        .slice(0, 140);
      const outlinedElements = Array.from(
        content.querySelectorAll<HTMLElement>("article, hr, a, button")
      ).slice(0, 72);
      const mediaElements = Array.from(content.querySelectorAll<HTMLElement>(MEDIA_SELECTOR)).slice(0, 24);

      // Mask whole homepage sections so their surfaces, borders, and children
      // dissolve together. Per-child clipping left the painted container behind
      // as a dark rectangular band, while one document-height mask can expose
      // browser compositing seams. Section-sized masks avoid both artifacts.
      revealTargets = Array.from(content.querySelectorAll<HTMLElement>("section"));

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

      for (const element of mediaElements) {
        const rect = element.getBoundingClientRect();
        const styles = getComputedStyle(element);
        if (
          rect.width < 8 ||
          rect.height < 8 ||
          styles.display === "none" ||
          styles.visibility === "hidden" ||
          Number(styles.opacity) === 0
        ) {
          continue;
        }

        const rasterWidth = Math.min(Math.ceil(rect.width), compact ? 360 : 640);
        const rasterHeight = Math.min(Math.ceil(rect.height), compact ? 260 : 420);
        const raster = document.createElement("canvas");
        raster.width = Math.max(1, rasterWidth);
        raster.height = Math.max(1, rasterHeight);
        const rasterContext = raster.getContext("2d", { alpha: true, willReadFrequently: true });
        if (!rasterContext) continue;

        try {
          rasterContext.drawImage(
            element as CanvasImageSource,
            0,
            0,
            rasterWidth,
            rasterHeight
          );
          const image = rasterContext.getImageData(0, 0, rasterWidth, rasterHeight);
          const localLeft = rect.left - contentRect.left;
          const localTop = rect.top - contentRect.top;
          const scaleX = rect.width / rasterWidth;
          const scaleY = rect.height / rasterHeight;
          const mediaStep = compact ? 5 : 6;

          for (let y = 0; y < rasterHeight; y += mediaStep) {
            for (let x = 0; x < rasterWidth; x += mediaStep) {
              const pixelIndex = (y * rasterWidth + x) * 4;
              if (image.data[pixelIndex + 3] < 72) continue;
              const luminance =
                image.data[pixelIndex] * 0.299 +
                image.data[pixelIndex + 1] * 0.587 +
                image.data[pixelIndex + 2] * 0.114;
              if (luminance < 22) continue;
              const color = `rgba(${image.data[pixelIndex]}, ${image.data[pixelIndex + 1]}, ${
                image.data[pixelIndex + 2]
              }, ${(image.data[pixelIndex + 3] / 255).toFixed(3)})`;
              addParticle(
                candidates,
                localLeft + x * scaleX,
                localTop + y * scaleY,
                color,
                particleIndex,
                compact
              );
              particleIndex += 1;
            }
          }
        } catch {
          // Cross-origin media or an unreadable WebGL buffer simply falls back
          // to its text/outline representation.
        }
      }

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

      const lowPower = (navigator.hardwareConcurrency || 8) <= 4;
      const bucketHeight = compact ? 136 : 156;
      const bucketCap = compact ? (lowPower ? 420 : 760) : lowPower ? 620 : 1120;
      const buckets = new Map<number, Particle[]>();

      candidates.forEach((particle) => {
        const key = Math.floor(particle.homeY / bucketHeight);
        const bucket = buckets.get(key);
        if (bucket) bucket.push(particle);
        else buckets.set(key, [particle]);
      });

      particles = Array.from(buckets.values())
        .flatMap((bucket) => {
          if (bucket.length <= bucketCap) return bucket;
          const stride = bucket.length / bucketCap;
          return Array.from({ length: bucketCap }, (_, index) => bucket[Math.floor(index * stride)]);
        })
        .sort((a, b) => a.homeY - b.homeY);

      const rootTop = window.scrollY + content.getBoundingClientRect().top;
      particles.forEach((particle) => {
        particle.progress = targetProgressFor(particle, window.scrollY, rootTop);
      });
    };

    const resizeCanvas = () => {
      const canvasRect = canvas.getBoundingClientRect();
      width = Math.max(canvasRect.width, 1);
      height = Math.max(canvasRect.height, 1);
      dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
      const pixelWidth = Math.max(1, Math.round(width * dpr));
      const pixelHeight = Math.max(1, Math.round(height * dpr));
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      context.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
    };

    const updateReveals = () => {
      const { line, band } = formationMetrics(smoothScroll);
      const scrollLag = window.scrollY - smoothScroll;
      const solidEdge = line - band * 0.06;
      const softEdge = line + band * 0.18;
      const dissolveEdge = line + band * 0.58;
      const clearEdge = line + band * 0.96;

      revealTargets.forEach((target) => {
        const rect = target.getBoundingClientRect();
        const syntheticTop = rect.top + scrollLag;
        const syntheticBottom = rect.bottom + scrollLag;

        if (syntheticBottom <= solidEdge) {
          if (maskedTargets.has(target)) clearRevealTarget(target);
          return;
        }

        if (syntheticTop >= clearEdge) {
          if (target.dataset.particleReveal !== "hidden") {
            target.dataset.particleReveal = "hidden";
          }
          maskedTargets.add(target);
          return;
        }

        target.dataset.particleReveal = "forming";
        const stops = [
          ["--particle-reveal-solid", solidEdge - syntheticTop],
          ["--particle-reveal-soft", softEdge - syntheticTop],
          ["--particle-reveal-dissolve", dissolveEdge - syntheticTop],
          ["--particle-reveal-clear", clearEdge - syntheticTop],
          ["--particle-reveal-fallback-clip", Math.max(0, syntheticBottom - dissolveEdge)]
        ] as const;

        for (const [property, value] of stops) {
          const nextValue = `${value.toFixed(1)}px`;
          if (target.style.getPropertyValue(property) !== nextValue) {
            target.style.setProperty(property, nextValue);
          }
        }
        maskedTargets.add(target);
      });
    };

    const draw = (now: number) => {
      frame = 0;
      if (destroyed || reducedMotion || !visible) return;

      const delta = Math.min((now - lastTime) / 1000, 1 / 30);
      lastTime = now;
      elapsed += delta;
      const smoothing = 1 - Math.exp(-delta / 0.22);
      smoothScroll += (targetScroll - smoothScroll) * smoothing;
      if (Math.abs(targetScroll - smoothScroll) < 0.15) smoothScroll = targetScroll;

      const contentRect = content.getBoundingClientRect();
      const rootTop = window.scrollY + contentRect.top;
      const { line, band } = formationMetrics(smoothScroll);
      updateReveals();
      clearCanvas();
      context.globalCompositeOperation = "source-over";

      const localBandTop = smoothScroll + line - band * 0.45 - rootTop;
      const localBandBottom = smoothScroll + line + band * 1.7 - rootTop;
      const lowerBound = (value: number) => {
        let low = 0;
        let high = particles.length;
        while (low < high) {
          const middle = (low + high) >>> 1;
          if (particles[middle].homeY < value) low = middle + 1;
          else high = middle;
        }
        return low;
      };
      const startIndex = lowerBound(localBandTop);
      const endIndex = lowerBound(localBandBottom);

      for (let index = startIndex; index < endIndex; index += 1) {
        const particle = particles[index];
        const viewportHomeY = rootTop + particle.homeY - smoothScroll;
        if (viewportHomeY < line - band * 0.35 || viewportHomeY > line + band * 1.25) continue;

        const targetProgress = targetProgressFor(particle, smoothScroll, rootTop);
        const settleTime = targetProgress > particle.progress ? 0.72 : 0.44;
        const step = delta / settleTime;
        if (Math.abs(targetProgress - particle.progress) <= step) {
          particle.progress = targetProgress;
        } else {
          particle.progress += Math.sign(targetProgress - particle.progress) * step;
        }

        const settled = 1 - Math.pow(1 - particle.progress, 3);
        const arc = Math.sin(settled * Math.PI);
        const driftStrength = scrollIdle ? 0.78 : 1.15;
        let localX =
          particle.scatterX +
          (particle.homeX - particle.scatterX) * settled +
          particle.drift * arc +
          Math.sin(index * 0.71 + elapsed * particle.speed) *
            (1 - settled) *
            12 *
            driftStrength;
        let localY =
          particle.scatterY +
          (particle.homeY - particle.scatterY) * settled -
          Math.abs(particle.drift) * 0.25 * arc +
          Math.cos(index * 0.47 + elapsed * (particle.speed * 0.86)) *
            (1 - settled) *
            10 *
            driftStrength;
        let viewportY = rootTop + localY - smoothScroll;

        const pointerDistance = Math.hypot(localX - pointerX, viewportY - pointerY);
        if (pointerActive > 0.01 && pointerDistance < 92 && pointerDistance > 0.01) {
          const pointerForce =
            Math.pow(1 - pointerDistance / 92, 2) * 22 * pointerActive * (1 - settled);
          localX += ((localX - pointerX) / pointerDistance) * pointerForce;
          localY += ((viewportY - pointerY) / pointerDistance) * pointerForce;
          viewportY = rootTop + localY - smoothScroll;
        }

        const bandPosition = clamp((viewportHomeY - line) / band);
        const edgeFade = Math.sin(bandPosition * Math.PI);
        const mergeFade = 1 - clamp((particle.progress - 0.86) / 0.14);
        const activityOpacity = scrollIdle ? 0.82 : 1;
        const opacity = (0.68 + edgeFade * 0.32) * mergeFade * activityOpacity;
        if (opacity <= 0.01) continue;

        context.globalAlpha = opacity;
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(localX, viewportY, particle.radius * (0.74 + settled * 0.34), 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 1;
      frame = window.requestAnimationFrame(draw);
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
      scrollIdle = false;
      window.clearTimeout(scrollIdleTimer);
      scrollIdleTimer = window.setTimeout(() => {
        scrollIdle = true;
        requestDraw();
      }, 100);
      requestDraw();
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      pointerActive = event.pointerType === "touch" ? 0.45 : 1;
      requestDraw();
    };

    const onPointerOut = (event: PointerEvent) => {
      if (event.relatedTarget) return;
      pointerActive = 0;
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
        revealTargets = [];
        clearVisuals();
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
          updateReveals();
          requestDraw();
        } else {
          window.cancelAnimationFrame(frame);
          frame = 0;
          clearCanvas();
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
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      destroyed = true;
      intersection.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onWindowResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      motionQuery.removeEventListener("change", onMotionChange);
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(rebuildFrame);
      window.clearTimeout(scrollIdleTimer);
      particles = [];
      revealTargets = [];
      Array.from(maskedTargets).forEach(clearRevealTarget);
      canvas.width = 1;
      canvas.height = 1;
      delete stage.dataset.particleScroll;
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
