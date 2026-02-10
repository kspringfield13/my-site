import type { MetadataRoute } from "next";
import { getProjectIndex } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kylespringfield.dev";
  const projects = await getProjectIndex();
  const staticRoutes = ["", "/projects", "/resume", "/archive/now"];

  return [
    ...staticRoutes.map((route) => ({
      url: `${base}${route}`,
      lastModified: new Date(),
      changeFrequency: (route === "" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: route === "" ? 1 : 0.7
    })),
    ...projects.projects.map((project) => ({
      url: `${base}/projects/${project.slug}`,
      lastModified: new Date(project.updatedAt ?? projects.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8
    }))
  ];
}
