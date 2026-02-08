import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProjectBySlug, getProjectIndex } from "@/lib/content";
import Link from "next/link";

interface Params {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const projects = await getProjectIndex();
  return projects.projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const project = await getProjectBySlug(params.slug);
  if (!project) {
    return {
      title: "Project not found"
    };
  }
  return {
    title: project.frontmatter.title ?? project.meta.name,
    description: project.meta.description,
    openGraph: {
      title: project.frontmatter.title ?? project.meta.name,
      description: project.meta.description,
      url: `/projects/${params.slug}`
    }
  };
}

export default async function ProjectDetailPage({ params }: Params) {
  const project = await getProjectBySlug(params.slug);
  if (!project) {
    notFound();
  }

  return (
    <article className="section-wrap py-16">
      <p className="eyebrow">Case Study</p>
      <h1 className="display mt-4">{project.frontmatter.title ?? project.meta.name}</h1>
      <p className="lede mt-4 max-w-2xl">{project.meta.tagline || project.meta.description}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {project.meta.tags.map((tag) => (
          <span key={tag} className="tag-chip">
            {tag}
          </span>
        ))}
      </div>
      <div className="prose-shell mt-10">{project.content}</div>
      <section className="mt-12">
        <h2 className="subhead">Artifacts</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={project.meta.repoUrl} className="btn-secondary" target="_blank" rel="noreferrer">
            GitHub repo
          </Link>
          {project.meta.demoUrl ? (
            <Link href={project.meta.demoUrl} className="btn-secondary" target="_blank" rel="noreferrer">
              Demo
            </Link>
          ) : null}
          {project.meta.artifacts.docs.map((doc) => (
            <Link key={doc} href={doc} className="btn-secondary" target="_blank" rel="noreferrer">
              Document
            </Link>
          ))}
          {project.meta.artifacts.diagrams.map((diagram) => (
            <Link key={diagram} href={diagram} className="btn-secondary" target="_blank" rel="noreferrer">
              Diagram
            </Link>
          ))}
          {project.meta.artifacts.screenshots.map((screenshot) => (
            <Link key={screenshot} href={screenshot} className="btn-secondary" target="_blank" rel="noreferrer">
              Screenshot
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
