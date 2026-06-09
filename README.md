# Kyle Springfield

Personal portfolio and public work journal for [kylespringfield.com](https://kylespringfield.com).

The site brings together career experience, technical case studies, current experiments, and Agent Kyle: a conversational portfolio guide grounded in the site's public content.

## Highlights

- Editorial homepage with career proof, projects, skills, current work, and contact information
- Project case studies backed by curated GitHub metadata
- Resume generated from a maintainable Markdown source
- Append-only "Now" feed with current and archived entries
- Search index covering projects, site sections, and the full Now archive
- Agent Kyle chatbot with suggested questions, grounded responses, follow-up prompts, and contextual links
- Responsive, accessible dark interface built around shared design tokens

## Stack

- Next.js 15 App Router
- React 18 and TypeScript
- Tailwind CSS with semantic theme tokens
- Markdown and MDX content parsed with `gray-matter` and Remark
- Groq-hosted language models for Agent Kyle
- Zod for API validation
- Vercel Analytics

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Agent Kyle remains offline until `GROQ_API_KEY` is configured. The rest of the site works without it.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Next.js development server |
| `npm run typecheck` | Run TypeScript validation without emitting files |
| `npm run test:agent-retrieval` | Verify key Agent Kyle questions retrieve the expected Now context |
| `npm run build:index` | Rebuild `public/search-index.json` |
| `npm run ingest` | Refresh GitHub metadata, parse the resume, and rebuild the search index |
| `npm run build` | Rebuild the search index and create a production build |
| `npm run start` | Serve the production build |

## Environment

Copy `.env.example` to `.env.local` and configure only the values needed for your workflow.

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical URL used by metadata and the sitemap |
| `GITHUB_TOKEN` | Optional | Read-only GitHub PAT for higher ingestion limits and pinned repository GraphQL data |
| `GROQ_API_KEY` | Agent Kyle | API key used for conversational responses |
| `AGENT_KYLE_ENABLED` | Optional | Set to `false` to disable Agent Kyle |
| `AGENT_KYLE_MODEL` | Optional | Groq model ID; defaults to `llama-3.1-8b-instant` |
| `AGENT_KYLE_DAILY_TOKEN_BUDGET` | Optional | Process-level daily token allowance; defaults to `120000` |
| `AGENT_KYLE_REQUEST_TIMEOUT_MS` | Optional | Model request timeout; defaults to `20000` |
| `AGENT_KYLE_RATE_LIMIT_SALT` | Recommended | Private salt used when hashing visitor IP addresses |
| `NEXT_PUBLIC_FOOTER_VIDEO_URL` | Optional | Fallback video URL when `content/config/site.json` has no `footerVideoUrl` |

### GitHub Token

The ingestion script uses a token only for read access:

1. Open GitHub `Settings` → `Developer settings` → `Personal access tokens`.
2. Create a fine-grained token with read-only access to public repository metadata.
3. Add it to `.env.local`:

```bash
GITHUB_TOKEN=github_pat_xxxxxxxxxxxxxxxxx
```

Never commit `.env.local` or production secrets.

## Content

The repository treats content files as the source of truth. Generated files should be committed so production builds remain deterministic.

| Source | Purpose |
| --- | --- |
| `content/config/site.json` | Name, public contact links, and footer video |
| `content/config/proof-metrics.json` | Career timeline highlights |
| `content/resume/resume.md` | Authoritative resume content |
| `content/resume/derived.json` | Generated resume data consumed by the UI |
| `content/projects/projects.json` | Curated and ingested project metadata |
| `content/projects/*.mdx` | Project case studies |
| `content/now/entries.json` | Append-only current-work history |
| `public/search-index.json` | Generated search and retrieval index |

### Resume Workflow

1. Edit `content/resume/resume.md`.
2. Run:

```bash
npm run ingest
```

3. Review and commit `content/resume/derived.json` and `public/search-index.json`.

### Project Workflow

`scripts/ingest-github.ts` reads public GitHub repository metadata, README highlights, topics, language, stars, and forks. A token also enables pinned-repository discovery.

Existing case-study MDX files are preserved. New repositories may receive a starter case-study file that can be edited manually.

After ingestion, review and commit:

- `content/projects/projects.json`
- Any intentional new `content/projects/*.mdx` files
- `public/search-index.json`

### Now Feed Workflow

`content/now/entries.json` is append-only history.

- Add new entries without deleting or replacing older entries.
- Use a unique, date-prefixed `id`, such as `2026-06-09-agent-kyle`.
- Preserve each entry's original date, category, details, and links.
- Entries newer than `expireDays` appear on `/#now`.
- Expired entries remain available at `/archive/now`.

After editing the feed:

```bash
npm run build:index
```

Commit `public/search-index.json`, then verify both `/#now` and `/archive/now`.

## Agent Kyle

Agent Kyle appears in the homepage bottom dock after a visitor reaches the Projects section. It can answer questions about Kyle's experience, projects, skills, current work, and potential role fit.

The agent retrieves evidence from:

- Resume and career data stored in this repository
- Project case studies and GitHub-ingested metadata
- Current and archived Now entries
- Public site sections
- Curated LinkedIn profile context and the public profile URL

LinkedIn is not scraped at request time. Professional context is maintained through the local resume data and configured public profile link.

Responses are constrained to supplied evidence, validated with Zod, and may include follow-up questions or actions such as opening a case study, resume, GitHub profile, LinkedIn profile, or email link.

### Guardrails

- Requests are validated and free text is sanitized.
- Visitor IP addresses are hashed before rate-limit storage.
- Default limits are 8 requests per 10 minutes and 20 requests per browser session within a 24-hour window.
- Repeated excess traffic triggers a 60-second cooldown.
- A configurable daily token budget limits model usage.
- Agent availability is exposed through `/api/agent-kyle/status`.
- The site provides public navigation fallbacks when the model is unavailable.

Rate limits and budget counters are held in process memory. For multi-instance production enforcement, replace them with a shared store such as Redis or Vercel KV.

## Project Structure

```text
app/
  (home)/                 Homepage
  (site)/                 About, resume, projects, and Now archive
  api/agent-kyle/         Agent status, chat, and analysis endpoints
components/
  agent-kyle/             Conversational panel and supporting charts
content/
  config/                 Site configuration and proof metrics
  now/                    Append-only Now feed
  projects/               Project metadata and case studies
  resume/                 Resume source and generated data
lib/
  agent-kyle/             Retrieval, prompts, model client, limits, and schemas
scripts/                  GitHub ingestion, resume parsing, and search indexing
styles/                   Global styles and design tokens
```

## Design System

Theme tokens live in `styles/globals.css` as `--c-*` variables. Tailwind maps semantic utilities to those tokens in `tailwind.config.ts`.

Prefer semantic classes such as:

- `bg-surface-2`
- `text-muted`
- `border-border-accent`

Avoid introducing isolated hex values when an existing token expresses the intended role. Non-CSS palette values used by generated assets or canvas code belong in `lib/theme/palette.ts`.

## Validation

Before shipping changes:

```bash
npm run typecheck
npm run test:agent-retrieval
npm run build
```

For interface changes, verify the relevant desktop and mobile flows. Agent Kyle changes should cover its collapsed dock, expanded panel, offline state, and conversation state.

## Deployment

The site is designed for Vercel:

1. Import the GitHub repository into Vercel.
2. Keep the default `npm run build` command.
3. Configure production environment variables.
4. Deploy the committed generated content.

Recommended publishing flow:

```bash
npm run ingest
npm run typecheck
npm run build
```

Review generated changes before committing. Ingestion is intentionally run ahead of deployment rather than relying on production builds to mutate repository content.

## Dependency Maintenance

Run periodic checks locally:

```bash
npm audit
npm outdated
```

Keep Next.js on a supported patched release and review lockfile changes before deployment.
