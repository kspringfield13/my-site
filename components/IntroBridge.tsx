"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
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
  }
] as const;

const DEPARTURE_DELAY_MS = 130;
const TRANSITION_DURATION_MS = 380;

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

export function IntroBridge() {
  const timersRef = useRef<number[]>([]);
  const isTransitioningRef = useRef(false);
  const [teleport, setTeleport] = useState({ active: false, originY: 0, run: 0 });

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  function navigateTo(destination: HTMLElement, href: string, reduceMotion: boolean) {
    destination.scrollIntoView({ behavior: "auto", block: "start" });

    if (window.location.hash !== href) {
      window.history.pushState(null, "", href);
    }

    focusDestination(destination);

    if (!reduceMotion) {
      destination.animate(
        [
          { opacity: 0.58, transform: "translate3d(0, 9px, 0)" },
          { opacity: 1, transform: "translate3d(0, 0, 0)" }
        ],
        {
          duration: 280,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)"
        }
      );
    }
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
    if (reduceMotion) {
      navigateTo(destination, href, true);
      return;
    }

    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    const anchorRect = anchor.getBoundingClientRect();
    setTeleport((current) => ({
      active: true,
      originY: anchorRect.top + anchorRect.height / 2,
      run: current.run + 1
    }));

    timersRef.current.push(
      window.setTimeout(() => {
        navigateTo(destination, href, false);
      }, DEPARTURE_DELAY_MS),
      window.setTimeout(() => {
        isTransitioningRef.current = false;
        setTeleport((current) => ({ ...current, active: false }));
      }, TRANSITION_DURATION_MS)
    );
  }

  return (
    <section aria-labelledby="orientation-title" className={`section-wrap ${styles.orientation}`}>
      <div className={styles.frame}>
        <p id="orientation-title" className={styles.statement}>
          Kyle builds data systems and AI tools that make work clearer.
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

      <span
        key={teleport.run}
        aria-hidden="true"
        className={`${styles.teleportTrace} ${teleport.active ? styles.teleportTraceActive : ""}`}
        style={{ "--teleport-origin-y": `${teleport.originY}px` } as CSSProperties}
      />
    </section>
  );
}
