"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useState, type PointerEvent } from "react";
import type { ProjectMeta } from "@/lib/types";
import styles from "@/components/ProjectCard.module.css";

interface ProjectCardProps {
  project: ProjectMeta;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [bannerFailed, setBannerFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const pointerFrame = useRef<number | null>(null);
  const showBanner = Boolean(project.bannerImage) && !bannerFailed;
  const isSamsStudio = project.slug === "sams-studio";
  const outcome = project.readmeHighlights?.[0] || project.description;
  const bannerPosition =
    project.bannerPosition === "top" ? "center top" : project.bannerPosition === "bottom" ? "center bottom" : "center";

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") {
      return;
    }

    const card = event.currentTarget;
    const clientX = event.clientX;
    const clientY = event.clientY;

    if (pointerFrame.current !== null) {
      window.cancelAnimationFrame(pointerFrame.current);
    }

    pointerFrame.current = window.requestAnimationFrame(() => {
      pointerFrame.current = null;
      const bounds = card.getBoundingClientRect();
      card.style.setProperty("--project-pointer-x", `${clientX - bounds.left}px`);
      card.style.setProperty("--project-pointer-y", `${clientY - bounds.top}px`);
    });
  }

  function handlePointerLeave(event: PointerEvent<HTMLElement>) {
    if (pointerFrame.current !== null) {
      window.cancelAnimationFrame(pointerFrame.current);
      pointerFrame.current = null;
    }
    event.currentTarget.style.removeProperty("--project-pointer-x");
    event.currentTarget.style.removeProperty("--project-pointer-y");
  }

  return (
    <article
      className={styles.card}
      data-expanded={expanded ? "true" : "false"}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className={styles.sheen} aria-hidden="true" />

      {showBanner ? (
        <div className={styles.banner}>
          <Image
            src={project.bannerImage!}
            alt={project.bannerAlt || `${project.name} banner`}
            fill
            sizes="(min-width: 1100px) 520px, (min-width: 768px) 46vw, calc(100vw - 2rem)"
            className={styles.bannerImage}
            style={{ objectPosition: bannerPosition }}
            onError={() => setBannerFailed(true)}
          />
          <div className={styles.bannerScrim} aria-hidden="true" />
          <div className={styles.bannerMeta} aria-hidden="true">
            <span>{project.language || "Project"}</span>
            <span className={styles.status}>
              <span className={styles.statusDot} />
              Built system
            </span>
          </div>
        </div>
      ) : null}

      <div className={styles.body}>
        <div className={styles.preview}>
          <div className={styles.kicker}>
            <span>Case study</span>
            <span className={styles.kickerRule} aria-hidden="true" />
            {project.pinned ? <span className={styles.flagship}>Flagship</span> : null}
          </div>

          <div className={styles.headingRow}>
            <h3 className={styles.title}>
              <Link href={`/projects/${project.slug}`}>{project.name}</Link>
            </h3>

            <button
              type="button"
              className={styles.expandButton}
              aria-expanded={expanded}
              aria-controls={detailsId}
              onClick={() => setExpanded((current) => !current)}
            >
              <span>{expanded ? "Close" : "Details"}</span>
              <span className={styles.expandIcon} aria-hidden="true">
                <span />
                <span />
              </span>
            </button>
          </div>

          <p className={styles.tagline}>{project.tagline || project.description}</p>

          <div className={styles.previewFooter}>
            <div className={styles.tags} aria-label="Project categories">
              {project.tags.map((tag) => (
                <span key={tag} className="tag-chip">
                  {tag}
                </span>
              ))}
            </div>

            <span className={styles.previewCue} aria-hidden="true">
              <span>Outcome + build</span>
              <span className={styles.previewCueArrow}>↘</span>
            </span>
          </div>
        </div>

        <div id={detailsId} className={styles.details}>
          <div className={styles.detailsClip}>
            <div className={styles.detailsInner}>
              <div className={styles.outcome}>
                <div className={styles.outcomeLabel}>
                  <span className={styles.outcomeMarker} aria-hidden="true" />
                  <span>Outcome</span>
                </div>
                <p className={styles.outcomeText}>{outcome}</p>
              </div>

              <div className={styles.build}>
                <span className={styles.buildLabel}>Built with</span>
                <div className={styles.stack} aria-label="Technology stack">
                  {project.stack.slice(0, 5).map((technology) => (
                    <span key={technology}>{technology}</span>
                  ))}
                  {project.stack.length > 5 ? (
                    <span aria-label={`${project.stack.length - 5} more technologies`}>
                      +{project.stack.length - 5}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className={styles.actions}>
                <Link
                  href={`/projects/${project.slug}`}
                  className={styles.primaryAction}
                  aria-label={`Explore the ${project.name} case study`}
                >
                  <span>Explore case study</span>
                  <span className={styles.actionArrow} aria-hidden="true">
                    →
                  </span>
                </Link>

                <Link
                  href={project.repoUrl}
                  className={`${styles.repoAction} ${isSamsStudio ? styles.samsStudioAction : ""}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${isSamsStudio ? "Open samsstudio.xyz" : `Open the ${project.name} repository`} in a new tab`}
                >
                  {isSamsStudio ? (
                    <>
                      <span className="btn-samsstudio-logo-wrap">
                        <Image src="/logo.png" alt="" width={26} height={26} className="h-5 w-5 object-contain" />
                      </span>
                      <span>samsstudio.xyz</span>
                    </>
                  ) : (
                    <>
                      <span>Repository</span>
                      <span aria-hidden="true">↗</span>
                    </>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
