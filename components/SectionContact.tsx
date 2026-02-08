import Link from "next/link";
import { getSiteConfig } from "@/lib/site-config";

export async function SectionContact() {
  const site = await getSiteConfig();
  return (
    <section id="contact" className="section-wrap py-14">
      <p className="eyebrow">Contact</p>
      <h2 className="subhead mt-2">Let&apos;s talk data platforms, measurement, and AI product acceleration.</h2>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`mailto:${site.contact.email}`} className="btn-primary">
          {site.contact.email}
        </Link>
        <Link href={site.contact.github} target="_blank" rel="noreferrer" className="btn-secondary">
          GitHub
        </Link>
        <Link href={site.contact.linkedin} target="_blank" rel="noreferrer" className="btn-secondary">
          LinkedIn
        </Link>
      </div>
    </section>
  );
}
