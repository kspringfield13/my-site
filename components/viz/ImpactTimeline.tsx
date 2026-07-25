"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
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
  points: Array<{
    label: "Challenge" | "Contribution" | "Impact";
    text: string;
  }>;
}

type DecoratedTimelineItem = ImpactTimelineItem & {
  logo: TimelineLogo;
  detail: TimelineDetail;
};

function getLogoForLabel(label: string): TimelineLogo {
  const lower = label.toLowerCase();
  if (lower.includes("netapp")) return { src: "/company-logos/netapp.png", alt: "NetApp logo" };
  if (lower.includes("ubs")) return { src: "/company-logos/ubs.png", alt: "UBS logo" };
  if (lower.includes("rrd") || lower.includes("vericast")) return { src: "/company-logos/rrd.png", alt: "RRD logo" };
  if (lower.includes("freelance")) return { src: "/company-logos/freelance.png", alt: "Freelance work logo" };
  if (lower.includes("peraton")) return { src: "/company-logos/peraton.png", alt: "Peraton logo" };
  if (lower.includes("cisco")) return { src: "/company-logos/cisco.png", alt: "Cisco logo" };
  return { src: "/company-logos/company.png", alt: "Company logo" };
}

function getDetailForLabel(label: string): TimelineDetail {
  const lower = label.toLowerCase();

  if (lower.includes("cisco")) {
    return {
      role: "Business Intelligence Manager",
      companyLine: "Cisco",
      dateLocation: "Jun 2026 - Present | Raleigh, NC",
      points: [
        {
          label: "Challenge",
          text: "Turn complex sales operations and program needs into governed, decision-ready reporting.",
        },
        {
          label: "Contribution",
          text: "Build Tableau and GitHub Pages reporting on Snowflake and dbt models, accelerated by AI-assisted workflows.",
        },
        {
          label: "Impact",
          text: "Improve visibility, validation, consistency, and stakeholder responsiveness across recurring analytics.",
        },
      ],
    };
  }

  if (lower.includes("netapp")) {
    return {
      role: "Data Analyst",
      companyLine: "NetApp",
      dateLocation: "May 2016 - Nov 2016 | Raleigh, NC",
      points: [
        {
          label: "Challenge",
          text: "Give support and sales teams reliable reporting for top enterprise customer accounts.",
        },
        {
          label: "Contribution",
          text: "Built Oracle BI reports and dashboards, then analyzed outputs with statistical techniques.",
        },
        {
          label: "Impact",
          text: "Delivered accurate customer-facing insights for weekly and monthly decision cycles.",
        },
      ],
    };
  }

  if (lower.includes("ubs")) {
    return {
      role: "Risk & Performance Analytics Specialist",
      companyLine: "UBS",
      dateLocation: "Nov 2016 - Nov 2017 | Raleigh, NC",
      points: [
        {
          label: "Challenge",
          text: "Make global risk and performance reporting faster and more consistent for senior leadership.",
        },
        {
          label: "Contribution",
          text: "Created Tableau dashboards and standardized Business Objects and VBA workflows with global teams.",
        },
        {
          label: "Impact",
          text: "Reduced report generation time by more than 50%.",
        },
      ],
    };
  }

  if (lower.includes("rrd") || lower.includes("vericast")) {
    return {
      role: "Data Analyst -> Data Engineer",
      companyLine: "RRD",
      dateLocation: "Nov 2017 - Sep 2021 | Morrisville, NC",
      points: [
        {
          label: "Challenge",
          text: "Scale campaign analytics, client reporting, and marketing-science workflows across a four-role progression.",
        },
        {
          label: "Contribution",
          text: "Built Python ETL, Jira-integrated self-service automation, Tableau reporting, and reusable model libraries.",
        },
        {
          label: "Impact",
          text: "Cut model training and scoring runtime in half while improving quality through tests and code review.",
        },
      ],
    };
  }

  if (lower.includes("freelance")) {
    return {
      role: "Python Developer",
      companyLine: "Freelance",
      dateLocation: "Sep 2021 - Sep 2024 | Raleigh, NC",
      points: [
        {
          label: "Challenge",
          text: "Help clients turn complex data and recurring reporting work into dependable, usable products.",
        },
        {
          label: "Contribution",
          text: "Delivered pipelines, Python automation, lightweight React apps, and Tableau dashboards.",
        },
        {
          label: "Impact",
          text: "Improved reporting accuracy and trust with parameterized jobs and validation checks.",
        },
      ],
    };
  }

  if (lower.includes("peraton")) {
    return {
      role: "Data Engineer",
      companyLine: "Peraton",
      dateLocation: "Sep 2024 - Sep 2025 | Raleigh, NC",
      points: [
        {
          label: "Challenge",
          text: "Reconcile multi-source healthcare data for CMS fraud, waste, and abuse detection workflows.",
        },
        {
          label: "Contribution",
          text: "Architected AWS pipelines in Python, SQL, and Bash with ingestion, reconciliation, and validation controls.",
        },
        {
          label: "Impact",
          text: "Produced clean datasets and metrics used in investigations of suspicious provider and claims patterns.",
        },
      ],
    };
  }

  return {
    role: "Experience Detail",
    companyLine: label,
    dateLocation: "Timeline role context",
    points: [
      {
        label: "Challenge",
        text: "Understand the business and technical context for this role.",
      },
      {
        label: "Contribution",
        text: "Review the resume-backed work associated with this timeline entry.",
      },
      {
        label: "Impact",
        text: "Connect the role scope to the broader career progression.",
      },
    ],
  };
}

export function ImpactTimeline({ items }: { items: ImpactTimelineItem[] }) {
  const [openItemIndex, setOpenItemIndex] = useState<number | null>(null);

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

  if (decoratedItems.length === 0) {
    return (
      <div className="card-base text-sm text-muted">
        Impact timeline will appear after resume ingestion creates timeline highlight data.
      </div>
    );
  }

  return (
    <ol className={styles.rail} aria-label="Career impact timeline">
      {decoratedItems.map((item, index) => {
        const isOpen = openItemIndex === index;
        const triggerId = `career-timeline-trigger-${index}`;
        const panelId = `career-timeline-panel-${index}`;

        return (
          <li key={`${item.year}-${item.label}`} className={`${styles.item} ${isOpen ? styles.itemOpen : ""}`}>
            <article className={styles.entry}>
              <button
                id={triggerId}
                type="button"
                className={styles.trigger}
                aria-expanded={isOpen}
                aria-controls={panelId}
                aria-label={`${isOpen ? "Collapse" : "Expand"} career details for ${item.detail.role} at ${item.detail.companyLine}`}
                onClick={() => setOpenItemIndex(isOpen ? null : index)}
              >
                <span className={styles.year}>{item.year}</span>
                <span className={styles.identity}>
                  <Image src={item.logo.src} alt="" width={120} height={64} className={styles.logo} />
                  <span>
                    <span className={styles.company}>{item.detail.companyLine}</span>
                    <span className={styles.role}>{item.detail.role}</span>
                  </span>
                </span>
                <span className={styles.affordance} aria-hidden="true">
                  <span className={styles.affordanceLabel}>{isOpen ? "Hide impact" : "View impact"}</span>
                  <span className={styles.disclosureIcon}>{isOpen ? "−" : "+"}</span>
                </span>
              </button>

              <div
                id={panelId}
                className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}
                role="region"
                aria-labelledby={triggerId}
                aria-hidden={!isOpen}
              >
                <div className={styles.panelInner}>
                  <p className={styles.meta}>{item.detail.dateLocation}</p>
                  <dl className={styles.impactGrid}>
                    {item.detail.points.map((point) => (
                      <div key={point.label} className={styles.impactPoint}>
                        <dt>{point.label}</dt>
                        <dd>{point.text}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
