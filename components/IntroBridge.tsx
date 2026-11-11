"use client";

import {
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent
} from "react";
import styles from "./IntroBridge.module.css";

const ORIENTATION_LINKS = [
  {
    href: "#proof",
    label: "Career impact",
    destination: "Proof / timeline"
  },
  {
    href: "#projects",
    label: "Applied projects",
    destination: "Projects"
  },
  {
    href: "#now",
    label: "Current experiments",
    destination: "Now"
  },
  {
    href: "#playground",
    label: "AI-assisted building",
    destination: "Playground"
  }
] as const;

// Departure: the clicked card acknowledges the press and a trace line opens at its row.
const DEPARTURE_MS = 120;
// Arrival: after the jump, the trace glides to the destination heading while the section settles in.
const ARRIVAL_MS = 300;
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
const LAUNCHING_CLASS = styles.anchorLaunching;

function focusDestination(destination: HTMLElement) {
  const focusTarget = destination.querySelector<HTMLElement>("h2") ?? destination;
  const hadTabIndex = focusTarget.hasAttribute("tabindex");

  if (!hadTabIndex) {
    focusTarget.setAttribute("tabindex", "-1");
    focusTarget.addEventListener(
      "blur",
      () => {
        focusTarget.removeAttribute("tabindex");
      },
      { once: true }
    );
  }

  window.requestAnimationFrame(() => {
    focusTarget.focus({ preventScroll: true });
  });
}

/** The heading block and the content below it, in reading order. */
function arrivalBlocks(destination: HTMLElement) {
  const blocks = Array.from(destination.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement
  );
  return blocks.length > 0 ? blocks.slice(0, 2) : [destination];
}

/** Where the trace should land: just above the destination's eyebrow/heading. */
function landingY(destination: HTMLElement) {
  const marker =
    destination.querySelector<HTMLElement>(".eyebrow") ?? destination.querySelector<HTMLElement>("h2") ?? destination;
  return Math.max(0, marker.getBoundingClientRect().top - 12);
}

function playArrival(destination: HTMLElement, reduceMotion: boolean) {
  arrivalBlocks(destination).forEach((block, index) => {
    block.getAnimations().forEach((animation) => animation.cancel());

    block.animate(
      reduceMotion
        ? [{ opacity: 0.35 }, { opacity: 1 }]
        : [
            { opacity: 0, transform: `translate3d(0, ${index === 0 ? 10 : 16}px, 0)` },
            { opacity: 1, transform: "translate3d(0, 0, 0)" }
          ],
      {
        duration: reduceMotion ? 200 : ARRIVAL_MS + index * 40,
        delay: reduceMotion ? 0 : 40 + index * 70,
        easing: EASE_OUT,
        fill: "backwards"
      }
    );
  });
}

export function IntroBridge() {
  const timersRef = useRef<number[]>([]);
  const isTransitioningRef = useRef(false);
  const traceRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  function navigateTo(destination: HTMLElement, href: string) {
    destination.scrollIntoView({ behavior: "auto", block: "start" });

    if (window.location.hash !== href) {
      window.history.pushState(null, "", href);
    }

    focusDestination(destination);
  }

  function handleAnchorClick(event: ReactMouseEvent<HTMLAnchorElement>, href: string) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const destination = document.getElementById(href.slice(1));
    if (!destination) return;

    event.preventDefault();
    activateAnchor(event.currentTarget, destination, href);
  }

  function handleAnchorKeyDown(event: ReactKeyboardEvent<HTMLAnchorElement>, href: string) {
    if (event.key !== "Enter" || event.defaultPrevented) return;

    const destination = document.getElementById(href.slice(1));
    if (!destination) return;

    event.preventDefault();
    activateAnchor(event.currentTarget, destination, href);
  }

  function activateAnchor(anchor: HTMLAnchorElement, destination: HTMLElement, href: string) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const trace = traceRef.current;

    if (reduceMotion || !trace) {
      navigateTo(destination, href);
      playArrival(destination, true);
      return;
    }

    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    const anchorRect = anchor.getBoundingClientRect();
    const originY = anchorRect.top + anchorRect.height / 2;
    const at = (y: number, scaleX: number) => `translate3d(0, ${y}px, 0) scaleX(${scaleX})`;

    anchor.classList.add(LAUNCHING_CLASS);
    trace.getAnimations().forEach((animation) => animation.cancel());

    // Departure: open the trace across the clicked card's row.
    trace.animate(
      [
        { opacity: 0, transform: at(originY, 0.08) },
        { opacity: 1, transform: at(originY, 1) }
      ],
      { duration: DEPARTURE_MS, easing: EASE_OUT, fill: "forwards" }
    );

    timersRef.current.push(
      window.setTimeout(() => {
        navigateTo(destination, href);
        anchor.classList.remove(LAUNCHING_CLASS);

        // Arrival: glide the trace to where the destination heading now sits, then let it dissolve.
        const targetY = landingY(destination);
        trace.getAnimations().forEach((animation) => animation.cancel());
        trace.animate(
          [
            { opacity: 1, transform: at(originY, 1), offset: 0 },
            { opacity: 0.9, transform: at(targetY, 0.7), offset: 0.6 },
            { opacity: 0, transform: at(targetY, 0.2), offset: 1 }
          ],
          { duration: ARRIVAL_MS, easing: EASE_OUT, fill: "forwards" }
        );
        playArrival(destination, false);
      }, DEPARTURE_MS),
      window.setTimeout(() => {
        isTransitioningRef.current = false;
      }, DEPARTURE_MS + ARRIVAL_MS)
    );
  }

  return (
    <section aria-labelledby="orientation-title" className={`section-wrap ${styles.orientation}`}>
      <div className={styles.frame}>
        <p id="orientation-title" className={styles.statement}>
          Kyle builds data systems and AI tools that make work clearer. In the playground, he experiments with
          AI-assisted development to broaden his technical knowledge and learn by building.
        </p>

        <nav aria-label="Explore Kyle's work" className={styles.links}>
          {ORIENTATION_LINKS.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              className={styles.anchor}
              onClick={(event) => handleAnchorClick(event, link.href)}
              onKeyDown={(event) => handleAnchorKeyDown(event, link.href)}
            >
              <span className={styles.index} aria-hidden="true">
                0{index + 1}
              </span>
              <span className={styles.anchorCopy}>
                <span className={styles.anchorLabel}>{link.label}</span>
                <span className={styles.destination}>{link.destination}</span>
              </span>
              <span className={styles.arrow} aria-hidden="true">
                ↘
              </span>
            </a>
          ))}
        </nav>
      </div>

      <span ref={traceRef} aria-hidden="true" className={styles.teleportTrace}>
        <span className={styles.traceHaze} />
        <span className={styles.traceLine} />
      </span>
    </section>
  );
}
