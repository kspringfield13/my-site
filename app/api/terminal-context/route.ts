import { NextResponse } from "next/server";
import { getNowEntries, getProjectIndex, getResumeDerived, getSearchDocs } from "@/lib/content";
import { getSiteConfig } from "@/lib/site-config";

export async function GET() {
  const [projects, nowEntries, resume, searchDocs, site] = await Promise.all([
    getProjectIndex(),
    getNowEntries(),
    getResumeDerived(),
    getSearchDocs(),
    getSiteConfig()
  ]);

  return NextResponse.json({
    projects: projects.projects,
    nowEntries: nowEntries.entries,
    resume,
    searchDocs,
    contact: site.contact
  });
}
