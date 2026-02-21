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
  homepageRank?: number;
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

export type NowCategory = "models" | "tools" | "ideas" | "ventures";

export interface NowEntry {
  id: string;
  date: string;
  category: NowCategory;
  details: string[];
  links?: string[];
}

export interface NowFeed {
  expireDays: number;
  entries: NowEntry[];
}

export interface ProofMetrics {
  timelineHighlights: Array<{ year: number; label: string }>;
}

export interface ResumeRole {
  title: string;
  company: string;
  location?: string;
  start: string;
  end: string;
  highlights: string[];
}

export interface ResumeContact {
  email?: string;
  linkedin?: string;
}

export interface ResumeEducation {
  degree: string;
  concentration?: string;
  school: string;
}

export interface ResumeCertification {
  name: string;
  issuer: string;
}

export interface ResumeDerived {
  name?: string;
  contact?: ResumeContact;
  about: string;
  highlights: string[];
  education: ResumeEducation[];
  experience: ResumeRole[];
  skills: string[];
  certifications: string[];
  certificationDetails: ResumeCertification[];
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
  type: "Project" | "Section" | "Now";
  title: string;
  url: string;
  tags: string[];
  body: string;
}
