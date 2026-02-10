import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";

interface SiteConfig {
  name: string;
  footerVideoUrl?: string;
  contact: {
    email: string;
    github: string;
    linkedin: string;
  };
}

const fallback: SiteConfig = {
  name: "Kyle Springfield",
  contact: {
    email: "kspringfield13@gmail.com",
    github: "https://github.com/kspringfield13",
    linkedin: "https://www.linkedin.com/in/kylespringfield"
  }
};

export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  const filePath = path.join(process.cwd(), "content", "config", "site.json");
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as SiteConfig;
  } catch {
    return fallback;
  }
});
