import { rankSearchResults } from "@/lib/search";
import type {
  ParsedCommand,
  TerminalCommandDescriptor,
  TerminalExecutionContext,
  TerminalResult,
  TerminalResultCard
} from "@/lib/terminal/types";

const commandNames = [
  "help",
  "projects",
  "project",
  "skills",
  "ai",
  "now",
  "contact",
  "search",
  "open",
  "clear"
] as const;

type CommandName = (typeof commandNames)[number];

function toCard(id: string, title: string, description: string, kind: TerminalResultCard["kind"] = "info"): TerminalResultCard {
  return { id, title, description, kind };
}

function levenshtein(a: string, b: string) {
  const matrix = Array.from({ length: b.length + 1 }, () => Array.from({ length: a.length + 1 }, () => 0));
  for (let i = 0; i <= b.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }

  return matrix[b.length][a.length];
}

function closestCommands(input: string) {
  return [...commandNames]
    .map((name) => ({ name, distance: levenshtein(input, name) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map((item) => item.name);
}

function buildHelpResult(): TerminalResult {
  return {
    cards: [
      toCard("help", "Commands", "projects, project <slug>, skills, ai, now, contact, search, open, clear", "list"),
      toCard("help:filters", "Filter examples", "projects --tag ai --pinned · skills --cluster data · search \"dbt pipeline\"")
    ]
  };
}

function projectsCommand(ctx: TerminalExecutionContext, parsed: ParsedCommand): TerminalResult {
  const tagRaw = typeof parsed.flags.tag === "string" ? parsed.flags.tag.toLowerCase() : undefined;
  const pinnedOnly = parsed.flags.pinned === true;

  const allowedTags = new Set(["ai", "data", "fullstack"]);
  if (tagRaw && !allowedTags.has(tagRaw)) {
    return {
      cards: [toCard("projects:error", "Invalid tag", "Use --tag ai|data|fullstack.", "error")]
    };
  }

  const filtered = ctx.projects
    .filter((project) => (tagRaw ? project.tags.includes(tagRaw as "ai" | "data" | "fullstack") : true))
    .filter((project) => (pinnedOnly ? project.pinned : true));

  if (filtered.length === 0) {
    return {
      cards: [toCard("projects:none", "No projects match", "Try removing filters or use projects --pinned.", "error")]
    };
  }

  return {
    navigateSection: "projects",
    cards: filtered.slice(0, 8).map((project, index) => ({
      id: `projects:${project.slug}:${index}`,
      kind: "result",
      title: project.name,
      description: project.tagline || project.description,
      meta: project.tags.join(" · "),
      actions: [
        { label: "Open case study", href: `/projects/${project.slug}` },
        { label: "Repository", href: project.repoUrl }
      ]
    }))
  };
}

function projectCommand(ctx: TerminalExecutionContext, parsed: ParsedCommand): TerminalResult {
  const slug = parsed.args[0]?.toLowerCase();
  if (!slug) {
    return {
      cards: [toCard("project:usage", "Missing slug", "Usage: project <slug>", "error")]
    };
  }

  const project = ctx.projects.find((item) => item.slug === slug);
  if (!project) {
    const suggestions = ctx.projects
      .map((item) => ({ slug: item.slug, distance: levenshtein(slug, item.slug) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 4)
      .map((item) => item.slug)
      .join(", ");

    return {
      cards: [toCard("project:not-found", "Project not found", `Try one of: ${suggestions}`, "error")]
    };
  }

  return {
    navigateTo: `/projects/${project.slug}`,
    cards: [
      {
        id: `project:${project.slug}`,
        kind: "success",
        title: project.name,
        description: project.description,
        actions: [
          { label: "Open case study", href: `/projects/${project.slug}` },
          { label: "Repository", href: project.repoUrl }
        ]
      }
    ]
  };
}

function skillsCommand(ctx: TerminalExecutionContext, parsed: ParsedCommand): TerminalResult {
  const cluster = typeof parsed.flags.cluster === "string" ? parsed.flags.cluster.toLowerCase() : undefined;
  const map = ctx.resume.skillClusters;

  const clusters: Record<string, string[]> = {
    data: map.data,
    analytics: map.analytics,
    ai: map.ai,
    dev: map.dev
  };

  if (cluster && !clusters[cluster]) {
    return {
      cards: [toCard("skills:error", "Unknown cluster", "Use --cluster data|ai|analytics|dev", "error")]
    };
  }

  const entries: Array<[string, string[]]> = cluster ? [[cluster, clusters[cluster]]] : Object.entries(clusters);
  return {
    navigateSection: "skills",
    cards: entries.map(([name, items]) => ({
      id: `skills:${name}`,
      kind: "list",
      title: `${name.toUpperCase()} cluster`,
      description: items.length ? items.join(", ") : "No items yet. Run npm run ingest after updating resume content."
    }))
  };
}

function aiCommand(ctx: TerminalExecutionContext): TerminalResult {
  const aiProjects = ctx.projects.filter((project) => project.tags.includes("ai")).slice(0, 4);
  return {
    navigateSection: "projects",
    cards: [
      toCard(
        "ai:summary",
        "AI focus",
        "I build AI-enabled analytics workflows, multi-agent orchestration, and data-aware assistants with production ETL foundations."
      ),
      ...aiProjects.map((project) => ({
        id: `ai:${project.slug}`,
        kind: "result" as const,
        title: project.name,
        description: project.tagline || project.description,
        actions: [{ label: "Open", href: `/projects/${project.slug}` }]
      }))
    ]
  };
}

function nowCommand(ctx: TerminalExecutionContext): TerminalResult {
  const entries = [...ctx.nowEntries].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 5);
  if (entries.length === 0) {
    return {
      cards: [toCard("now:empty", "No now entries", "Add entries in content/now/entries.json.", "error")]
    };
  }

  return {
    navigateSection: "now",
    cards: entries.map((entry) => ({
      id: `now:${entry.id}`,
      kind: "result",
      title: `${entry.title} (${entry.category})`,
      description: entry.outcome,
      meta: new Date(entry.date).toLocaleDateString(),
      actions: [{ label: "Open section", sectionId: "now" }, { label: "View archive", href: "/archive/now" }]
    }))
  };
}

function contactCommand(ctx: TerminalExecutionContext): TerminalResult {
  return {
    navigateSection: "contact",
    cards: [
      {
        id: "contact",
        kind: "success",
        title: "Contact",
        description: "Reach out for analytics engineering and AI systems work.",
        actions: [
          { label: ctx.contact.email, href: `mailto:${ctx.contact.email}` },
          { label: "GitHub", href: ctx.contact.github },
          { label: "LinkedIn", href: ctx.contact.linkedin },
          { label: "Contact section", sectionId: "contact" }
        ]
      }
    ]
  };
}

function searchCommand(ctx: TerminalExecutionContext, parsed: ParsedCommand): TerminalResult {
  const query = parsed.args.join(" ").trim();
  if (!query) {
    return {
      cards: [toCard("search:usage", "Missing query", 'Use: search "your query"', "error")]
    };
  }

  const results = rankSearchResults(ctx.searchDocs, query).slice(0, 8);
  if (results.length === 0) {
    const fallback = [...ctx.searchDocs]
      .map((doc) => ({ doc, distance: levenshtein(query.toLowerCase(), doc.title.toLowerCase()) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map((item) => item.doc);
    return {
      cards: [
        {
          id: "search:none",
          kind: "error",
          title: "No results",
          description: "Try broader terms.",
          actions: fallback.map((doc, idx) => ({
            label: `${idx + 1}. ${doc.title}`,
            href: doc.url,
            resultId: `r${idx + 1}`
          }))
        }
      ]
    };
  }

  return {
    cards: results.map((doc, index) => ({
      id: `search:r${index + 1}`,
      kind: "result",
      title: `${doc.title} (${doc.type})`,
      description: doc.body.slice(0, 130),
      actions: [
        { label: "Open", href: doc.url, resultId: `r${index + 1}` },
        { label: `Use open r${index + 1}`, command: `open r${index + 1}` }
      ]
    })),
    searchResults: results
  };
}

function openCommand(ctx: TerminalExecutionContext, parsed: ParsedCommand): TerminalResult {
  const id = parsed.args[0]?.toLowerCase();
  if (!id) {
    return {
      cards: [toCard("open:usage", "Missing result id", "Usage: open <result-id>", "error")]
    };
  }

  const numeric = Number(id.replace(/^r/, ""));
  if (Number.isNaN(numeric) || numeric < 1) {
    return {
      cards: [toCard("open:invalid", "Invalid result id", "Use result IDs like r1, r2, r3.", "error")]
    };
  }

  const target = ctx.lastSearchResults[numeric - 1];
  if (!target) {
    return {
      cards: [toCard("open:missing", "Result not available", "Run search first, then open r1.", "error")]
    };
  }

  return {
    navigateTo: target.url,
    cards: [
      {
        id: `open:${id}`,
        kind: "success",
        title: `Opening ${target.title}`,
        description: target.url,
        actions: [{ label: "Go", href: target.url }]
      }
    ]
  };
}

function clearCommand(): TerminalResult {
  return {
    cards: [],
    clear: true
  };
}

export const terminalCommandRegistry: Record<CommandName, TerminalCommandDescriptor> = {
  help: {
    name: "help",
    description: "List available commands.",
    usage: "help",
    examples: ["help"],
    handler: () => buildHelpResult()
  },
  projects: {
    name: "projects",
    description: "List projects with optional filters.",
    usage: "projects [--tag ai|data|fullstack] [--pinned]",
    examples: ["projects", "projects --tag ai --pinned"],
    handler: projectsCommand
  },
  project: {
    name: "project",
    description: "Open a project by slug.",
    usage: "project <slug>",
    examples: ["project xenosync"],
    handler: projectCommand
  },
  skills: {
    name: "skills",
    description: "List skills by optional cluster.",
    usage: "skills [--cluster data|ai|analytics|dev]",
    examples: ["skills", "skills --cluster ai"],
    handler: skillsCommand
  },
  ai: {
    name: "ai",
    description: "Summarize AI-focused work.",
    usage: "ai",
    examples: ["ai"],
    handler: aiCommand
  },
  now: {
    name: "now",
    description: "Show recent experiments.",
    usage: "now",
    examples: ["now"],
    handler: nowCommand
  },
  contact: {
    name: "contact",
    description: "Get contact links.",
    usage: "contact",
    examples: ["contact"],
    handler: contactCommand
  },
  search: {
    name: "search",
    description: "Search site content.",
    usage: 'search "query"',
    examples: ['search "dbt"', 'search "agent orchestration"'],
    handler: searchCommand
  },
  open: {
    name: "open",
    description: "Open a result by id.",
    usage: "open <result-id>",
    examples: ["open r1"],
    handler: openCommand
  },
  clear: {
    name: "clear",
    description: "Clear terminal output.",
    usage: "clear",
    examples: ["clear"],
    handler: clearCommand
  }
};

export function runUnknownCommand(name: string): TerminalResult {
  const suggestions = closestCommands(name);
  return {
    cards: [
      {
        id: "unknown",
        kind: "error",
        title: `Unknown command: ${name}`,
        description: `Try: ${suggestions.join(", ")}`,
        actions: [{ label: "Open help", command: "help" }]
      }
    ]
  };
}

export function getAutocompleteSuggestions(input: string, projectSlugs: string[]) {
  const trimmed = input.trimStart();
  const [name, ...rest] = trimmed.split(/\s+/);

  if (!name) {
    return [...commandNames];
  }

  if (rest.length === 0 && !trimmed.endsWith(" ")) {
    return commandNames.filter((command) => command.startsWith(name.toLowerCase()));
  }

  const cmd = name.toLowerCase();
  if (cmd === "project") {
    const prefix = rest[rest.length - 1] ?? "";
    return projectSlugs.filter((slug) => slug.startsWith(prefix.toLowerCase())).slice(0, 5);
  }
  if (cmd === "projects") {
    return ["--tag ai", "--tag data", "--tag fullstack", "--pinned"];
  }
  if (cmd === "skills") {
    return ["--cluster data", "--cluster ai", "--cluster analytics", "--cluster dev"];
  }

  return [];
}
