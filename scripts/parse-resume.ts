#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";

interface ResumeRole {
  title: string;
  company: string;
  start: string;
  end: string;
  highlights: string[];
}

function toIsoMonth(value: string): string {
  const normalized = value.toLowerCase().trim();
  const monthMap: Record<string, string> = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12"
  };

  const mm = Object.entries(monthMap).find(([key]) => normalized.startsWith(key))?.[1] ?? "01";
  const yearMatch = normalized.match(/(19|20)\d{2}/);
  return `${yearMatch?.[0] ?? "2010"}-${mm}`;
}

function parseDateRange(line: string) {
  const cleaned = line.replace(/^-\s*/, "").trim();
  const [rawStart, rawEnd] = cleaned.split(/\s*[-–]\s*/);
  const start = rawStart ? toIsoMonth(rawStart) : "2010-01";
  const end = rawEnd && /present/i.test(rawEnd) ? "Present" : rawEnd ? toIsoMonth(rawEnd) : "Present";
  return { start, end };
}

function parseSkills(line: string) {
  return line
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function chunkSection(source: string, header: string) {
  const escaped = header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`##\\s+${escaped}([\\s\\S]*?)(?:\\n##\\s+|$)`, "i");
  const match = source.match(regex);
  return match?.[1]?.trim() ?? "";
}

function deriveClusters(skills: string[]) {
  const has = (needle: RegExp) => skills.filter((skill) => needle.test(skill));

  return {
    data: [
      ...new Set([
        ...has(/sql|python|dbt|etl|elt|snowflake|aws|databricks|duckdb/i),
        "Data modeling",
        "Pipeline reliability"
      ])
    ],
    analytics: [...new Set([...has(/measurement|tableau|power bi|stat|experiment/i), "Experiment design"])],
    ai: [...new Set([...has(/genai|ai|llm|langchain|openai/i), "AI workflow design"])],
    dev: [...new Set([...has(/git|ci\/cd|docker|devops/i), "Testing", "Deployment discipline"])]
  };
}

async function main() {
  const base = process.cwd();
  const resumePath = path.join(base, "content", "resume", "resume.md");
  const outputPath = path.join(base, "content", "resume", "derived.json");

  const source = await fs.readFile(resumePath, "utf8");
  const highlights = chunkSection(source, "Highlights")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.replace(/^-\s+/, ""));

  const experienceSection = chunkSection(source, "Experience");
  const roleBlocks = experienceSection
    .split(/\n###\s+/)
    .map((block) => block.trim())
    .filter(Boolean);

  const experience: ResumeRole[] = roleBlocks.map((block) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const heading = lines[0].replace(/^###\s+/, "");
    const [title, company] = heading.split(/\s+[-—]\s+/);
    const dateLine = lines.find((line) => /^-\s+.*(\d{4}|present)/i.test(line)) ?? "- Jan 2010 - Present";
    const parsedDates = parseDateRange(dateLine);
    const roleHighlights = lines
      .filter((line) => line.startsWith("-") && line !== dateLine)
      .map((line) => line.replace(/^-\s+/, ""));

    return {
      title: title?.trim() ?? heading,
      company: company?.trim() ?? "",
      start: parsedDates.start,
      end: parsedDates.end,
      highlights: roleHighlights.slice(0, 3)
    };
  });

  const skillsSection = chunkSection(source, "Skills").replace(/\n/g, " ").trim();
  const skills = parseSkills(skillsSection);

  const certs = chunkSection(source, "Certifications")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.replace(/^-\s+/, ""));

  const about =
    "Analytics and AI engineer building reliable data systems with SQL, Python, dbt, Snowflake, and AWS to convert noisy inputs into clear strategy.";

  const payload = {
    about,
    proofBullets: [
      "Business Analyst III at Cisco via TEKsystems (Sep 2025-present), focused on analytics and experimentation.",
      "Built CMS FWA engineering workflows at Peraton (Sep 2024-Sep 2025).",
      "Production delivery across SQL/Python/dbt/Snowflake/AWS with GenAI accelerators."
    ],
    experience,
    skills,
    certifications: certs,
    skillClusters: deriveClusters(skills)
  };

  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
