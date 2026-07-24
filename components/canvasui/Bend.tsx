"use client";

import { useEffect, useRef } from "react";

/**
 * An isolated Canvas UI Bend transition. The canvas is purely presentational;
 * it responds only while this short boundary is near the viewport.
 */
export function Bend() {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 1;
    let height = 1;
    let dpr = 1;
    let progress = reduced ? 0.72 : 0;
    let target = progress;
    let frame = 0;
    let visible = false;

    const resize = () => {
      const rect = root.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      frame = 0;
      progress += (target - progress) * (reduced ? 1 : 0.11);
      const crease = height * 0.5;
      const depth = 9 + progress * 22;

      context.clearRect(0, 0, width, height);

      const wash = context.createLinearGradient(0, 0, 0, height);
      wash.addColorStop(0, "rgba(6, 11, 19, 0)");
      wash.addColorStop(0.48, `rgba(28, 37, 58, ${0.18 + progress * 0.18})`);
      wash.addColorStop(0.52, `rgba(58, 80, 107, ${0.16 + progress * 0.2})`);
      wash.addColorStop(1, "rgba(6, 11, 19, 0)");
      context.fillStyle = wash;
      context.fillRect(0, 0, width, height);

      context.lineWidth = 1;
      for (let index = -5; index <= 5; index += 1) {
        const base = crease + index * 13;
        context.beginPath();
        for (let x = 0; x <= width; x += 12) {
          const normalized = x / width;
          const curve = Math.sin(normalized * Math.PI);
          const direction = index < 0 ? 1 : -1;
          const y = base + curve * depth * direction * Math.min(1, Math.abs(index) / 2 + 0.3);
          if (x === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.strokeStyle = `rgba(76, 101, 135, ${0.07 + progress * 0.13})`;
        context.stroke();
      }

      for (let x = 0; x <= width; x += Math.max(42, width / 18)) {
        const normalized = x / width;
        const pinch = Math.sin(normalized * Math.PI) * depth;
        context.beginPath();
        context.moveTo(x, crease - 56 + pinch);
        context.lineTo(x, crease + 56 - pinch);
        context.strokeStyle = `rgba(65, 82, 105, ${0.05 + progress * 0.1})`;
        context.stroke();
      }

      const line = context.createLinearGradient(0, 0, width, 0);
      line.addColorStop(0, "rgba(151, 182, 216, 0)");
      line.addColorStop(0.5, `rgba(151, 182, 216, ${0.24 + progress * 0.34})`);
      line.addColorStop(1, "rgba(151, 182, 216, 0)");
      context.fillStyle = line;
      context.fillRect(0, crease - 0.5, width, 1);

      if (visible && Math.abs(target - progress) > 0.002) {
        frame = window.requestAnimationFrame(draw);
      }
    };

    const sync = () => {
      if (reduced) return;
      const rect = root.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const center = rect.top + rect.height / 2;
      target = Math.max(0, Math.min(1, 1 - Math.abs(center - viewport / 2) / (viewport * 0.62)));
      if (!frame) frame = window.requestAnimationFrame(draw);
    };

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) sync();
    }, { rootMargin: "20% 0px" });
    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw();
    });

    intersection.observe(root);
    resizeObserver.observe(root);
    resize();
    draw();
    window.addEventListener("scroll", sync, { passive: true });

    return () => {
      intersection.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("scroll", sync);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="canvasui-bend-transition"
      aria-label="Transition from career experience to experimental project work"
    >
      <canvas ref={canvasRef} className="canvasui-bend-canvas" aria-hidden="true" />
      <div className="canvasui-bend-label" aria-hidden="true">
        <span>Experience</span>
        <span className="canvasui-bend-arrow">→</span>
        <span>Experiments</span>
      </div>
    </section>
  );
}
