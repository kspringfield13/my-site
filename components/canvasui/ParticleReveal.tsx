"use client";

import { useEffect, useRef } from "react";

interface ParticleRevealProps {
  className?: string;
  duration?: number;
}
type Particle = {
  x: number;
  y: number;
  size: number;
  phase: number;
  drift: number;
};

/**
 * A one-shot, presentation-only adaptation of Canvas UI's Particle Reveal.
 * It never owns the hero content, so the page stays readable during setup,
 * without canvas support, and when reduced motion is requested.
 */
export function ParticleReveal({ className = "", duration = 1350 }: ParticleRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    let width = 1;
    let height = 1;
    let dpr = 1;
    let frame = 0;
    let start = 0;
    let particles: Particle[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(620, Math.max(180, Math.round((width * height) / 2800)));
      particles = Array.from({ length: count }, (_, index) => ({
        x: ((index * 73.37) % 1000) / 1000 * width,
        y: ((index * 191.91) % 1000) / 1000 * height,
        size: 0.55 + ((index * 17) % 9) / 10,
        phase: ((index * 31) % 100) / 100 * Math.PI * 2,
        drift: 4 + ((index * 11) % 12)
      }));
    };

    const easeOut = (value: number) => 1 - Math.pow(1 - value, 3);

    const draw = (time: number) => {
      if (!start) start = time;
      const progress = Math.min(1, (time - start) / duration);
      const eased = easeOut(progress);
      const remaining = 1 - eased;
      const radius = Math.hypot(width, height) * (0.08 + eased * 0.74);
      const centerX = width * 0.54;
      const centerY = height * 0.46;

      context.clearRect(0, 0, width, height);
      context.fillStyle = `rgba(0, 0, 0, ${0.24 * remaining})`;
      context.fillRect(0, 0, width, height);

      context.globalCompositeOperation = "destination-out";
      const gradient = context.createRadialGradient(centerX, centerY, radius * 0.42, centerX, centerY, radius);
      gradient.addColorStop(0, "rgba(0,0,0,1)");
      gradient.addColorStop(0.72, "rgba(0,0,0,0.82)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      context.globalCompositeOperation = "source-over";
      for (const particle of particles) {
        const distance = Math.hypot(particle.x - centerX, particle.y - centerY);
        const edgeDistance = Math.abs(distance - radius);
        if (edgeDistance > 95) continue;

        const edge = Math.max(0, 1 - edgeDistance / 95);
        const shimmer = 0.72 + Math.sin(time * 0.005 + particle.phase) * 0.28;
        const alpha = edge * remaining * shimmer * 0.58;
        const angle = Math.atan2(particle.y - centerY, particle.x - centerX);
        const offset = particle.drift * remaining;
        const x = particle.x + Math.cos(angle) * offset;
        const y = particle.y + Math.sin(angle) * offset;

        context.beginPath();
        context.arc(x, y, particle.size, 0, Math.PI * 2);
        context.fillStyle = `rgba(141, 167, 198, ${alpha})`;
        context.fill();
      }

      if (progress < 1) {
        frame = window.requestAnimationFrame(draw);
      } else {
        context.clearRect(0, 0, width, height);
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    frame = window.requestAnimationFrame(draw);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      context.clearRect(0, 0, width, height);
    };
  }, [duration]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
