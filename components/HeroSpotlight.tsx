"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { THEME_RGB } from "@/lib/theme/palette";
import styles from "./HeroSpotlight.module.css";

const INSTAGRAM_URL = "https://instagram.com/kspringfpv";
const X_URL = "https://x.com/kspringfield13";

const MAX_ECHOES = 14;
const LERP_FACTOR = 0.16;
const MATRIX_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+-";

type Point = { x: number; y: number };
type Echo = { id: number; x: number; y: number; radius: number; lifeMs: number };
type ToneState = { name: boolean; innovator: boolean; socials: boolean };
type BoundsState = { name: DOMRect | null; innovator: DOMRect | null; socials: DOMRect | null };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function intersectsCircle(rect: DOMRect | null, circle: Point, radius: number) {
  if (!rect) return false;
  const nearestX = clamp(circle.x, rect.left, rect.right);
  const nearestY = clamp(circle.y, rect.top, rect.bottom);
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return dx * dx + dy * dy <= radius * radius;
}

export function HeroSpotlight() {
  const heroRef = useRef<HTMLElement>(null);
  const matrixCanvasRef = useRef<HTMLCanvasElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const innovatorRef = useRef<HTMLDivElement>(null);
  const socialsRef = useRef<HTMLDivElement>(null);

  const viewportRef = useRef({ width: 0, height: 0 });
  const targetRef = useRef<Point>({ x: 0, y: 0 });
  const currentRef = useRef<Point>({ x: 0, y: 0 });
  const lastRawRef = useRef<Point | null>(null);
  const boundsRef = useRef<BoundsState>({ name: null, innovator: null, socials: null });

  const rafRef = useRef<number | null>(null);
  const matrixRafRef = useRef<number | null>(null);
  const hasPointerRef = useRef(false);
  const touchActiveRef = useRef(false);
  const coarsePointerRef = useRef(false);
  const reduceMotionRef = useRef(false);
  const spotlightRadiusRef = useRef(128);
  const lastEchoAtRef = useRef(0);
  const nextEchoIdRef = useRef(1);
  const echoTimeoutsRef = useRef<number[]>([]);
  const toneRef = useRef<ToneState>({ name: false, innovator: false, socials: false });
  const revealActiveRef = useRef(false);
  const matrixCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const matrixColumnsRef = useRef<number[]>([]);
  const matrixSpeedsRef = useRef<number[]>([]);
  const matrixFontSizeRef = useRef(16);
  const matrixSizeRef = useRef({ width: 0, height: 0 });
  const matrixLastTimeRef = useRef(0);
  const matrixLastDrawAtRef = useRef(0);

  const [revealActive, setRevealActive] = useState(false);
  const [tones, setTones] = useState<ToneState>({ name: false, innovator: false, socials: false });
  const [echoes, setEchoes] = useState<Echo[]>([]);

  const setRevealActiveState = useCallback((next: boolean) => {
    if (revealActiveRef.current === next) return;
    revealActiveRef.current = next;
    setRevealActive(next);

    if (!next) {
      lastRawRef.current = null;
      setEchoes([]);
      const prev = toneRef.current;
      if (prev.name || prev.innovator || prev.socials) {
        const reset = { name: false, innovator: false, socials: false };
        toneRef.current = reset;
        setTones(reset);
      }
    }
  }, []);

  const measureBounds = useCallback(() => {
    boundsRef.current = {
      name: nameRef.current?.getBoundingClientRect() ?? null,
      innovator: innovatorRef.current?.getBoundingClientRect() ?? null,
      socials: socialsRef.current?.getBoundingClientRect() ?? null
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
    if (!ctx || width === 0 || height === 0 || !revealActiveRef.current) {
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

  const applyScene = useCallback((x: number, y: number) => {
    const hero = heroRef.current;
    if (!hero) return;

    // The top portrait layer uses these CSS vars in a radial mask, creating a circular
    // "cut-out" where IMAGE ONE becomes transparent and IMAGE TWO is revealed underneath.
    hero.style.setProperty("--spotlight-x", `${x.toFixed(2)}px`);
    hero.style.setProperty("--spotlight-y", `${y.toFixed(2)}px`);

    const { width, height } = viewportRef.current;
    if (width > 0 && height > 0) {
      const nx = (x - width / 2) / (width / 2);
      const ny = (y - height / 2) / (height / 2);
      hero.style.setProperty("--grid-shift-x", `${(-nx * 6).toFixed(2)}px`);
      hero.style.setProperty("--grid-shift-y", `${(-ny * 6).toFixed(2)}px`);
      hero.style.setProperty("--name-shift-x", `${(-nx * 11).toFixed(2)}px`);
      hero.style.setProperty("--name-shift-y", `${(-ny * 11).toFixed(2)}px`);
      hero.style.setProperty("--link-shift-x", `${(-nx * 8).toFixed(2)}px`);
      hero.style.setProperty("--link-shift-y", `${(-ny * 8).toFixed(2)}px`);
      hero.style.setProperty("--social-shift-x", `${(-nx * 10).toFixed(2)}px`);
      hero.style.setProperty("--social-shift-y", `${(-ny * 10).toFixed(2)}px`);
    }

    if (!revealActiveRef.current) {
      return;
    }

    const radius = spotlightRadiusRef.current;
    const next: ToneState = {
      name: intersectsCircle(boundsRef.current.name, { x, y }, radius),
      innovator: intersectsCircle(boundsRef.current.innovator, { x, y }, radius),
      socials: intersectsCircle(boundsRef.current.socials, { x, y }, radius)
    };

    const prev = toneRef.current;
    if (
      next.name !== prev.name ||
      next.innovator !== prev.innovator ||
      next.socials !== prev.socials
    ) {
      toneRef.current = next;
      setTones(next);
    }
  }, []);

  const syncViewport = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    viewportRef.current = { width, height };

    const center = { x: width / 2, y: height / 2 };
    if (!hasPointerRef.current && !touchActiveRef.current) {
      currentRef.current = center;
      targetRef.current = center;
    }

    const radius = clamp(Math.min(width, height) * 0.16, 88, 162);
    spotlightRadiusRef.current = radius;
    heroRef.current?.style.setProperty("--spotlight-r", `${radius.toFixed(2)}px`);
    setupMatrixCanvas();
    measureBounds();
    applyScene(currentRef.current.x || center.x, currentRef.current.y || center.y);
  }, [applyScene, measureBounds, setupMatrixCanvas]);

  const spawnEcho = useCallback((x: number, y: number) => {
    // Echoes are transient blurred circles that spawn at high cursor velocity
    // and self-remove after a short lifetime to keep performance stable.
    const lifeMs = coarsePointerRef.current ? 220 + Math.random() * 140 : 300 + Math.random() * 280;
    const radius = spotlightRadiusRef.current * (0.36 + Math.random() * 0.26);
    const id = nextEchoIdRef.current++;
    const echo: Echo = { id, x, y, radius, lifeMs };

    setEchoes((previous) => {
      const next = [...previous, echo];
      return next.length > MAX_ECHOES ? next.slice(next.length - MAX_ECHOES) : next;
    });

    const timeoutId = window.setTimeout(() => {
      setEchoes((previous) => previous.filter((item) => item.id !== id));
      echoTimeoutsRef.current = echoTimeoutsRef.current.filter((existingId) => existingId !== timeoutId);
    }, lifeMs + 70);

    echoTimeoutsRef.current.push(timeoutId);
  }, []);

  const updateTarget = useCallback(
    (x: number, y: number, pointerType: string) => {
      setRevealActiveState(true);
      hasPointerRef.current = true;
      targetRef.current = { x, y };

      const prev = lastRawRef.current;
      lastRawRef.current = { x, y };
      if (!prev || reduceMotionRef.current) return;

      const delta = Math.hypot(x - prev.x, y - prev.y);
      const now = performance.now();
      const threshold = coarsePointerRef.current ? 52 : 34;
      const minInterval = coarsePointerRef.current ? 160 : 75;
      if (delta > threshold && now - lastEchoAtRef.current > minInterval && pointerType !== "pen") {
        spawnEcho(x, y);
        lastEchoAtRef.current = now;
      }
    },
    [setRevealActiveState, spawnEcho]
  );

  const centerSpotlight = useCallback(() => {
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
      if (event.pointerType === "mouse") {
        updateTarget(event.clientX, event.clientY, event.pointerType);
      }
    },
    [updateTarget]
  );

  const onPointerLeave = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType !== "touch") {
        setRevealActiveState(false);
        centerSpotlight();
      }
    },
    [centerSpotlight, setRevealActiveState]
  );

  const onPointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType !== "touch") return;
      touchActiveRef.current = false;
      setRevealActiveState(false);
      centerSpotlight();
    },
    [centerSpotlight, setRevealActiveState]
  );

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
    const onScroll = () => measureBounds();
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
  }, [measureBounds, setupMatrixCanvas, syncViewport]);

  useEffect(() => {
    if (revealActive) {
      startMatrix();
      return;
    }
    stopMatrix(true);
  }, [revealActive, startMatrix, stopMatrix]);

  useEffect(() => {
    const tick = () => {
      const current = currentRef.current;
      const target = targetRef.current;

      if (reduceMotionRef.current) {
        current.x = target.x;
        current.y = target.y;
      } else {
        current.x += (target.x - current.x) * LERP_FACTOR;
        current.y += (target.y - current.y) * LERP_FACTOR;
      }

      applyScene(current.x, current.y);
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      stopMatrix(true);
      echoTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
      echoTimeoutsRef.current = [];
    };
  }, [applyScene, stopMatrix]);

  return (
    <section
      ref={heroRef}
      className={styles.hero}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerLeave={onPointerLeave}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      aria-label="Kyle Springfield hero"
    >
      <div
        className={[
          styles.matrixLayer,
          revealActive ? styles.matrixLayerActive : "",
          revealActive ? styles.matrixLayerReveal : ""
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden="true"
      >
        <canvas ref={matrixCanvasRef} className={styles.matrixCanvas} />
      </div>

      <div
        className={[
          styles.layer,
          styles.underLayer,
          revealActive ? styles.underLayerActive : "",
          revealActive ? styles.underLayerReveal : ""
        ]
          .filter(Boolean)
          .join(" ")}
      />
      <div
        className={[
          styles.layer,
          styles.topLayer,
          revealActive ? styles.topLayerMasked : ""
        ]
          .filter(Boolean)
          .join(" ")}
      />

      <div className={styles.echoLayer} aria-hidden="true">
        {echoes.map((echo) => (
          <span
            key={echo.id}
            className={styles.echo}
            style={{
              left: `${echo.x}px`,
              top: `${echo.y}px`,
              width: `${(echo.radius * 2).toFixed(2)}px`,
              height: `${(echo.radius * 2).toFixed(2)}px`,
              animationDuration: `${echo.lifeMs.toFixed(0)}ms`
            }}
          />
        ))}
      </div>

      <div className={styles.gridOverlay} aria-hidden="true" />

      <div className={styles.uiLayer}>
        <div
          ref={nameRef}
          className={`${styles.nameBlock} ${tones.name ? styles.toneLight : styles.toneDark}`}
        >
          <span className={styles.nameLine}>Kyle</span>
          <span className={styles.nameLine}>Springfield</span>
        </div>

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
