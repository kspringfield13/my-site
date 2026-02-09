"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { THEME_RGB } from "@/lib/theme/palette";
import styles from "./HeroSpotlight.module.css";

const INSTAGRAM_URL = "https://instagram.com/kspringfpv";
const X_URL = "https://x.com/kspringfield13";

const DESKTOP_LERP_FACTOR = 0.11;
const MOBILE_LERP_FACTOR = 0.18;
const MAX_TRAILS = 14;
const MATRIX_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+-";
const EMPTY_PLASMA_MASK =
  "radial-gradient(circle 1px at -9999px -9999px, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 100%)";

type Point = { x: number; y: number };
type ToneState = { name: boolean; innovator: boolean; socials: boolean };
type LocalRect = { left: number; right: number; top: number; bottom: number };
type BoundsState = { name: LocalRect | null; innovator: LocalRect | null; socials: LocalRect | null };
type PortraitSize = { width: number; height: number };
type PlasmaTrail = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  lifeMs: number;
  maxLifeMs: number;
  phase: number;
  wobble: number;
};

type PlasmaBlob = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function intersectsCircle(rect: LocalRect | null, circle: Point, radius: number) {
  if (!rect) return false;
  const nearestX = clamp(circle.x, rect.left, rect.right);
  const nearestY = clamp(circle.y, rect.top, rect.bottom);
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return dx * dx + dy * dy <= radius * radius;
}

function buildPlasmaMask(blobs: PlasmaBlob[]) {
  if (blobs.length === 0) return EMPTY_PLASMA_MASK;

  return blobs
    .map((blob) => {
      const x = blob.x.toFixed(2);
      const y = blob.y.toFixed(2);
      const radius = blob.radius.toFixed(2);
      const alpha = clamp(blob.alpha, 0, 1);
      const midAlpha = clamp(alpha * 0.82, 0, 1);
      const outerAlpha = clamp(alpha * 0.36, 0, 1);

      return `radial-gradient(circle ${radius}px at ${x}px ${y}px, rgba(0,0,0,${alpha.toFixed(3)}) 0%, rgba(0,0,0,${midAlpha.toFixed(3)}) 48%, rgba(0,0,0,${outerAlpha.toFixed(3)}) 72%, rgba(0,0,0,0) 100%)`;
    })
    .join(",");
}

function parseBackgroundOffset(value: string, containerSize: number, imageSize: number) {
  const delta = containerSize - imageSize;
  const normalized = value.trim().toLowerCase();
  if (normalized === "center") return delta * 0.5;
  if (normalized === "top" || normalized === "left") return 0;
  if (normalized === "bottom" || normalized === "right") return delta;
  if (normalized.endsWith("%")) {
    const percent = Number.parseFloat(normalized.slice(0, -1));
    return Number.isFinite(percent) ? delta * (percent / 100) : delta * 0.5;
  }
  if (normalized.endsWith("px")) {
    const pixels = Number.parseFloat(normalized.slice(0, -2));
    return Number.isFinite(pixels) ? pixels : delta * 0.5;
  }
  const numeric = Number.parseFloat(normalized);
  return Number.isFinite(numeric) ? numeric : delta * 0.5;
}

function isPointInsideRect(rect: LocalRect | null, point: Point) {
  if (!rect) return false;
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

export function HeroSpotlight() {
  const heroRef = useRef<HTMLElement>(null);
  const matrixCanvasRef = useRef<HTMLCanvasElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const innovatorRef = useRef<HTMLDivElement>(null);
  const socialsRef = useRef<HTMLDivElement>(null);

  const viewportRef = useRef({ width: 0, height: 0 });
  const heroOffsetRef = useRef({ left: 0, top: 0 });
  const topPortraitBoundsRef = useRef<LocalRect | null>(null);
  const portraitSizesRef = useRef<{ me: PortraitSize | null; ai: PortraitSize | null }>({ me: null, ai: null });
  const targetRef = useRef<Point>({ x: 0, y: 0 });
  const currentRef = useRef<Point>({ x: 0, y: 0 });
  const lastRawRef = useRef<Point | null>(null);
  const lastSampleRef = useRef<Point>({ x: 0, y: 0 });
  const boundsRef = useRef<BoundsState>({ name: null, innovator: null, socials: null });

  const rafRef = useRef<number | null>(null);
  const matrixRafRef = useRef<number | null>(null);
  const hasPointerRef = useRef(false);
  const touchActiveRef = useRef(false);
  const mobileViewportRef = useRef(false);
  const coarsePointerRef = useRef(false);
  const reduceMotionRef = useRef(false);
  const toneRef = useRef<ToneState>({ name: false, innovator: false, socials: false });
  const revealActiveRef = useRef(false);
  const lastTickAtRef = useRef(0);

  const nextTrailIdRef = useRef(1);
  const lastTrailSpawnAtRef = useRef(0);
  const plasmaTrailsRef = useRef<PlasmaTrail[]>([]);
  const plasmaTurbulenceRef = useRef(0);
  const plasmaIntensityRef = useRef(0);

  const matrixCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const matrixColumnsRef = useRef<number[]>([]);
  const matrixSpeedsRef = useRef<number[]>([]);
  const matrixFontSizeRef = useRef(16);
  const matrixSizeRef = useRef({ width: 0, height: 0 });
  const matrixLastTimeRef = useRef(0);
  const matrixLastDrawAtRef = useRef(0);

  const [revealActive, setRevealActive] = useState(false);
  const [topLayerHovered, setTopLayerHovered] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const [tones, setTones] = useState<ToneState>({ name: false, innovator: false, socials: false });
  const matrixActive = true;

  const resetTones = useCallback(() => {
    const prev = toneRef.current;
    if (!prev.name && !prev.innovator && !prev.socials) return;
    const next = { name: false, innovator: false, socials: false };
    toneRef.current = next;
    setTones(next);
  }, []);

  const setRevealActiveState = useCallback((next: boolean) => {
    if (revealActiveRef.current === next) return;
    revealActiveRef.current = next;
    setRevealActive(next);

    if (!next) {
      lastRawRef.current = null;
    }
  }, []);

  const resetPlasmaStyles = useCallback(() => {
    const hero = heroRef.current;
    if (!hero) return;
    hero.style.setProperty("--plasma-mask", EMPTY_PLASMA_MASK);
    hero.style.setProperty("--plasma-opacity", "0");
    hero.style.setProperty("--flow-energy", "0.12");
  }, []);

  const measureTopPortraitBounds = useCallback(() => {
    const hero = heroRef.current;
    if (!hero) {
      topPortraitBoundsRef.current = null;
      return;
    }

    const heroRect = hero.getBoundingClientRect();
    const width = heroRect.width || viewportRef.current.width;
    const height = heroRect.height || viewportRef.current.height;
    if (width <= 0 || height <= 0) {
      topPortraitBoundsRef.current = null;
      return;
    }

    const topPortraitSize = agentMode ? portraitSizesRef.current.ai : portraitSizesRef.current.me;
    if (!topPortraitSize || topPortraitSize.width <= 0 || topPortraitSize.height <= 0) {
      topPortraitBoundsRef.current = null;
      return;
    }

    const computed = window.getComputedStyle(hero);
    const zoomRaw = computed.getPropertyValue("--portrait-zoom").trim();
    const zoom = Number.parseFloat(zoomRaw);
    const portraitZoom = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
    const yRaw = computed.getPropertyValue("--portrait-y").trim() || "50%";

    const renderHeight = height * portraitZoom;
    const renderWidth = renderHeight * (topPortraitSize.width / topPortraitSize.height);
    const left = (width - renderWidth) * 0.5;
    const top = parseBackgroundOffset(yRaw, height, renderHeight);

    topPortraitBoundsRef.current = {
      left,
      right: left + renderWidth,
      top,
      bottom: top + renderHeight
    };
  }, [agentMode]);

  const measureBounds = useCallback(() => {
    const heroRect = heroRef.current?.getBoundingClientRect();
    if (!heroRect) {
      boundsRef.current = { name: null, innovator: null, socials: null };
      return;
    }

    const toLocal = (rect: DOMRect | undefined | null): LocalRect | null => {
      if (!rect) return null;
      return {
        left: rect.left - heroRect.left,
        right: rect.right - heroRect.left,
        top: rect.top - heroRect.top,
        bottom: rect.bottom - heroRect.top
      };
    };

    boundsRef.current = {
      name: toLocal(nameRef.current?.getBoundingClientRect()),
      innovator: toLocal(innovatorRef.current?.getBoundingClientRect()),
      socials: toLocal(socialsRef.current?.getBoundingClientRect())
    };
  }, []);

  const setupMatrixCanvas = useCallback(() => {
    const hero = heroRef.current;
    const canvas = matrixCanvasRef.current;
    if (!hero || !canvas) return;

    const rect = hero.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    matrixCtxRef.current = ctx;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    matrixSizeRef.current = { width, height };
    const compact = coarsePointerRef.current || width < 720;
    const fontSize = compact ? 13 : 16;
    matrixFontSizeRef.current = fontSize;

    const columns = Math.max(12, Math.floor(width / fontSize));
    matrixColumnsRef.current = Array.from({ length: columns }, () => Math.random() * height - height);
    matrixSpeedsRef.current = Array.from({ length: columns }, () => 44 + Math.random() * 66);
  }, []);

  const clearMatrixCanvas = useCallback(() => {
    const ctx = matrixCtxRef.current;
    const { width, height } = matrixSizeRef.current;
    if (!ctx || width === 0 || height === 0) return;
    ctx.clearRect(0, 0, width, height);
  }, []);

  const drawMatrixFrame = useCallback((time: number) => {
    const ctx = matrixCtxRef.current;
    const { width, height } = matrixSizeRef.current;
    if (!ctx || width === 0 || height === 0) {
      matrixRafRef.current = null;
      return;
    }

    if (matrixLastDrawAtRef.current && time - matrixLastDrawAtRef.current < 1000 / 36) {
      matrixRafRef.current = window.requestAnimationFrame(drawMatrixFrame);
      return;
    }

    const dt = matrixLastTimeRef.current > 0 ? Math.min(48, time - matrixLastTimeRef.current) / 1000 : 1 / 36;
    matrixLastTimeRef.current = time;
    matrixLastDrawAtRef.current = time;

    const subtleFactor = (reduceMotionRef.current ? 0.45 : 1) * (coarsePointerRef.current ? 0.72 : 1);
    const fadeAlpha = reduceMotionRef.current ? 0.32 : 0.22;
    const headAlpha = reduceMotionRef.current ? 0.4 : 0.72;
    const trailAlpha = reduceMotionRef.current ? 0.14 : 0.38;
    const fontSize = matrixFontSizeRef.current;

    ctx.fillStyle = `rgba(${THEME_RGB.accent900}, ${fadeAlpha})`;
    ctx.fillRect(0, 0, width, height);

    ctx.font = `${fontSize}px var(--font-mono), ui-monospace, monospace`;
    ctx.textBaseline = "top";

    const columns = matrixColumnsRef.current;
    const speeds = matrixSpeedsRef.current;
    for (let index = 0; index < columns.length; index += 1) {
      const x = index * fontSize;
      const y = columns[index];
      const lead = MATRIX_CHARSET[Math.floor(Math.random() * MATRIX_CHARSET.length)];
      const trail = MATRIX_CHARSET[Math.floor(Math.random() * MATRIX_CHARSET.length)];

      ctx.fillStyle = `rgba(${THEME_RGB.text}, ${headAlpha})`;
      ctx.fillText(lead, x, y);

      ctx.fillStyle = `rgba(${THEME_RGB.accent700}, ${trailAlpha})`;
      ctx.fillText(trail, x, y - fontSize * 1.22);

      let nextY = y + speeds[index] * subtleFactor * dt;
      if (nextY > height + fontSize * 2) {
        nextY = -Math.random() * height * 0.35 - fontSize;
        speeds[index] = 44 + Math.random() * 66;
      }
      columns[index] = nextY;
    }

    matrixRafRef.current = window.requestAnimationFrame(drawMatrixFrame);
  }, []);

  const startMatrix = useCallback(() => {
    setupMatrixCanvas();
    clearMatrixCanvas();
    if (matrixRafRef.current === null) {
      matrixLastTimeRef.current = 0;
      matrixLastDrawAtRef.current = 0;
      matrixRafRef.current = window.requestAnimationFrame(drawMatrixFrame);
    }
  }, [clearMatrixCanvas, drawMatrixFrame, setupMatrixCanvas]);

  const stopMatrix = useCallback(
    (clearCanvas: boolean) => {
      if (matrixRafRef.current !== null) {
        window.cancelAnimationFrame(matrixRafRef.current);
        matrixRafRef.current = null;
      }
      matrixLastTimeRef.current = 0;
      matrixLastDrawAtRef.current = 0;
      if (clearCanvas) {
        clearMatrixCanvas();
      }
    },
    [clearMatrixCanvas]
  );

  const spawnTrail = useCallback((x: number, y: number, vx: number, vy: number, strength: number) => {
    const { width, height } = viewportRef.current;
    if (width === 0 || height === 0) return;

    const minDim = Math.min(width, height);
    const radiusBase = clamp(minDim * 0.075, 36, 96) * (0.72 + Math.random() * 0.52) * strength;
    const id = nextTrailIdRef.current++;
    const trail: PlasmaTrail = {
      id,
      x: x - vx * (0.028 + Math.random() * 0.02),
      y: y - vy * (0.028 + Math.random() * 0.02),
      vx: -vx * (0.06 + Math.random() * 0.07) + (Math.random() - 0.5) * 58,
      vy: -vy * (0.06 + Math.random() * 0.07) + (Math.random() - 0.5) * 58,
      radius: radiusBase,
      maxLifeMs: 720 + Math.random() * 640,
      lifeMs: 720 + Math.random() * 640,
      phase: Math.random() * Math.PI * 2,
      wobble: 0.84 + Math.random() * 1.18
    };

    const next = [...plasmaTrailsRef.current, trail];
    plasmaTrailsRef.current = next.length > MAX_TRAILS ? next.slice(next.length - MAX_TRAILS) : next;
  }, []);

  const applyScene = useCallback(
    (x: number, y: number, timeMs: number, dtSec: number) => {
      const hero = heroRef.current;
      if (!hero) return;

      const { width, height } = viewportRef.current;
      if (width <= 0 || height <= 0) return;

      const nx = (x - width / 2) / (width / 2 || 1);
      const ny = (y - height / 2) / (height / 2 || 1);

      hero.style.setProperty("--name-shift-x", `${(-nx * 11).toFixed(2)}px`);
      hero.style.setProperty("--name-shift-y", `${(-ny * 11).toFixed(2)}px`);
      hero.style.setProperty("--link-shift-x", `${(-nx * 8).toFixed(2)}px`);
      hero.style.setProperty("--link-shift-y", `${(-ny * 8).toFixed(2)}px`);
      hero.style.setProperty("--social-shift-x", `${(-nx * 10).toFixed(2)}px`);
      hero.style.setProperty("--social-shift-y", `${(-ny * 10).toFixed(2)}px`);

      if (mobileViewportRef.current) {
        plasmaTrailsRef.current = [];
        plasmaIntensityRef.current = 0;
        plasmaTurbulenceRef.current = 0;
        hero.style.setProperty("--flow-shift-x", `${(-nx * 3.2).toFixed(2)}px`);
        hero.style.setProperty("--flow-shift-y", `${(-ny * 3.2).toFixed(2)}px`);
        hero.style.setProperty("--flow-angle", "0deg");
        resetPlasmaStyles();
        resetTones();
        return;
      }

      const safeDt = Math.max(dtSec, 1 / 120);
      const previous = lastSampleRef.current;
      const vx = (x - previous.x) / safeDt;
      const vy = (y - previous.y) / safeDt;
      const speed = Math.hypot(vx, vy);
      lastSampleRef.current = { x, y };

      const turbulenceTarget = revealActiveRef.current
        ? clamp(speed / (coarsePointerRef.current ? 1680 : 1280), 0, 1.24)
        : 0;
      const turbulenceLerp = clamp(safeDt * (revealActiveRef.current ? 6.4 : 2.3), 0.03, 0.34);
      plasmaTurbulenceRef.current += (turbulenceTarget - plasmaTurbulenceRef.current) * turbulenceLerp;
      const turbulence = plasmaTurbulenceRef.current;

      const intensityTarget = revealActiveRef.current ? 1 : 0;
      const intensityLerp = clamp(safeDt * (revealActiveRef.current ? 7.2 : 2.5), 0.03, 0.32);
      plasmaIntensityRef.current += (intensityTarget - plasmaIntensityRef.current) * intensityLerp;
      const intensity = plasmaIntensityRef.current;

      if (revealActiveRef.current && !reduceMotionRef.current) {
        const spawnThreshold = coarsePointerRef.current ? 560 : 430;
        const minInterval = coarsePointerRef.current ? 100 : 70;
        if (speed > spawnThreshold && timeMs - lastTrailSpawnAtRef.current > minInterval) {
          const count = speed > spawnThreshold * 1.72 ? 2 : 1;
          for (let index = 0; index < count; index += 1) {
            spawnTrail(x, y, vx, vy, 1 + turbulence * 0.28);
          }
          lastTrailSpawnAtRef.current = timeMs;
        }
      }

      const driftAmplitude = (reduceMotionRef.current ? 0.15 : 0.55) + turbulence * 0.45;
      const decayMultiplier = reduceMotionRef.current ? 1.45 : 1;
      const nextTrails: PlasmaTrail[] = [];
      for (const trail of plasmaTrailsRef.current) {
        const remaining = trail.lifeMs - safeDt * 1000 * decayMultiplier;
        if (remaining <= 0) {
          continue;
        }

        trail.lifeMs = remaining;
        const drag = Math.pow(0.86, safeDt * 60);
        trail.vx *= drag;
        trail.vy *= drag;

        trail.x += trail.vx * safeDt;
        trail.y += trail.vy * safeDt;

        trail.x += Math.cos(timeMs * 0.0018 * trail.wobble + trail.phase) * driftAmplitude;
        trail.y += Math.sin(timeMs * 0.0016 * trail.wobble + trail.phase * 1.24) * driftAmplitude;

        if (trail.x < -180 || trail.x > width + 180 || trail.y < -180 || trail.y > height + 180) {
          continue;
        }

        nextTrails.push(trail);
      }
      plasmaTrailsRef.current = nextTrails;

      const flowShiftX = -nx * (5 + turbulence * 14);
      const flowShiftY = -ny * (5 + turbulence * 14);
      hero.style.setProperty("--flow-shift-x", `${flowShiftX.toFixed(2)}px`);
      hero.style.setProperty("--flow-shift-y", `${flowShiftY.toFixed(2)}px`);

      const flowAngle = Math.atan2(vy || ny, vx || nx || 0.0001) * (180 / Math.PI);
      hero.style.setProperty("--flow-angle", `${flowAngle.toFixed(2)}deg`);

      if (intensity < 0.015 && nextTrails.length === 0) {
        resetPlasmaStyles();
        resetTones();
        return;
      }

      const minDim = Math.min(width, height);
      const baseRadius = clamp(minDim * 0.15, 78, 176);
      const time = timeMs / 1000;
      const motionBiasX = clamp(vx * 0.028, -72, 72);
      const motionBiasY = clamp(vy * 0.028, -72, 72);

      const blobs: PlasmaBlob[] = [];
      const leadPulse = 1 + Math.sin(time * 2.4) * 0.06 + Math.sin(time * 4.2 + 1.18) * 0.04;
      blobs.push({
        x: x + motionBiasX * 0.58,
        y: y + motionBiasY * 0.58,
        radius: baseRadius * leadPulse * (1 + turbulence * 0.34),
        alpha: 0.92 * intensity
      });

      const satellites = reduceMotionRef.current ? 3 : 5;
      for (let index = 0; index < satellites; index += 1) {
        const angleBase = (Math.PI * 2 * index) / satellites;
        const swirl = time * (0.52 + turbulence * 0.56) + angleBase;
        const orbital = baseRadius * (0.34 + 0.13 * Math.sin(time * 1.63 + index * 1.12) + turbulence * 0.24);
        const xOffset = Math.cos(swirl) * orbital + motionBiasX * (index % 2 === 0 ? 0.2 : -0.16);
        const yOffset = Math.sin(swirl) * orbital + motionBiasY * (index % 2 === 0 ? -0.16 : 0.2);

        blobs.push({
          x: x + xOffset,
          y: y + yOffset,
          radius: baseRadius * (0.36 + 0.09 * Math.sin(time * 2.08 + index * 0.92) + turbulence * 0.18),
          alpha: (0.56 + 0.12 * Math.sin(time * 1.4 + index * 0.8)) * intensity
        });
      }

      for (const trail of nextTrails) {
        const lifeRatio = clamp(trail.lifeMs / trail.maxLifeMs, 0, 1);
        const wobble = 1 + Math.sin(time * 2.6 * trail.wobble + trail.phase) * 0.16;

        blobs.push({
          x: trail.x,
          y: trail.y,
          radius: trail.radius * wobble,
          alpha: Math.pow(lifeRatio, 1.42) * 0.62 * intensity
        });
      }

      hero.style.setProperty("--plasma-mask", buildPlasmaMask(blobs));

      const plasmaOpacity = clamp(intensity * (0.72 + turbulence * 0.24) + nextTrails.length * 0.014, 0, 0.98);
      hero.style.setProperty("--plasma-opacity", plasmaOpacity.toFixed(3));
      hero.style.setProperty("--flow-energy", clamp(0.18 + turbulence * 0.82, 0.18, 1).toFixed(3));

      const interactionRadius = baseRadius * (0.68 + turbulence * 0.42);
      const nextTone: ToneState =
        intensity < 0.11
          ? { name: false, innovator: false, socials: false }
          : {
              name: intersectsCircle(boundsRef.current.name, { x, y }, interactionRadius),
              innovator: intersectsCircle(boundsRef.current.innovator, { x, y }, interactionRadius),
              socials: intersectsCircle(boundsRef.current.socials, { x, y }, interactionRadius)
            };

      const prev = toneRef.current;
      if (
        nextTone.name !== prev.name ||
        nextTone.innovator !== prev.innovator ||
        nextTone.socials !== prev.socials
      ) {
        toneRef.current = nextTone;
        setTones(nextTone);
      }
    },
    [resetPlasmaStyles, resetTones, spawnTrail]
  );

  const syncViewport = useCallback(() => {
    const heroRect = heroRef.current?.getBoundingClientRect();
    const width = heroRect ? heroRect.width : window.innerWidth;
    const height = heroRect ? heroRect.height : window.innerHeight;
    heroOffsetRef.current = {
      left: heroRect?.left ?? 0,
      top: heroRect?.top ?? 0
    };
    viewportRef.current = { width, height };

    const isMobile = width <= 768;
    if (mobileViewportRef.current !== isMobile) {
      mobileViewportRef.current = isMobile;
      if (isMobile) {
        setRevealActiveState(false);
      }
    }

    const center = { x: width / 2, y: height / 2 };
    if (!hasPointerRef.current && !touchActiveRef.current) {
      currentRef.current = center;
      targetRef.current = center;
      lastSampleRef.current = center;
    }

    setupMatrixCanvas();
    measureBounds();
    measureTopPortraitBounds();
    applyScene(currentRef.current.x || center.x, currentRef.current.y || center.y, performance.now(), 1 / 60);
  }, [applyScene, measureBounds, measureTopPortraitBounds, setRevealActiveState, setupMatrixCanvas]);

  const syncTopLayerHover = useCallback(
    (x: number, y: number, isDesktopPointer: boolean) => {
      if (!isDesktopPointer) {
        setTopLayerHovered(false);
        return;
      }

      if (!topPortraitBoundsRef.current) {
        measureTopPortraitBounds();
      }

      const hovered = isPointInsideRect(topPortraitBoundsRef.current, { x, y });
      setTopLayerHovered(hovered);
    },
    [measureTopPortraitBounds]
  );

  const updateTarget = useCallback(
    (viewportX: number, viewportY: number, pointerType: string) => {
      hasPointerRef.current = true;
      const { left, top } = heroOffsetRef.current;
      const x = viewportX - left;
      const y = viewportY - top;
      targetRef.current = { x, y };

      const isDesktopPointer = !mobileViewportRef.current && pointerType !== "touch";
      if (isDesktopPointer) {
        setRevealActiveState(true);
      }
      syncTopLayerHover(x, y, isDesktopPointer);

      const previous = lastRawRef.current;
      lastRawRef.current = { x, y };
      if (!previous || !isDesktopPointer || reduceMotionRef.current) {
        return;
      }

      const delta = Math.hypot(x - previous.x, y - previous.y);
      const now = performance.now();
      const threshold = coarsePointerRef.current ? 64 : 42;
      const minInterval = coarsePointerRef.current ? 110 : 78;
      if (delta > threshold && now - lastTrailSpawnAtRef.current > minInterval) {
        const impliedVx = (x - previous.x) * 60;
        const impliedVy = (y - previous.y) * 60;
        spawnTrail(x, y, impliedVx, impliedVy, 1.08);
        lastTrailSpawnAtRef.current = now;
      }
    },
    [setRevealActiveState, spawnTrail, syncTopLayerHover]
  );

  const centerTarget = useCallback(() => {
    const { width, height } = viewportRef.current;
    targetRef.current = { x: width / 2, y: height / 2 };
    lastRawRef.current = null;
  }, []);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType === "touch") {
        touchActiveRef.current = true;
      }
      updateTarget(event.clientX, event.clientY, event.pointerType);
    },
    [updateTarget]
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType !== "touch") return;
      touchActiveRef.current = true;
      updateTarget(event.clientX, event.clientY, event.pointerType);
    },
    [updateTarget]
  );

  const onPointerEnter = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType !== "mouse") return;
      updateTarget(event.clientX, event.clientY, event.pointerType);
    },
    [updateTarget]
  );

  const onPointerLeave = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType === "touch") return;
      setRevealActiveState(false);
      setTopLayerHovered(false);
      centerTarget();
    },
    [centerTarget, setRevealActiveState, setTopLayerHovered]
  );

  const onPointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType !== "touch") return;
      touchActiveRef.current = false;
      setRevealActiveState(false);
      setTopLayerHovered(false);
      centerTarget();
    },
    [centerTarget, setRevealActiveState, setTopLayerHovered]
  );

  useEffect(() => {
    let cancelled = false;

    const loadPortraitSize = (src: string, key: "me" | "ai") => {
      if (portraitSizesRef.current[key]) return;

      const image = new window.Image();
      image.decoding = "async";
      image.onload = () => {
        if (cancelled) return;
        portraitSizesRef.current[key] = {
          width: image.naturalWidth || 1,
          height: image.naturalHeight || 1
        };
        measureTopPortraitBounds();
        syncTopLayerHover(
          targetRef.current.x,
          targetRef.current.y,
          !mobileViewportRef.current && revealActiveRef.current
        );
      };
      image.onerror = () => {
        if (cancelled) return;
        portraitSizesRef.current[key] = null;
      };
      image.src = src;
    };

    loadPortraitSize("/hero-me.png", "me");
    loadPortraitSize("/hero-ai.png", "ai");
    measureTopPortraitBounds();
    syncTopLayerHover(
      targetRef.current.x,
      targetRef.current.y,
      !mobileViewportRef.current && revealActiveRef.current
    );

    return () => {
      cancelled = true;
    };
  }, [measureTopPortraitBounds, syncTopLayerHover]);

  useEffect(() => {
    measureTopPortraitBounds();
    syncTopLayerHover(
      targetRef.current.x,
      targetRef.current.y,
      !mobileViewportRef.current && revealActiveRef.current
    );
  }, [measureTopPortraitBounds, syncTopLayerHover]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");

    const syncMedia = () => {
      reduceMotionRef.current = reduceMotion.matches;
      coarsePointerRef.current = coarsePointer.matches;
      setupMatrixCanvas();
    };

    syncMedia();
    reduceMotion.addEventListener("change", syncMedia);
    coarsePointer.addEventListener("change", syncMedia);

    const onResize = () => syncViewport();
    const onScroll = () => {
      const heroRect = heroRef.current?.getBoundingClientRect();
      heroOffsetRef.current = {
        left: heroRect?.left ?? 0,
        top: heroRect?.top ?? 0
      };
      if (heroRect) {
        viewportRef.current = {
          width: heroRect.width,
          height: heroRect.height
        };
      }
      measureBounds();
      measureTopPortraitBounds();
      syncTopLayerHover(
        targetRef.current.x,
        targetRef.current.y,
        !mobileViewportRef.current && revealActiveRef.current
      );
    };
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measureBounds) : null;
    if (observer) {
      if (nameRef.current) observer.observe(nameRef.current);
      if (innovatorRef.current) observer.observe(innovatorRef.current);
      if (socialsRef.current) observer.observe(socialsRef.current);
    }

    syncViewport();

    return () => {
      reduceMotion.removeEventListener("change", syncMedia);
      coarsePointer.removeEventListener("change", syncMedia);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.removeEventListener("scroll", onScroll);
      observer?.disconnect();
    };
  }, [measureBounds, measureTopPortraitBounds, setupMatrixCanvas, syncTopLayerHover, syncViewport]);

  useEffect(() => {
    if (matrixActive) {
      startMatrix();
      return;
    }
    stopMatrix(true);
  }, [matrixActive, startMatrix, stopMatrix]);

  useEffect(() => {
    const tick = (time: number) => {
      const current = currentRef.current;
      const target = targetRef.current;

      const dt = lastTickAtRef.current > 0 ? Math.min(64, time - lastTickAtRef.current) / 1000 : 1 / 60;
      lastTickAtRef.current = time;

      const lerpFactor = mobileViewportRef.current ? MOBILE_LERP_FACTOR : DESKTOP_LERP_FACTOR;
      if (reduceMotionRef.current) {
        current.x = target.x;
        current.y = target.y;
      } else {
        current.x += (target.x - current.x) * lerpFactor;
        current.y += (target.y - current.y) * lerpFactor;
      }

      applyScene(current.x, current.y, time, dt);
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      stopMatrix(true);
      plasmaTrailsRef.current = [];
      resetPlasmaStyles();
      lastTickAtRef.current = 0;
    };
  }, [applyScene, resetPlasmaStyles, stopMatrix]);

  return (
    <section
      id="hero-spotlight"
      ref={heroRef}
      className={[styles.hero, agentMode ? styles.agentMode : ""].filter(Boolean).join(" ")}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerLeave={onPointerLeave}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      aria-label="Kyle Springfield hero"
    >
      <div
        className={[styles.matrixLayer, matrixActive ? styles.matrixLayerActive : ""].filter(Boolean).join(" ")}
        aria-hidden="true"
      >
        <canvas ref={matrixCanvasRef} className={styles.matrixCanvas} />
      </div>

      <div className={styles.gridOverlay} aria-hidden="true" />
      <div
        className={[styles.layer, styles.topLayer, revealActive && topLayerHovered ? styles.topLayerReveal : ""]
          .filter(Boolean)
          .join(" ")}
      />
      <div
        className={[styles.layer, styles.plasmaRevealLayer, revealActive ? styles.plasmaRevealLayerActive : ""]
          .filter(Boolean)
          .join(" ")}
        aria-hidden="true"
      />

      <div className={styles.uiLayer}>
        <div
          ref={nameRef}
          className={`${styles.nameBlock} ${tones.name ? styles.toneLight : styles.toneDark}`}
        >
          <span className={styles.nameLine}>{agentMode ? "Agent" : "Kyle"}</span>
          <span className={styles.nameLine}>{agentMode ? "Kyle" : "Springfield"}</span>
        </div>

        <button
          type="button"
          className={`${styles.profileToggle} ${agentMode ? styles.profileToggleActive : ""}`}
          onClick={() => setAgentMode((previous) => !previous)}
          aria-label={agentMode ? "Switch to Kyle mode" : "Switch to Agent Kyle mode"}
          aria-pressed={agentMode}
        >
          <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2a5 5 0 1 1-5 5 5 5 0 0 1 5-5m0 12c5.14 0 9 2.43 9 5v1H3v-1c0-2.57 3.86-5 9-5" />
          </svg>
          <span className={styles.srOnly}>{agentMode ? "Switch to Kyle" : "Switch to Agent Kyle"}</span>
        </button>

        <div
          ref={innovatorRef}
          className={`${styles.innovatorAnchor} ${tones.innovator ? styles.toneLight : styles.toneDark}`}
        >
          <Link href="/about" className={styles.innovatorLink}>
            About
          </Link>
        </div>

        <div ref={socialsRef} className={`${styles.socialRow} ${tones.socials ? styles.toneLight : styles.toneDark}`}>
          <a
            className={styles.socialIconLink}
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
          >
            <svg className={styles.socialIcon} viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.087 3.269.222 2.76.42A3.9 3.9 0 0 0 1.353 1.353 3.9 3.9 0 0 0 .42 2.76c-.198.509-.333 1.09-.372 1.943C.01 5.556 0 5.83 0 8.001s.01 2.444.048 3.297c.039.853.174 1.434.372 1.943a3.9 3.9 0 0 0 .933 1.408 3.9 3.9 0 0 0 1.408.933c.509.198 1.09.333 1.943.372.853.038 1.126.048 3.297.048s2.444-.01 3.297-.048c.853-.039 1.434-.174 1.943-.372a4 4 0 0 0 2.341-2.341c.198-.509.333-1.09.372-1.943.038-.853.048-1.126.048-3.297s-.01-2.444-.048-3.297c-.039-.853-.174-1.434-.372-1.943a4 4 0 0 0-2.341-2.341c-.509-.198-1.09-.333-1.943-.372C10.444.01 10.171 0 8 0m0 1.441c2.134 0 2.387.008 3.232.047.782.036 1.206.166 1.488.275.374.145.64.319.92.6.281.28.456.546.601.92.109.282.239.706.275 1.488.038.845.046 1.098.046 3.231 0 2.134-.008 2.387-.046 3.232-.036.782-.166 1.206-.275 1.488a2.46 2.46 0 0 1-.601.92 2.46 2.46 0 0 1-.92.601c-.282.109-.706.239-1.488.275-.845.038-1.098.046-3.232.046-2.133 0-2.386-.008-3.231-.046-.782-.036-1.206-.166-1.488-.275a2.46 2.46 0 0 1-.92-.601 2.46 2.46 0 0 1-.601-.92c-.109-.282-.239-.706-.275-1.488C1.449 10.387 1.44 10.134 1.44 8c0-2.133.009-2.386.047-3.231.036-.782.166-1.206.275-1.488.145-.374.319-.64.6-.92.28-.281.546-.456.92-.601.282-.109.706-.239 1.488-.275C5.614 1.449 5.867 1.44 8 1.44m0 2.456A4.103 4.103 0 1 0 8 12.103 4.103 4.103 0 0 0 8 3.897m0 6.767a2.663 2.663 0 1 1 0-5.326 2.663 2.663 0 0 1 0 5.326m5.23-6.93a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92" />
            </svg>
            <span className={styles.srOnly}>Instagram</span>
          </a>

          <a className={styles.socialIconLink} href={X_URL} target="_blank" rel="noreferrer" aria-label="X">
            <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18.901 1.153h3.68l-8.041 9.191L24 22.847h-7.405l-5.8-7.584-6.639 7.584H.474l8.601-9.831L0 1.154h7.594l5.243 6.932zM17.61 20.644h2.039L6.486 3.241H4.298z" />
            </svg>
            <span className={styles.srOnly}>X</span>
          </a>
        </div>
      </div>
    </section>
  );
}
