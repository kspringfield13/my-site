export type ProjectTag = "ai" | "data" | "fullstack";

export interface ProjectArtifacts {
  screenshots: string[];
  diagrams: string[];
  docs: string[];
}

export interface ProjectMeta {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  tags: ProjectTag[];
  stack: string[];
  repoUrl: string;
  demoUrl?: string;
  pinned: boolean;
  stars: number;
  forks: number;
  language: string;
  topics: string[];
  readmeHighlights: string[];
  artifacts: ProjectArtifacts;
  bannerImage?: string;
  bannerAlt?: string;
  bannerPosition?: "center" | "top" | "bottom";
  updatedAt?: string;
}

export interface ProjectIndex {
  updatedAt: string;
  projects: ProjectMeta[];
}

export type NowCategory = "models" | "tools" | "ideas";

export interface NowEntry {
  id: string;
  date: string;
  category: NowCategory;
  title: string;
  tried: string;
  outcome: string;
  nextStep: string;
  links?: string[];
}

export interface NowFeed {
  expireDays: number;
  entries: NowEntry[];
}

export interface WeeklySummary {
  weekOf: string;
  summary: string;
  bullets: string[];
}

export interface ProofMetrics {
  systemsShipped: {
    pipelines: number;
    dashboards: number;
    apps: number;
  };
  timelineHighlights: Array<{ year: number; label: string }>;
}

export interface ResumeRole {
  title: string;
  company: string;
  start: string;
  end: string;
  highlights: string[];
}

export interface ResumeDerived {
  about: string;
  experience: ResumeRole[];
  skills: string[];
  certifications: string[];
  proofBullets: string[];
  skillClusters: {
    data: string[];
    analytics: string[];
    ai: string[];
    dev: string[];
  };
}

export interface SearchDoc {
  id: string;
  type: "Project" | "Writing" | "Section" | "Now";
  title: string;
  url: string;
  tags: string[];
  body: string;
}

export interface WritingFrontmatter {
  title: string;
  slug: string;
  date: string;
  summary: string;
  tags?: string[];
}

export interface WritingIndexItem {
  title: string;
  slug: string;
  date: string;
  summary: string;
}
