import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getWritingBySlug, getWritingIndex } from "@/lib/content";

interface Params {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const posts = await getWritingIndex();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const post = await getWritingBySlug(params.slug);
  if (!post) {
    return { title: "Writing not found" };
  }
  return {
    title: post.frontmatter.title,
    description: post.frontmatter.summary
  };
}

export default async function WritingDetailPage({ params }: Params) {
  const post = await getWritingBySlug(params.slug);
  if (!post) {
    notFound();
  }

  return (
    <article className="section-wrap py-16">
      <p className="eyebrow">Writing</p>
      <h1 className="display mt-4">{post.frontmatter.title}</h1>
      <p className="mt-4 text-muted">{new Date(post.frontmatter.date).toLocaleDateString()}</p>
      <div className="prose-shell mt-10">{post.content}</div>
    </article>
  );
}
