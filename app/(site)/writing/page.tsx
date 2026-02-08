import Link from "next/link";
import { getWritingIndex } from "@/lib/content";

export const metadata = {
  title: "Writing",
  description: "Short notes on analytics, experimentation, and AI systems design."
};

export default async function WritingPage() {
  const posts = await getWritingIndex();

  return (
    <section className="section-wrap py-16">
      <h1 className="display">Writing</h1>
      <p className="lede mt-4 max-w-2xl">Notes on measurement, data infrastructure, and practical AI implementation.</p>
      <div className="mt-10 space-y-6">
        {posts.map((post) => (
          <article key={post.slug} className="card-base">
            <p className="eyebrow">{new Date(post.date).toLocaleDateString()}</p>
            <h2 className="mt-2 text-2xl font-display font-semibold">
              <Link href={`/writing/${post.slug}`}>{post.title}</Link>
            </h2>
            <p className="mt-2 text-muted">{post.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
