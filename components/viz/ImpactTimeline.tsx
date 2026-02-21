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
  if (lower.includes("netapp")) return { src: "/company-logos/netapp.png", alt: "NetApp logo" };
  if (lower.includes("ubs")) return { src: "/company-logos/ubs.png", alt: "UBS logo" };
  if (lower.includes("rrd") || lower.includes("vericast")) return { src: "/company-logos/rrd.png", alt: "Vericast logo" };
  if (lower.includes("freelance")) return { src: "/company-logos/freelance.png", alt: "Freelance work logo" };
  if (lower.includes("peraton")) return { src: "/company-logos/peraton.png", alt: "Peraton logo" };
  if (lower.includes("cisco")) return { src: "/company-logos/cisco.png", alt: "Cisco logo" };
  return { src: "/company-logos/company.png", alt: "Company logo" };
}

function getDetailForLabel(label: string): TimelineDetail {
  const lower = label.toLowerCase();

  if (lower.includes("cisco")) {
    return {
      role: "Business Analyst III",
      companyLine: "TEKsystems at Cisco",
      dateLocation: "Sep 2025 - Present | Raleigh, NC",
      bullets: [
        "Partner with sales leadership to translate business needs into governed datasets and decision-ready reporting, building Tableau dashboards and Streamlit apps for go-to-market strategy, pipeline visibility, and performance measurement.",
        "Design and maintain scalable dbt models in Snowflake to improve visibility into pipeline health, sales productivity, and customer engagement trends across global sales teams.",
        "Leverage Cursor daily to accelerate modeling, automate reporting logic, and design agentic processes that streamline data preparation, validation, and recurring analytics work.",
      ],
    };
  }

  if (lower.includes("netapp")) {
    return {
      role: "Data Analyst",
      companyLine: "NetApp",
      dateLocation: "May 2016 - Nov 2016 | Raleigh, NC",
      bullets: [
        "Partnered with Support Account Managers and sales teams on top enterprise accounts to deliver accurate customer-facing reporting.",
        "Built Oracle BI reports and dashboards; analyzed outputs using statistical techniques for weekly and monthly decision cycles.",
      ],
    };
  }

  if (lower.includes("ubs")) {
    return {
      role: "Risk & Performance Analytics Specialist",
      companyLine: "UBS (formerly Credit Suisse)",
      dateLocation: "Nov 2016 - Nov 2017 | Raleigh, NC",
      bullets: [
        "Designed and implemented Tableau risk and performance dashboards that reduced report generation time by over 50% for senior leadership.",
        "Collaborated with global teams to standardize and automate reporting workflows using Business Objects and VBA.",
      ],
    };
  }

  if (lower.includes("rrd") || lower.includes("vericast")) {
    return {
      role: "Data Analyst -> Data Engineer",
      companyLine: "Vericast (formerly RRD)",
      dateLocation: "Nov 2017 - Sep 2021 | Morrisville, NC",
      bullets: [
        "Progressed across Data Analyst, Marketing Data Scientist, Senior Data Scientist, and Data Engineer roles while shipping analytics and automation systems.",
        "Built Python ETL and self-service automation (including Jira-integrated workflows) plus Tableau reporting used by major clients and stakeholders.",
        "Refactored modular Python libraries for marketing-science models, cutting training and scoring runtime in half and improving model quality with testing and code review.",
      ],
    };
  }

  if (lower.includes("freelance")) {
    return {
      role: "Python Developer",
      companyLine: "Freelance",
      dateLocation: "Sep 2021 - Sep 2024 | Raleigh, NC",
      bullets: [
        "Built and optimized data pipelines and workflows with Python, SQL, TypeScript, AWS, and Gen AI for client use cases.",
        "Delivered lightweight React apps and Tableau dashboards that turned complex datasets into clear, decision-ready visuals.",
        "Automated recurring reporting with parameterized Python jobs and validation checks, improving metric accuracy and trust.",
      ],
    };
  }

  if (lower.includes("peraton")) {
    return {
      role: "Data Engineer",
      companyLine: "Peraton",
      dateLocation: "Sep 2024 - Sep 2025 | Raleigh, NC",
      bullets: [
        "Delivered high-quality data and reporting solutions supporting CMS fraud, waste, and abuse detection workflows.",
        "Architected and maintained AWS pipelines with Python, SQL, and Bash to ingest, reconcile, and validate multi-source CMS and vendor data.",
        "Curated clean datasets and metrics used in downstream investigations of suspicious provider and claims patterns.",
      ],
    };
  }

  return {
    role: "Experience Detail",
    companyLine: label,
    dateLocation: "Timeline role context",
    bullets: [
      "Resume-backed details are available for this timeline node.",
      "Open each card to view role scope, outcomes, and delivery context.",
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
