# Agent Kyle content guide

## Where to edit

| Content | Editable source | Where it appears |
| --- | --- | --- |
| Current AI model and workflow description | `content/config/ai-workflow.json` | About page at `/about#ai-workflow`, site search, and Agent Kyle evidence |
| Work journal | `content/now/entries.json` | Homepage Now section, `/archive/now`, search, and Agent Kyle |
| Resume | `content/resume/resume.md` | Resume page after regenerating `content/resume/derived.json` |
| Resume data read by the agent | `content/resume/derived.json` | Career highlights, skill clusters, and local professional-profile context |
| Project metadata | `content/projects/projects.json` | Project cards and Agent Kyle project/GitHub evidence |
| Full project case studies | `content/projects/*.mdx` | Project pages and generated search documents |
| Biography and personal interests | `app/(site)/about/page.tsx` | About page; only the shared AI workflow paragraph is directly included in agent evidence |
| Homepage introduction | `components/IntroBridge.tsx` | Homepage introduction |
| Career timeline | `components/viz/ImpactTimeline.tsx` | Homepage proof section |
| Playground description | `components/SectionPlayground.tsx` | Homepage Emberwild section |
| Contact links | `content/config/site.json` | Contact UI and Agent Kyle actions |
| Short searchable section descriptions | `scripts/build-search-index.ts` | Generated search index and Agent Kyle section evidence |

`public/search-index.json` is generated output. Update the source files and run `npm run build:index`; avoid editing the index directly. The fallback section descriptions in `lib/content.ts` also need to stay aligned when editing the hardcoded section summaries.

## What the agent actually receives

Agent Kyle retrieves repository content for each request. It does not browse the live web, scrape LinkedIn, or read the entire repository into its prompt.

`lib/agent-kyle/evidence.ts` combines:

- The full current AI workflow statement from `content/config/ai-workflow.json`.
- Two evidence records per project: a case-study link and a GitHub link. Both use the local project metadata and README highlights; neither fetches the remote repository during chat.
- Resume skill clusters and work-role highlights. The LinkedIn record is a summary assembled from the local resume plus the configured LinkedIn URL.
- Up to 16 Now entries, current entries first, then archived entries. Each includes its date and whether it is current or archived.
- Short site-section summaries from the generated search index.

Most evidence snippets are about 190 characters. Now snippets allow up to 900 characters. The shared current AI workflow statement is kept in full.

`lib/agent-kyle/retrieval.ts` uses keyword overlap and AI-workflow boosts to select up to 18 evidence records. AI/workflow questions prioritize the current AI statement. The last five conversation messages inform this selection; up to eight recent messages and the current page path are then included in the model prompt by `lib/agent-kyle/chat.ts`.

The site has more information than this selection includes. For example, full About prose, full case-study Markdown, education, and certifications are not automatically supplied to every chat. Search documents include case-study text, but the agent's project evidence is built from project metadata rather than those search documents.

## Model wording

The current public statement is:

> I use the latest models from OpenAI, Anthropic, and SpaceXAI to research ideas, build applications, debug code, and improve data workflows.

`lib/agent-kyle/prompts.ts` instructs chat, scorecard, and fit responses to use provider-level wording, avoid model versions and fixed model preferences, and preserve useful tool names and supported project integrations. Chat also treats archived Now entries as historical evidence.

At Kyle's request, the June 7, 2026 model entry was revised to remove version-specific preferences and comparisons while preserving its ID, date, category, and links. Other history remains intact. New Now publications should continue to append entries rather than rewrite earlier ones.

The runtime setting `AGENT_KYLE_MODEL` and the default in `lib/agent-kyle/groq.ts` still require an exact provider model ID. That is operational configuration, separate from the biography's description of Kyle's tools. Model IDs in setup documentation and provider tests serve the same operational purpose.

## Verify an update

Run `npm run build:index`, `npm run test:agent-retrieval`, `npm run test:agent-provider`, `npm run typecheck`, and `npm run build`. Commit the generated index alongside content changes. Check `/about#ai-workflow`, `/#now`, and `/archive/now`, then ask Agent Kyle which AI models Kyle uses. Confirm that it uses provider-level wording and that archived activities are not presented as current.
