# Kyle Springfield Personal Site

Editorial portfolio focused on projects, now updates, and AI workflows.

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS
- MDX via `next-mdx-remote/rsc`
- Build-time content ingestion/indexing scripts

## Theme QA
- Theme tokens live in `styles/globals.css` (`--c-*` variables). Base is true black, blues are accent-only.
- Tailwind semantic color utilities map to tokens in `tailwind.config.ts` (for example `bg-surface-2`, `text-muted`, `border-border-accent`).
- Non-CSS palette constants for generated assets/canvas live in `lib/theme/palette.ts`.
- When styling components, use semantic token classes/variables instead of new inline hex values.

## Commands
- `npm run dev` - Start local dev server
- `npm run ingest` - Pull GitHub metadata + parse resume to derived JSON
- `npm run build:index` - Build `public/search-index.json`
- `npm run build` - Production build

## Security (npm audit)
If you see a high-severity advisory for `next` (for example GHSA-9g9p-9gw9-jx7f or GHSA-h25m-26qc-wcjf), update to a patched release.

This project is pinned to:
- `next@^15.5.10` (patched line for the reported advisories)

Run:

```bash
npm install
npm audit
```

If `npm audit` still reports `next`, force-refresh lockfile resolution:

```bash
npm install next@^15.5.10
npm audit
```

## Environment
- `GITHUB_TOKEN` (optional but recommended): Personal Access Token used by ingestion scripts to call GitHub REST/GraphQL APIs with higher rate limits and pinned-repo support.
- `NEXT_PUBLIC_SITE_URL`: canonical site URL used for metadata/sitemap (for example `https://kylespringfield.dev`).
- `NEXT_PUBLIC_FOOTER_VIDEO_URL` (optional): public video URL used as the background video for the home page contact/footer section (`.mp4` preferred, `.mov` supported if browser codec-compatible).

### What is `GITHUB_TOKEN`?
`GITHUB_TOKEN` here means a GitHub Personal Access Token (PAT) that you create in your GitHub account.

This project uses it for:
- Pulling pinned repositories via GitHub GraphQL
- Fetching repo metadata with better API rate limits than anonymous requests

### How to create a `GITHUB_TOKEN`
1. Go to GitHub: `Settings` -> `Developer settings` -> `Personal access tokens`.
2. Create either:
- Fine-grained token (recommended)
- Classic token (works too)
3. Give read-only access (no write permissions needed for this project).
4. Copy the token and set it in your local env file:

```bash
# .env.local
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxx
```

## Deploying to Vercel
1. Push this repo to GitHub.
2. In Vercel, click `Add New...` -> `Project` and import the repo.
3. Vercel will detect Next.js automatically. Keep build command as default (`next build` via `npm run build`).
4. Configure environment variables in Vercel project settings:
- `NEXT_PUBLIC_SITE_URL` = your production URL (custom domain or `https://<project>.vercel.app`)
- `NEXT_PUBLIC_FOOTER_VIDEO_URL` = optional hosted video URL (for example from Vercel Blob)
- `GITHUB_TOKEN` = optional (needed only if you run ingestion in CI/server-side workflows)
5. Deploy.

Recommended flow:
- Run `npm run ingest` locally when you want to refresh GitHub/resume-derived content.
- Commit generated content files (`content/projects/projects.json`, `content/resume/derived.json`, `public/search-index.json`).
- Deploy the committed content to Vercel.

## Content sources
- `content/resume/resume.md` (authoritative resume input)
- `content/projects/projects.json` + `content/projects/*.mdx`
- `content/now/entries.json`

## Notes
- Ingestion scripts are non-destructive: existing case-study MDX files are never overwritten.
- Agent Kyle panel is optional; the site remains navigable without JavaScript.
