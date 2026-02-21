"use client";

import { useEffect, useRef, useState } from "react";

interface FooterVideoBackgroundProps {
  src?: string | null;
}

function inferVideoMimeType(url: string): string | undefined {
  const base = url.split("?")[0]?.split("#")[0]?.toLowerCase() ?? "";
  // Chromium often reports `video/quicktime` as unsupported even when it can decode the .mov stream.
  // Leaving type undefined allows the browser to sniff the source.
  if (base.endsWith(".mov")) return undefined;
  if (base.endsWith(".webm")) return "video/webm";
  if (base.endsWith(".ogv")) return "video/ogg";
  if (base.endsWith(".mp4") || base.endsWith(".m4v")) return "video/mp4";
  return undefined;
}

export function FooterVideoBackground({ src }: FooterVideoBackgroundProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const sourceType = src ? inferVideoMimeType(src) : undefined;

  useEffect(() => {
    if (!src || isActive) {
      return;
    }

    const projectsSection = document.getElementById("projects");
    const contactSection = anchorRef.current?.closest("section");
    const targets = [projectsSection, contactSection].filter(Boolean) as Element[];

    if (targets.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          // Start as soon as Projects is reached; keep contact as a fallback trigger.
          if (entry.target.id === "projects" && entry.intersectionRatio >= 0.08) {
            setIsActive(true);
            return;
          }

          if (entry.intersectionRatio >= 0.28) {
            setIsActive(true);
            return;
          }
        }
      },
      {
        threshold: [0, 0.08, 0.28, 0.5, 0.75],
        rootMargin: "0px 0px -8% 0px"
      }
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [isActive, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) {
      return;
    }

    if (isActive) {
      video.play().catch(() => {});
      return;
    }

    video.pause();
  }, [isActive, src]);

  if (!src) {
    return null;
  }

  return (
    <div ref={anchorRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <video
        ref={videoRef}
        className={`footer-video-layer ${isActive ? "is-active" : ""}`}
        muted
        loop
        playsInline
        preload="none"
      >
        <source src={src} type={sourceType} />
      </video>
      <div className="footer-video-vignette" />
      <div className="footer-video-top-blur" />
    </div>
  );
}
