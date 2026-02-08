"use client";

import Image from "next/image";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import styles from "@/components/viz/ImpactTimeline.module.css";

interface ImpactTimelineItem {
  year: number;
  label: string;
}

interface TimelineLogo {
  src: string;
  alt: string;
}

interface TimelineDetail {
  role: string;
  companyLine: string;
  dateLocation: string;
  bullets: string[];
}

type DecoratedTimelineItem = ImpactTimelineItem & {
  logo: TimelineLogo;
  detail: TimelineDetail;
};

function clampUnit(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

function getLogoForLabel(label: string): TimelineLogo {
  const lower = label.toLowerCase();
  if (lower.includes("netapp")) return { src: "/company-logos/netapp.png", alt: "NetApp logo placeholder" };
  if (lower.includes("ubs")) return { src: "/company-logos/ubs.png", alt: "UBS logo placeholder" };
  if (lower.includes("rrd")) return { src: "/company-logos/rrd.png", alt: "RRD logo placeholder" };
  if (lower.includes("freelance")) return { src: "/company-logos/freelance.png", alt: "Freelance logo placeholder" };
  if (lower.includes("peraton")) return { src: "/company-logos/peraton.png", alt: "Peraton logo placeholder" };
  if (lower.includes("cisco")) return { src: "/company-logos/cisco.png", alt: "Cisco logo placeholder" };
  return { src: "/company-logos/company.png", alt: "Company logo placeholder" };
}

function getDetailForLabel(label: string): TimelineDetail {
  const lower = label.toLowerCase();

  if (lower.includes("cisco")) {
    return {
      role: "Business Analyst III",
      companyLine: "TEKsystems at Cisco",
      dateLocation: "09/2025 – Present | Raleigh, NC",
      bullets: [
        "Build and ship Tableau dashboards and self-serve metrics for Global Sales Enablement; transform training and survey data from Snowflake into decision-ready insights for leaders.",
        "Partner with PMs and Sales Directors to prioritize analytics, define KPIs, and surface adoption/impact trends that inform enablement strategy, content, and field rollout.",
      ],
    };
  }

  if (lower.includes("netapp")) {
    return {
      role: "Analytics Foundations (Placeholder)",
      companyLine: "NetApp",
      dateLocation: "2013 | Placeholder location",
      bullets: [
        "Placeholder detail: foundational analytics and reporting work from resume source data.",
        "Placeholder detail: cross-functional partnership and data quality improvements.",
      ],
    };
  }

  if (lower.includes("ubs")) {
    return {
      role: "Reporting + Analysis (Placeholder)",
      companyLine: "UBS",
      dateLocation: "2014 | Placeholder location",
      bullets: [
        "Placeholder detail: built recurring reporting workflows for business stakeholders.",
        "Placeholder detail: improved analysis turnaround and metric clarity.",
      ],
    };
  }

  if (lower.includes("rrd")) {
    return {
      role: "Analytics to Data Engineering (Placeholder)",
      companyLine: "RRD",
      dateLocation: "2017 | Placeholder location",
      bullets: [
        "Placeholder detail: expanded scope from analytics to data science and engineering.",
        "Placeholder detail: delivered production-ready data assets and pipelines.",
      ],
    };
  }

  if (lower.includes("freelance")) {
    return {
      role: "Freelance Systems Builder (Placeholder)",
      companyLine: "Independent",
      dateLocation: "2021 | Placeholder location",
      bullets: [
        "Placeholder detail: built Python-based systems and automations for clients.",
        "Placeholder detail: focused on reliability, clarity, and delivery velocity.",
      ],
    };
  }

  if (lower.includes("peraton")) {
    return {
      role: "Data Pipeline Delivery (Placeholder)",
      companyLine: "Peraton",
      dateLocation: "2024 | Placeholder location",
      bullets: [
        "Placeholder detail: implemented CMS FWA-oriented pipeline and analytics work.",
        "Placeholder detail: coordinated with stakeholders on data priorities and quality.",
      ],
    };
  }

  return {
    role: "Experience Detail (Placeholder)",
    companyLine: label,
    dateLocation: "Date range | Location",
    bullets: [
      "Placeholder detail from resume for this timeline node.",
      "Additional placeholder bullet describing outcomes and scope.",
    ],
  };
}

export function ImpactTimeline({ items }: { items: ImpactTimelineItem[] }) {
  const [activeItem, setActiveItem] = useState<DecoratedTimelineItem | null>(null);

  const decoratedItems = useMemo(
    (): DecoratedTimelineItem[] =>
      items.map((item) => {
        const logo = getLogoForLabel(item.label);
        return {
          ...item,
          logo,
          detail: getDetailForLabel(item.label),
        };
      }),
    [items],
  );

  function onCardPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const card = event.currentTarget.parentElement;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    card.style.setProperty("--hx", clampUnit(x).toFixed(4));
    card.style.setProperty("--hy", clampUnit(y).toFixed(4));
  }

  function onCardPointerLeave(event: ReactPointerEvent<HTMLButtonElement>) {
    const card = event.currentTarget.parentElement;
    if (!card) return;
    card.style.setProperty("--hx", "0");
    card.style.setProperty("--hy", "0");
  }

  useEffect(() => {
    if (!activeItem) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveItem(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeItem]);

  if (decoratedItems.length === 0) {
    return (
      <div className="card-base text-sm text-muted">
        Impact timeline will appear after resume ingestion creates timeline highlight data.
      </div>
    );
  }

  return (
    <>
      <ol
        className={styles.rail}
        aria-label="Career impact timeline"
        style={{ "--count": String(decoratedItems.length) } as CSSProperties}
      >
        {decoratedItems.map((item, index) => {
          const depth = 1 + (index % 3) * 0.16;
          return (
            <li
              key={`${item.year}-${item.label}`}
              className={styles.item}
              style={
                {
                  "--depth": depth.toFixed(2),
                  "--i": String(index),
                } as CSSProperties
              }
            >
              <article className={styles.card}>
                <div className={styles.cardHead}>
                  <p className={styles.year}>{item.year}</p>
                  <Image src={item.logo.src} alt={item.logo.alt} width={160} height={86} className={styles.logo} />
                </div>
                <p className={styles.label}>{item.label}</p>
                <span className={styles.cardCta} aria-hidden="true">
                  View details
                </span>
                <button
                  type="button"
                  className={styles.cardTrigger}
                  onClick={() => setActiveItem(item)}
                  onPointerMove={onCardPointerMove}
                  onPointerLeave={onCardPointerLeave}
                  onPointerCancel={onCardPointerLeave}
                  aria-label={`Open details for ${item.label}`}
                />
              </article>
            </li>
          );
        })}
      </ol>

      {activeItem ? (
        <div className={styles.modalBackdrop} onClick={() => setActiveItem(null)} role="presentation">
          <section
            className={styles.modalPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="timeline-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setActiveItem(null)}
              aria-label="Close timeline detail"
            >
              <span aria-hidden="true">×</span>
            </button>

            <div className={styles.modalHeader}>
              <Image
                src={activeItem.logo.src}
                alt={activeItem.logo.alt}
                width={88}
                height={50}
                className={styles.modalLogo}
              />
              <div>
                <h4 id="timeline-modal-title" className={styles.modalRole}>
                  {activeItem.detail.role}
                </h4>
                <p className={styles.modalCompany}>{activeItem.detail.companyLine}</p>
                <p className={styles.modalMeta}>{activeItem.detail.dateLocation}</p>
              </div>
            </div>

            <ul className={styles.modalBullets}>
              {activeItem.detail.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </>
  );
}
