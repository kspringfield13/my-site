"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Fragment = {
  text: string;
  threshold: number;
  desktopCol: string;
  mobileCol: string;
};

const FRAGMENTS: Fragment[] = [
  { text: "Hey, glad you made it here.", threshold: 0.04, desktopCol: "md:col-start-2", mobileCol: "col-start-1" },
  { text: "I built this site as a home base for my work.", threshold: 0.12, desktopCol: "md:col-start-6", mobileCol: "col-start-2" },
  {
    text: "After a bunch of projects, I wanted one place",
    threshold: 0.24,
    desktopCol: "md:col-start-3",
    mobileCol: "col-start-1"
  },
  { text: "to share what I'm building,", threshold: 0.37, desktopCol: "md:col-start-7", mobileCol: "col-start-2" },
  { text: "what I'm learning,", threshold: 0.46, desktopCol: "md:col-start-9", mobileCol: "col-start-3" },
  { text: "and where I'm headed.", threshold: 0.55, desktopCol: "md:col-start-11", mobileCol: "col-start-4" },
  {
    text: "Scroll around and you'll get the real story:",
    threshold: 0.66,
    desktopCol: "md:col-start-2",
    mobileCol: "col-start-1"
  },
  {
    text: "practical work, honest experiments, and a lot of curiosity.",
    threshold: 0.78,
    desktopCol: "md:col-start-6",
    mobileCol: "col-start-2"
  }
];

export function IntroBridge() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [inView, setInView] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { rootMargin: "18% 0px -35% 0px", threshold: [0, 0.2, 0.5, 0.8, 1] }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setProgress(1);
      return;
    }

    let frame = 0;

    const update = () => {
      const node = sectionRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const start = viewport * 1.15;
      const end = -rect.height * 0.45;
      const raw = (start - rect.top) / (start - end);
      const next = Math.max(0, Math.min(raw, 1));
      setProgress((prev) => (Math.abs(prev - next) > 0.007 ? next : prev));
    };

    const onScroll = () => {
      if (!inView) return;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [inView, reduceMotion]);

  const ambientOpacity = useMemo(() => 0.35 + progress * 0.4, [progress]);

  return (
    <section
      ref={sectionRef}
      aria-label="Interpretive bridge"
      className="section-wrap relative py-16 md:py-20"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[color:var(--c-border)]/55 to-transparent"
        style={{ opacity: ambientOpacity }}
      />

      <div className="relative grid grid-cols-4 gap-y-3 text-[0.8rem] uppercase tracking-[0.12em] text-[color:var(--c-text-faint)] md:grid-cols-12 md:gap-y-4 md:text-[0.9rem]">
        {FRAGMENTS.map((fragment, index) => {
          const visible = reduceMotion || progress >= fragment.threshold;
          const offset = (1 - Math.min(Math.max((progress - fragment.threshold) * 4, 0), 1)) * 16;

          return (
            <p
              key={fragment.text}
              className={`${fragment.mobileCol} ${fragment.desktopCol} col-span-3 md:col-span-4`}
              style={{
                opacity: visible ? 1 : 0,
                transform: `translate3d(0, ${visible ? 0 : offset}px, 0)`,
                transitionProperty: "opacity, transform",
                transitionDuration: `${reduceMotion ? 120 : 540}ms`,
                transitionTimingFunction: "cubic-bezier(0.22, 0.61, 0.36, 1)",
                transitionDelay: `${index * 35}ms`
              }}
            >
              {fragment.text}
            </p>
          );
        })}
      </div>
    </section>
  );
}
