#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";

interface ResumeRole {
  title: string;
  company: string;
  location?: string;
  start: string;
  end: string;
  highlights: string[];
}

interface ResumeContact {
  email?: string;
  linkedin?: string;
}

interface ResumeEducation {
  degree: string;
  concentration?: string;
  school: string;
}

interface ResumeCertification {
  name: string;
  issuer: string;
}

function chunkSection(source: string, header: string) {
  const escaped = header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`##\\s+${escaped}\\s*([\\s\\S]*?)(?=\\n##\\s+|$)`, "i");
  const match = source.match(regex);
  return match?.[1]?.trim() ?? "";
}

function parseBullets(section: string) {
  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.replace(/^-\s+/, "").trim());
}

function parseName(source: string) {
  return source.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "";
}

function stripMarkdownLinks(value: string) {
  return value.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
}

function toMonthYear(value: string) {
  if (!value || value === "Present") return value;
  const [year, month = "01"] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function formatRoleIdentity(role: ResumeRole) {
  if (!role.company) return role.title;
  return /\bat\b/i.test(role.company) ? `${role.title}, ${role.company}` : `${role.title} at ${role.company}`;
}

function parseContact(section: string): ResumeContact {
  const contact: ResumeContact = {};
  const bullets = parseBullets(section);
  for (const bullet of bullets) {
    const [rawLabel, ...rawValue] = bullet.split(":");
    const label = rawLabel?.trim().toLowerCase();
    const value = stripMarkdownLinks(rawValue.join(":").trim());
    if (!label || !value) continue;
    if (label === "email") contact.email = value;
    if (label === "linkedin") contact.linkedin = value;
  }
  return contact;
}

function uniqueList(items: string[]) {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const item of items) {
    const normalized = item.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }
  return output;
}

function parseSkills(section: string) {
  return uniqueList(
    section
      .replace(/\n/g, " | ")
      .split(/[|,]/)
      .map((item) => item.trim())
      .filter(Boolean)
  );
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

  const slashDate = normalized.match(/^(\d{1,2})\s*\/\s*((19|20)\d{2})$/);
  if (slashDate) {
    const month = slashDate[1].padStart(2, "0");
    const year = slashDate[2];
    return `${year}-${month}`;
  }

  const yearMatch = normalized.match(/(19|20)\d{2}/);
  const year = yearMatch?.[0] ?? "2010";
  const month = Object.entries(monthMap).find(([key]) => normalized.startsWith(key))?.[1] ?? "01";
  return `${year}-${month}`;
}

function parseDateRange(value: string) {
  const cleaned = value.replace(/^-\s*/, "").trim();
  if (!cleaned) return { start: "2010-01", end: "Present" };

  const [rawStart, rawEnd] = cleaned.split(/\s*[-\u2013]\s*/);
  const start = rawStart ? toIsoMonth(rawStart) : "2010-01";
  const end = rawEnd && /present|current/i.test(rawEnd) ? "Present" : rawEnd ? toIsoMonth(rawEnd) : "Present";
  return { start, end };
}

function parseEducation(section: string): ResumeEducation[] {
  const blocks = section
    .split(/\n###\s+/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const degree = lines[0].replace(/^###\s+/, "");
    const bullets = lines.slice(1).filter((line) => line.startsWith("- ")).map((line) => line.replace(/^-\s+/, ""));
    const concentration = bullets.find((line) => /^Concentration:/i.test(line))?.replace(/^Concentration:\s*/i, "").trim();
    const school =
      bullets.find((line) => /^School:/i.test(line))?.replace(/^School:\s*/i, "").trim() ??
      bullets.find((line) => !/^Concentration:/i.test(line))?.trim() ??
      "";

    return {
      degree,
      concentration,
      school
    };
  });
}

function parseExperience(section: string): ResumeRole[] {
  const roleBlocks = section
    .split(/\n###\s+/)
    .map((block) => block.trim())
    .filter(Boolean);

  return roleBlocks.map((block) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const heading = lines[0].replace(/^###\s+/, "").trim();
    const headingMatch = heading.match(/^(.+?)\s+-\s+(.+)$/);
    const title = headingMatch?.[1]?.trim() ?? heading;
    const company = headingMatch?.[2]?.trim() ?? "";
    const bullets = lines.slice(1).filter((line) => line.startsWith("- "));

    const dateLine = bullets.find((line) => /^-\s*Dates\s*:/i.test(line));
    const fallbackDateLine = bullets.find((line) => /^-\s+.*((19|20)\d{2}|present)/i.test(line));
    const parsedDates = parseDateRange(
      dateLine
        ? dateLine.replace(/^-\s*Dates\s*:\s*/i, "").trim()
        : fallbackDateLine
          ? fallbackDateLine.replace(/^-\s+/, "").trim()
          : ""
    );

    const location =
      bullets
        .find((line) => /^-\s*Location\s*:/i.test(line))
        ?.replace(/^-\s*Location\s*:\s*/i, "")
        .trim() ?? "";

    const highlights = bullets
      .filter((line) => !/^-\s*(Dates|Location)\s*:/i.test(line))
      .map((line) => line.replace(/^-\s+/, "").trim());

    return {
      title,
      company,
      location: location || undefined,
      start: parsedDates.start,
      end: parsedDates.end,
      highlights
    };
  });
}

function parseCertifications(section: string): ResumeCertification[] {
  return parseBullets(section).map((line) => {
    const marker = " - ";
    const splitAt = line.lastIndexOf(marker);
    if (splitAt === -1) {
      return { name: line, issuer: "" };
    }
    return {
      name: line.slice(0, splitAt).trim(),
      issuer: line.slice(splitAt + marker.length).trim()
    };
  });
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
    analytics: [
      ...new Set([
        ...has(/measurement|tableau|power bi|data visualization|a\/b testing|stat|experiment/i),
        "Experiment design"
      ])
    ],
    ai: [...new Set([...has(/gen ai|genai|ai|llm|langchain|openai/i), "AI workflow design"])],
    dev: [...new Set([...has(/git|ci\/cd|docker|bash|devops|agile/i), "Testing", "Deployment discipline"])]
  };
}

async function main() {
  const base = process.cwd();
  const resumePath = path.join(base, "content", "resume", "resume.md");
  const outputPath = path.join(base, "content", "resume", "derived.json");

  const source = await fs.readFile(resumePath, "utf8");
  const name = parseName(source);
  const contact = parseContact(chunkSection(source, "Contact"));
  const highlights = parseBullets(chunkSection(source, "Highlights"));
  const education = parseEducation(chunkSection(source, "Education"));
  const experience = parseExperience(chunkSection(source, "Experience"));
  const skills = parseSkills(chunkSection(source, "Core Skills & Technologies"));
  const certificationDetails = parseCertifications(chunkSection(source, "Certifications"));

  const certifications = certificationDetails.map((cert) =>
    cert.issuer ? `${cert.name} - ${cert.issuer}` : cert.name
  );

  const latestRole = experience[0];
  const priorRole = experience[1];

  const about =
    "Data and AI engineer building reliable analytics systems across SQL, Python, dbt, Snowflake, and AWS with a focus on experimentation and decision-ready execution.";

  const proofBullets = [
    latestRole
      ? `${formatRoleIdentity(latestRole)} (${toMonthYear(latestRole.start)} - ${toMonthYear(latestRole.end)}) delivering analytics and measurement support.`
      : "",
    priorRole
      ? `${formatRoleIdentity(priorRole)} (${toMonthYear(priorRole.start)} - ${toMonthYear(priorRole.end)}) building production data pipelines.`
      : "",
    `Hands-on delivery across ${skills.slice(0, 6).join(", ")}.`
  ].filter(Boolean);

  const payload = {
    name,
    contact,
    about,
    highlights,
    education,
    experience,
    skills,
    certifications,
    certificationDetails,
    proofBullets,
    skillClusters: deriveClusters(skills)
  };

  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
