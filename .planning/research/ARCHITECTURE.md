# Architecture Research

**Domain:** Static knowledge site (Astro 6 + Starlight) + serverless RAG chat (Cloudflare Worker) + scheduled content pipeline (GitHub Actions), with git-derived diffs, multi-collection content with cross-references, and persona lenses on a canonical narrative.
**Researched:** 2026-05-24
**Confidence:** HIGH (verified against Astro, Starlight, Cloudflare, and GitHub Actions docs); MEDIUM on a few opinionated patterns (registry derivation, persona URL strategy) which are tradeoff calls rather than verified facts.

---

## TL;DR — One-Paragraph Recommendation

Use a **pnpm-workspace monorepo** with three apps (`apps/site` Astro 6 + Starlight, `apps/chat-worker` Cloudflare Worker on Hono, `apps/pipeline` Node scripts run by GitHub Actions) and a `packages/shared` for Zod schemas + types. **Content lives in `apps/site/src/content/`** across five typed collections (`stages`, `regulations`, `vendor`, `glossary`, `stories`) with `reference()` linking topic↔regulation. The **topic↔regulation matrix is authored on each topic page's frontmatter** and reverse-indexed at build time into `src/data/matrix.json` (single source of truth, no duplication). **Regulation snapshots are dated files** (`regulations/eu-ai-act/2026-05-22.md`) and **diffs are computed at build time** via `jsdiff` over the cleaned markdown (not raw HTML), persisted as JSON next to the snapshot, and rendered with `diff2html`. The **pipeline is one workflow per source group with a serial concurrency group** to prevent PR stomping; each PR is scoped to one source. **Embeddings are generated in CI** when content changes and pushed to Vectorize; the Worker only reads. **Personas use a single canonical MDX file per topic** with `<PersonaSwitch>` islands and `?persona=` query (client-side) — no URL fragmentation, citations stay stable. **The wizard is JSON decision-tree authored in `apps/site/src/data/wizard.json`**, rendered by a React/Solid island, outputs a checklist that links into the matrix. **Site and Worker deploy independently**; Vectorize re-indexing is gated on content changes via a path filter.

---

## System Overview

### Three Independent Subsystems

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SCHEDULED PIPELINE (CI)                           │
│                    GitHub Actions cron + on-demand                       │
│                                                                          │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐         │
│   │ scrape-  │    │ scrape-  │    │ scrape-  │    │ scrape-  │         │
│   │ eu-uk    │    │ us-state │    │ global   │    │ vendor   │         │
│   │ (daily)  │    │ (daily)  │    │ (weekly) │    │ (weekly) │         │
│   └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘         │
│        │               │               │               │                │
│        ▼               ▼               ▼               ▼                │
│   ┌─────────────────────────────────────────────────────────────┐       │
│   │  fetch → clean-to-md → diff vs latest snapshot → if changed:│       │
│   │    write dated snapshot file → AI-draft topic-page update   │       │
│   │    → open PR (one PR per source, no two PRs touch same file)│       │
│   └─────────────────────────────────────────────────────────────┘       │
│                                  │                                       │
└──────────────────────────────────┼───────────────────────────────────────┘
                                   │ PR merged
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       SITE BUILD (CI, on push to main)                   │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────┐      │
│   │  content/  ─→  build matrix.json  ─→  Astro 6 build  ─→     │      │
│   │              (reverse-index             (Starlight,           │      │
│   │               topic↔reg)                 Pagefind, MDX)       │      │
│   │                                                               │      │
│   │  git log  ─→  build changes.json  ─→  per-page changelog +   │      │
│   │              (per-file timeline)        global feed.xml       │      │
│   └────────────────────────────┬─────────────────────────────────┘      │
│                                │                                         │
│                                ▼                                         │
│                       ┌────────────────┐        ┌──────────────────┐   │
│                       │ GitHub Pages   │        │ Vectorize Reindex │   │
│                       │ (static HTML)  │        │ (only changed     │   │
│                       │                │        │  files re-embed)  │   │
│                       └────────────────┘        └──────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
                                                            │ upsert
                                                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       CHAT (on user request)                             │
│                                                                          │
│   Browser  ──fetch──▶  Cloudflare Worker (Hono)                          │
│                              │                                            │
│                              │ 1. embed query (Workers AI BGE)            │
│                              │ 2. retrieve k=8 (Vectorize)                │
│                              │ 3. fetch metadata (chunk_url, title)       │
│                              │ 4. stream Claude Haiku 4.5 w/ citations    │
│                              │ 5. prompt-cache system + top regs          │
│                              ▼                                            │
│                       SSE stream back to browser                         │
│                       (citations link to /stages/.../#chunk-XX)          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Owns | Lifecycle | Deploy Unit |
|-----------|------|-----------|-------------|
| `apps/site` | Astro 6 + Starlight; MDX content; matrix builder; diff renderer; wizard island; chat widget shell | Build-time (GitHub Actions) | Static HTML to GitHub Pages |
| `apps/chat-worker` | RAG retrieval + Claude streaming; rate limiting; query embedding | On-request (V8 isolate) | Cloudflare Worker (`wrangler deploy`) |
| `apps/pipeline` | Scrape adapters per source; HTML→Markdown cleaner; diff generator; AI-draft via Claude; PR opener | Scheduled (cron) + manual | GitHub Actions only — never deployed |
| `packages/shared` | Zod schemas (topic, regulation, snapshot, wizard, matrix); content types; URL helpers | Build-time (imported) | npm package within workspace |
| `packages/embed-cli` | Read changed content files → chunk → embed via Workers AI REST → upsert to Vectorize | CI (after site build, before chat reads it) | Run from Action with secrets |
| `content/` (in `apps/site/src/content/`) | Canonical source of truth: stages, regulations, snapshots, vendor, glossary, stories | Git-tracked | n/a (consumed by build) |
| `content/data/matrix.json` | **Generated**, never hand-edited: bidirectional topic↔regulation index | Build artifact | Committed (so diffs show), regenerated by `pnpm matrix:build` |
| `content/data/changes.json` | **Generated** from `git log --follow`: per-file change timeline + meaningful-change markers | Build artifact | Built every deploy, not committed |
| Cloudflare Vectorize index `ai-gov-content` | Chunk embeddings + metadata (url, title, snapshot_date, source_type) | Mutated by CI only; read by Worker | Cloudflare-managed |

**Boundary rule:** the Worker **never writes**; the pipeline **never reads Vectorize**; the site build **never calls external APIs at runtime**. Each subsystem owns its mutation surface, which makes failures isolable.

---

## Repository Layout

```
ai-governance/
├── apps/
│   ├── site/                                # Astro 6 + Starlight → GitHub Pages
│   │   ├── astro.config.mjs
│   │   ├── src/
│   │   │   ├── content.config.ts            # Zod schemas for all collections
│   │   │   ├── content/
│   │   │   │   ├── stages/                  # 12 journey topics (.mdx)
│   │   │   │   │   ├── 01-ai-policy.mdx
│   │   │   │   │   ├── 02-risk-tiering.mdx
│   │   │   │   │   └── ...
│   │   │   │   ├── regulations/             # one folder per source
│   │   │   │   │   ├── eu-ai-act/
│   │   │   │   │   │   ├── index.md         # canonical overview
│   │   │   │   │   │   └── snapshots/
│   │   │   │   │   │       ├── 2026-05-22.md
│   │   │   │   │   │       ├── 2026-05-15.md
│   │   │   │   │   │       └── 2026-05-08.md
│   │   │   │   │   ├── nist-ai-rmf/
│   │   │   │   │   ├── iso-42001/
│   │   │   │   │   └── ...
│   │   │   │   ├── vendor/                  # OpenAI/Anthropic/Google/Microsoft/Meta
│   │   │   │   │   └── anthropic/
│   │   │   │   │       ├── index.md
│   │   │   │   │       └── snapshots/...
│   │   │   │   ├── glossary/                # one term per file
│   │   │   │   └── stories/                 # fictional companies (Sigma Health, etc.)
│   │   │   │
│   │   │   ├── data/
│   │   │   │   ├── matrix.json              # GENERATED — committed for diff visibility
│   │   │   │   ├── matrix.schema.json
│   │   │   │   ├── wizard.json              # decision tree (hand-authored)
│   │   │   │   ├── wizard.schema.json
│   │   │   │   └── personas.json            # exec/eng/compliance config
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── PersonaSwitch.astro      # client-side lens toggle
│   │   │   │   ├── PersonaSection.astro     # wraps persona-tagged MDX block
│   │   │   │   ├── DiffViewer.astro         # diff2html island
│   │   │   │   ├── ChangelogTimeline.astro  # per-page changes
│   │   │   │   ├── RegMatrix.astro          # renders topic↔reg table
│   │   │   │   ├── Wizard.tsx               # React island (one of few JS islands)
│   │   │   │   └── ChatWidget.tsx           # SSE consumer, mounts on click
│   │   │   │
│   │   │   ├── pages/
│   │   │   │   ├── stages/[slug].astro      # dynamic from stages collection
│   │   │   │   ├── regulations/[source]/[snapshot].astro
│   │   │   │   ├── matrix.astro             # full matrix browser
│   │   │   │   ├── whats-new.astro          # global feed
│   │   │   │   ├── feed.xml.ts              # RSS for whats-new
│   │   │   │   └── wizard.astro             # wizard host page
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── build-matrix.ts          # reverse-index builder
│   │   │   │   ├── build-changes.ts         # git log → changes.json
│   │   │   │   ├── git-diff.ts              # jsdiff wrapper
│   │   │   │   ├── persona.ts               # client-side lens swap
│   │   │   │   └── chat-client.ts           # browser SSE consumer
│   │   │   │
│   │   │   └── styles/
│   │   │       └── global.css               # Tailwind v4 imports + Starlight overrides
│   │   │
│   │   └── package.json
│   │
│   ├── chat-worker/                         # Cloudflare Worker → /chat
│   │   ├── wrangler.toml
│   │   ├── src/
│   │   │   ├── index.ts                     # Hono app entry
│   │   │   ├── routes/
│   │   │   │   ├── chat.ts                  # POST /chat — RAG + stream
│   │   │   │   ├── feedback.ts              # POST /feedback (logs to KV)
│   │   │   │   └── healthz.ts
│   │   │   ├── rag/
│   │   │   │   ├── embed.ts                 # query embedding via AI binding
│   │   │   │   ├── retrieve.ts              # Vectorize query
│   │   │   │   └── prompt.ts                # system prompt + citation contract
│   │   │   └── lib/
│   │   │       └── rate-limit.ts            # KV-backed sliding window
│   │   └── package.json
│   │
│   └── pipeline/                            # ETL + AI-draft, run in Actions
│       ├── src/
│       │   ├── sources/
│       │   │   ├── eu-ai-act.ts             # one adapter per source
│       │   │   ├── nist-ai-rmf.ts
│       │   │   ├── ico-uk.ts
│       │   │   ├── iso-42001.ts
│       │   │   ├── anthropic.ts
│       │   │   └── ...
│       │   ├── scrape/
│       │   │   ├── fetch.ts                 # cheerio first
│       │   │   ├── playwright.ts            # JS-required fallback
│       │   │   └── clean.ts                 # HTML → clean MD via remark/rehype
│       │   ├── diff/
│       │   │   ├── compare.ts               # latest snapshot vs new fetch
│       │   │   └── meaningful.ts            # whitespace + section-reorder filters
│       │   ├── ai/
│       │   │   ├── draft-topic-update.ts    # Claude proposes topic-page edits
│       │   │   └── classify-change.ts       # tag: editorial/clarification/material
│       │   ├── pr/
│       │   │   ├── open-pr.ts               # via gh CLI, structured branch name
│       │   │   └── pr-body.ts               # rendered diff + reviewer checklist
│       │   └── run.ts                       # CLI: pnpm pipeline run <source>
│       └── package.json
│
├── packages/
│   ├── shared/
│   │   ├── src/
│   │   │   ├── schemas/
│   │   │   │   ├── stage.ts                 # Zod schema for stage frontmatter
│   │   │   │   ├── regulation.ts
│   │   │   │   ├── snapshot.ts
│   │   │   │   ├── matrix.ts
│   │   │   │   └── wizard.ts
│   │   │   ├── types.ts                     # exported TS types
│   │   │   └── urls.ts                      # canonical URL builders (used by site, worker, pipeline)
│   │   └── package.json
│   │
│   └── embed-cli/
│       ├── src/
│       │   ├── chunk.ts                     # split MD into ~500-token chunks at headings
│       │   ├── embed.ts                     # call Workers AI REST
│       │   ├── upsert.ts                    # Vectorize REST API
│       │   └── diff-since.ts                # compute which files changed since last embed
│       └── package.json
│
├── .github/workflows/
│   ├── deploy-site.yml                      # push main → build + deploy GH Pages
│   ├── deploy-worker.yml                    # push affecting apps/chat-worker → wrangler deploy
│   ├── reindex-vectors.yml                  # push affecting content → embed → upsert
│   ├── scrape-eu-uk.yml                     # cron 0 6 * * * — concurrency group "pipeline-eu-uk"
│   ├── scrape-us-state.yml                  # cron 0 7 * * *
│   ├── scrape-global.yml                    # cron 0 8 * * 1 (weekly Mon)
│   ├── scrape-vendor.yml                    # cron 0 9 * * 2 (weekly Tue)
│   ├── matrix-check.yml                     # PR check — rebuild matrix.json must match committed
│   ├── lighthouse-ci.yml                    # PR check — perf budgets
│   └── axe-ci.yml                           # PR check — WCAG 2.2 AA
│
├── pnpm-workspace.yaml
├── package.json                              # root scripts (build:all, matrix:build, embed:diff)
├── tsconfig.base.json
├── .nvmrc                                    # 22.x for Astro 6
├── README.md
└── .planning/                                # GSD planning artifacts (this folder)
```

### Layout Rationale

- **Monorepo with three apps + two packages** (not single-tree, not micro-repos):
  - **Single-tree problem:** the Worker needs different `tsconfig` (Cloudflare types), the pipeline needs Node-only deps (playwright, gh CLI), and the site needs Vite — one `package.json` becomes a junk drawer of conflicting deps.
  - **Micro-repos problem:** shared Zod schemas would have to be a published package on every change, killing iteration speed.
  - **Workspace solution:** schemas in `packages/shared` are imported as `@aigov/shared` and resolve through workspace symlinks; no publish step. Each app deploys independently.
- **Content stays inside `apps/site/src/content/`** (not in a top-level `/content`): Astro's Content Layer API is co-located by design, and moving it out adds path-mapping overhead with no benefit.
- **Snapshots live inside their regulation folder** (not in a parallel `/snapshots/` tree): all files for one source are in one directory, which is how a tired maintainer will navigate at 11 PM.
- **`data/` is split from `content/`**: matrix and wizard are *derived* or *configuration*, not narrative content; mixing them into `content/` collections would mean Astro tries to render them as pages.

---

## Topic ↔ Regulation Bidirectional Matrix

**Source of truth:** topic pages (`stages/*.mdx`) declare the regulations they touch via `regulations: [...]` in frontmatter. Regulation pages do **not** declare topics in frontmatter. The reverse index (regulation → topics) is **generated** by `lib/build-matrix.ts` at build time.

**Why this direction:** topics are written by Anand (one author, deliberate); regulations are scraped and rewritten by the pipeline (potentially many sources, no human in the loop on every change). Authoring "this topic touches Article 11" beside the topic text is natural; trying to keep regulation frontmatter in sync with topic mentions is the exact YAML-soup problem this question warned about.

```typescript
// packages/shared/src/schemas/stage.ts
import { z } from 'zod';

export const RegulationRef = z.object({
  source: z.string(),              // 'eu-ai-act' (matches folder name)
  articles: z.array(z.string()),   // ['Art-11', 'Annex-IV']
  relevance: z.enum(['core', 'supporting', 'related']),  // for ranking in UI
  note: z.string().optional()      // why this regulation matters here
});

export const StageFrontmatter = z.object({
  stage: z.number().int().min(0).max(12),    // 0 = Start, 12 = End
  slug: z.string(),                          // 'risk-tiering'
  title: z.string(),
  subtitle: z.string().optional(),
  storyCharacter: z.string().optional(),     // 'Sigma Health — Layla, CTO'
  personas: z.object({
    exec: z.boolean().default(true),
    engineer: z.boolean().default(true),
    compliance: z.boolean().default(true)
  }),
  regulations: z.array(RegulationRef),
  prerequisites: z.array(z.string()).default([]),  // slugs of stages assumed read
  lastMeaningfulChange: z.string().optional(),      // ISO date — overrides git when meta change
  draft: z.boolean().default(false)
});
```

```typescript
// apps/site/src/lib/build-matrix.ts (runs from a prebuild hook)
import { getCollection } from 'astro:content';

export async function buildMatrix() {
  const stages = await getCollection('stages');
  const regulations = await getCollection('regulations');

  // Forward: topic → regulations[] (already in frontmatter, just project)
  const forward = Object.fromEntries(
    stages.map(s => [s.data.slug, s.data.regulations])
  );

  // Reverse: regulation → topics[]
  const reverse: Record<string, Array<{ topic: string; relevance: string; articles: string[] }>> = {};
  for (const stage of stages) {
    for (const reg of stage.data.regulations) {
      reverse[reg.source] ??= [];
      reverse[reg.source].push({
        topic: stage.data.slug,
        relevance: reg.relevance,
        articles: reg.articles
      });
    }
  }

  // Article-level reverse (for "what topics cite Art 11?")
  const byArticle: Record<string, string[]> = {};
  for (const stage of stages) {
    for (const reg of stage.data.regulations) {
      for (const art of reg.articles) {
        const key = `${reg.source}/${art}`;
        byArticle[key] ??= [];
        byArticle[key].push(stage.data.slug);
      }
    }
  }

  return { forward, reverse, byArticle, builtAt: new Date().toISOString() };
}
```

**`matrix.json` is committed to git** so that:
1. A PR that adds a `regulations:` entry shows the matrix diff in code review — reviewers see "this added two new topic↔reg edges" without running the build.
2. The wizard (which renders the matrix client-side) doesn't need a separate fetch — the JSON is part of the static bundle.
3. A `matrix-check.yml` GitHub Action runs `pnpm matrix:build` on every PR and fails if the committed `matrix.json` doesn't match the regenerated output, preventing drift.

---

## Regulation Snapshot Storage

**Pattern:** dated markdown files in each source's `snapshots/` folder + git history. **Both,** with explicit roles:

- **Dated snapshot files** are the authoritative input to the diff engine. They are deterministic — `2026-05-22.md` is the same file forever. The pipeline only writes a new dated file *if* the cleaned content materially differs from the latest snapshot.
- **Git history** is the change log. The pipeline commits the new snapshot + the regenerated `regulations/<source>/index.md` (canonical view) in one commit per source, with a structured message: `regs(eu-ai-act): snapshot 2026-05-22`. The "What changed since last week" view reads `git log --follow snapshots/` for a fast per-file timeline.

**Why both:**
- Pure git history would force the diff engine to do `git show HEAD~3:regulations/.../index.md` for older comparisons — slow at build time and brittle if the file is renamed. Dated files are stable URLs and stable diff inputs.
- Pure dated files (no git) would lose the audit trail of *who/when* the snapshot was committed, which is the trust story for the site.

**Diff is computed over cleaned markdown, not raw HTML:**

```
raw HTML  ──[fetch + cheerio]──▶  semantic HTML
                                      │
                                      ▼
                              [rehype + remark] ── cleaned MD
                                      │
                                      ▼
                          jsdiff(prevSnapshot, newSnapshot)
                                      │
                                      ▼
              dist/regulations/<source>/<date>.diff.json
              ├─ summary: { added, removed, changed_sections }
              ├─ hunks: [{ type, lines, context }]
              └─ meta: { prev_date, this_date, src_url, fetched_at }
```

Raw HTML diffs are nearly useless (one CSS class change makes the whole page light up). Clean markdown gives a diff that maps to the actual semantic change — paragraphs, sections, terms.

**Snapshot frontmatter:**

```yaml
---
source: eu-ai-act
snapshotDate: 2026-05-22
srcUrl: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689
fetchedAt: 2026-05-22T06:14:00Z
fetcherVersion: pipeline-0.4.2
materialChange: true               # filter for "What's new"
changeKind: amendment              # editorial | clarification | amendment | new-section
changeSummary: |
  Annex IV §3 updated to require disaggregated metrics for high-risk
  biometric systems. New §5 added on incident-classification thresholds.
relatedArticles: [Art-11, Annex-IV]
---
```

---

## Diff / Changelog Rendering

**Hybrid: build-time diff generation, client-side rendering.**

- **Build-time:** `lib/git-diff.ts` walks `regulations/*/snapshots/` and emits a `<date>.diff.json` next to each snapshot. This is cheap (small inputs, deterministic) and avoids shipping `jsdiff` to the browser.
- **Client-side:** `diff2html` (~30KB gzipped) renders the JSON as side-by-side or unified HTML when the user opens a diff. Lazy-load via `client:visible` so it costs zero for users who never click.
- **Fallback for SEO/no-JS:** every diff page server-renders a collapsed `<details>` containing a `<pre>` of the unified diff. Search engines index the change; users with JS get the styled view.

**Per-page changelog:**

```
stages/risk-tiering.mdx
       │
       ├── git log --follow stages/risk-tiering.mdx  (build-time)
       │           │
       │           ▼
       │   data/changes.json["stages/risk-tiering"] = [
       │     { sha, date, message, materialChange: bool, authoredBy: 'human' | 'ai' }
       │   ]
       │
       └── related regulation changes (via matrix.json forward edge)
                   │
                   ▼
        for each reg in frontmatter.regulations:
          merge changes.json[`regulations/${reg.source}`] into timeline
```

The `<ChangelogTimeline>` Astro component reads this at build, renders a static timeline of "page edited" + "underlying regulation amended" events.

**Global "What's new" feed:**

```
data/changes.json (built from git log over all of content/)
         │
         ▼
   filter materialChange === true
   sort by date desc
   limit 100
         │
         ▼
   pages/whats-new.astro  (static page)
   pages/feed.xml.ts      (RSS)
```

The pipeline marks `materialChange: true` only when the change passes the `meaningful.ts` filter (ignores whitespace, link-rot fixes, typo corrections). Human-authored commits default to `true` unless the commit message starts with `chore:`.

---

## Pipeline Orchestration

**One workflow per source group**, **not** one giant workflow:

| Workflow | Schedule | Sources | Concurrency group |
|----------|----------|---------|-------------------|
| `scrape-eu-uk.yml` | daily 06:00 UTC | EU AI Act (EUR-Lex), ICO, FCA, MHRA, EDPB | `pipeline-eu-uk` |
| `scrape-us-state.yml` | daily 07:00 UTC | NIST AI RMF, US EO, CO, NY, CA state laws | `pipeline-us-state` |
| `scrape-global.yml` | weekly Mon 08:00 | ISO 42001 (light scrape), OECD, MEITY, Singapore, Japan | `pipeline-global` |
| `scrape-vendor.yml` | weekly Tue 09:00 | OpenAI/Anthropic/Google/Microsoft/Meta + OWASP/MITRE/PyRIT/Garak | `pipeline-vendor` |

**Why per-group, not per-source:**
- 30+ sources × one workflow each = 30 cron jobs to maintain.
- Grouped by region/cadence lets each workflow share the same Playwright setup, the same auth secrets per region, and produces one PR per group instead of 30.
- Failure of one source within a group is isolated by per-source `try/catch` in the runner — the workflow continues.

**Why not one mega-workflow:**
- A failure in one scrape would block all others.
- A single PR covering EU + US + vendor changes is too big to review well — defeats the trust mechanism.

**PR stomping prevention — three layers:**

1. **GitHub Actions `concurrency` groups** (top layer):
   ```yaml
   concurrency:
     group: ${{ github.workflow }}
     cancel-in-progress: false   # let in-flight finish; never overlap
   ```
   Two runs of the same workflow can never overlap. A nightly run that's still going when the next night fires gets queued (or skipped, per policy).

2. **Branch naming per source + date** (middle layer):
   ```
   auto/regs/<source>/<YYYY-MM-DD>          # eg auto/regs/eu-ai-act/2026-05-22
   auto/vendor/<source>/<YYYY-MM-DD>
   ```
   `gh pr create` with `--head auto/regs/eu-ai-act/2026-05-22` — if a branch already exists for today's source, the runner force-updates it (same date = same content window) rather than opening a duplicate PR.

3. **File-scope per PR** (bottom layer): each source's PR only touches `regulations/<source>/**` (or `vendor/<source>/**`) and at most one `stages/*.mdx` per source (the AI-drafted topic update). Two PRs from different sources can never touch the same file because they're scoped to different directories. The only shared mutation is `matrix.json` — and that is rebuilt **after merge** in the deploy workflow, not in the pipeline PR, so PRs never contain matrix changes.

**AI-drafted PR body structure** (reviewer reads in <2 min):

```markdown
## eu-ai-act — snapshot 2026-05-22

**Material change:** YES (Annex IV §3 amended)
**Kind:** amendment

### What changed
- Annex IV §3: now requires disaggregated metrics for biometric systems
- §5 added: incident-classification thresholds (24h / 72h tiers)

### Diff
[Side-by-side rendered diff embedded as <details>]

### Topic updates proposed
- `stages/risk-tiering.mdx`: added paragraph in "High-risk categories" lens=compliance
- `stages/monitoring.mdx`: added a new sub-section "72-hour incident reporting"

### Confidence
HIGH — direct text replacement in source; no inference.

### Reviewer checklist
- [ ] Snapshot diff looks like a real change (not a CSS/whitespace artifact)
- [ ] Topic edits read as Anand's voice (not LLM cadence)
- [ ] Citations point to correct article numbers
- [ ] No fabricated quotes (verify each `>` block against snapshot)
```

---

## Embeddings Pipeline for RAG

**Generated in CI on content change, stored in Vectorize, cached forever (until that chunk's source file changes).**

```
content change merged to main
         │
         ▼
.github/workflows/reindex-vectors.yml
   on:
     push:
       branches: [main]
       paths:
         - 'apps/site/src/content/**'
         - 'apps/site/src/data/glossary.json'
         │
         ▼
   packages/embed-cli/diff-since.ts
     git diff --name-only HEAD~1 HEAD -- 'apps/site/src/content/**'
         │
         ▼
   for each changed file:
     read MD/MDX → strip frontmatter → chunk at H2/H3 (~500 tokens)
         │
         ▼
   chunk_id = `${file_path}#${heading_slug}#${chunk_index}`
         │
         ▼
   embed via Workers AI REST (`@cf/baai/bge-base-en-v1.5`)
         │
         ▼
   Vectorize upsert with metadata:
     {
       chunk_id,                        // also the vector id (stable!)
       source_type: 'stage' | 'regulation' | 'vendor' | 'glossary',
       source_path: 'stages/risk-tiering.mdx',
       title: 'Risk Tiering',
       heading: 'High-risk categories',
       url: '/stages/risk-tiering/#high-risk-categories',
       snapshot_date: '2026-05-22'      // null for non-snapshots
     }
         │
         ▼
   for deleted files: delete vectors by namespace + chunk_id prefix
```

**Why CI, not Worker cold-start:**
- Workers have CPU limits (30s on free tier) — embedding 1000 chunks on cold start would time out.
- Embeddings change rarely (only on content edit); chat happens many times per embed event. Caching them in Vectorize amortizes the cost.
- Workers AI runs in the *same zone* as Vectorize when called from a Worker, but **REST-from-CI is the documented path** for batch embedding (no Worker needed in the pipeline path).

**Why not in-bundle JSON:**
- STACK.md called this out as a valid alternative if chat usage stays <100/day. The architecture preserves the option — if Vectorize becomes overkill, swap `retrieve.ts` to load `embeddings.json` from R2 and do cosine in JS. The interface is the same `retrieve(queryEmbedding, k) → Chunk[]`.

**Citation preservation — the URL-stability problem:**

The hard rule is **the `url` in vector metadata must outlive content reorganization**. Three mechanisms:

1. **Slug pinning in frontmatter:** every page declares an explicit `slug:` (never derived from filename). Renaming a file does not break the URL.
2. **Heading anchors are content-addressed:** the chunk_id includes the heading slug, but the *URL fragment* is regenerated on every build to match the current heading text. If a heading is renamed but the chunk is otherwise unchanged, the rebuild updates the metadata `url` field — citations stay correct.
3. **Redirects collection (`content/_redirects.json`):** when a slug is intentionally changed, a redirect entry is committed. The site emits `<meta http-equiv="refresh">` and a `_redirects` file for GitHub Pages (via a custom 404 page that reads the JSON and 301s). Old citations from old chat sessions still land on the right page.

The Worker fetches metadata at retrieval time, so citation URLs are always whatever was in Vectorize at the time of the last reindex — which is post-merge of any rename. There is no caching of citation URLs in the Worker beyond the request lifetime.

---

## Wizard Architecture

**JSON-authored decision tree, client-side rendered, output cites matrix.json.**

```typescript
// packages/shared/src/schemas/wizard.ts
export const WizardNode = z.object({
  id: z.string(),
  question: z.string(),
  helpText: z.string().optional(),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
    next: z.string().nullable(),       // next node id, or null = terminal
    tags: z.array(z.string()).default([])  // accumulated into user profile
  }))
});

export const WizardOutput = z.object({
  id: z.string(),                       // terminal node id
  title: z.string(),
  checklist: z.array(z.object({
    item: z.string(),
    why: z.string(),
    citesStage: z.string().optional(),   // links to /stages/<slug>
    citesRegulation: z.object({
      source: z.string(),
      articles: z.array(z.string())
    }).optional()
  })),
  conditionalChecklists: z.array(z.object({
    requiresTags: z.array(z.string()),  // only show if user has these tags
    items: z.array(z.unknown())         // same shape as checklist
  })).default([])
});
```

```
apps/site/src/data/wizard.json
{
  "start": "are-you-deployer-or-provider",
  "nodes": [
    { "id": "are-you-deployer-or-provider", "question": "...", "options": [...] },
    ...
  ],
  "outputs": [
    {
      "id": "deployer-high-risk-eu",
      "title": "Deployer of high-risk AI in EU",
      "checklist": [
        {
          "item": "Document data governance per Art 10",
          "why": "...",
          "citesStage": "data-controls",
          "citesRegulation": { "source": "eu-ai-act", "articles": ["Art-10"] }
        }
      ]
    }
  ]
}
```

**Why JSON, not a more interesting tree DSL:**
- JSON has perfect Zod validation, perfect git diff, and a non-programmer can edit it.
- An "interesting" DSL would need parser/tests/docs. The decision tree is shallow (probably 4-7 questions deep) — JSON is sufficient.

**Why client-side, not build-time generation of every leaf as a page:**
- 4 questions × 4 options = 256 possible terminal pages. Generating them statically would explode the site and pollute Pagefind with low-value pages.
- Client-side is one React island, ~15 KB, loaded only on `/wizard` route.
- Output can include a "share this result" deep link with state encoded in URL (`/wizard#result=deployer-high-risk-eu`), so the experience is shareable without server state.

**Wizard imports matrix.json:** when rendering a checklist item, it looks up `matrix.byArticle[`${source}/${article}`]` to suggest "topics that also discuss this." The wizard becomes a discovery surface into the narrative, not a dead-end.

---

## Persona-Lens Architecture

**Single canonical MDX file per topic with persona-tagged sections, switched client-side. No URL fragmentation.**

```mdx
---
slug: risk-tiering
title: AI Risk Tiering
personas: { exec: true, engineer: true, compliance: true }
regulations:
  - source: eu-ai-act
    articles: [Art-6, Annex-III]
    relevance: core
---

import PersonaSection from '~/components/PersonaSection.astro';

## The story so far

Sigma Health just shipped a triage model. Layla, the CTO, asks: "Is this high-risk under the EU AI Act?"

<PersonaSection persona="exec">

### Why this matters to leadership

If your AI system is classified high-risk, the obligation count jumps from ~3 to ~25. Budget, headcount, and time-to-market all shift. Get tiering wrong upward = wasted spend; wrong downward = regulatory exposure.

</PersonaSection>

<PersonaSection persona="engineer">

### What this means in the codebase

You'll need disaggregated evaluation metrics (subgroup performance), a model card per Annex IV, and a logged evaluation pipeline. Most of this is one well-named MLflow project.

```python
# Example: subgroup metrics
for subgroup in protected_groups:
    metrics[subgroup] = evaluate(model, test_data[subgroup])
```

</PersonaSection>

<PersonaSection persona="compliance">

### The legal/audit view

Tiering is the trigger for Annex IV documentation. Maintain a written tiering rationale per system; it becomes the first page of the technical file an authority will ask for.

</PersonaSection>

## What the regulation actually says

The EU AI Act defines "high-risk" in Article 6 by reference to Annex III...
```

**Single page strategy benefits:**
- One URL per topic (`/stages/risk-tiering/`) — citations are stable regardless of which lens the chat user prefers.
- Search (Pagefind) indexes all three lenses in one entry, so a query "Annex IV" matches whether it's in the engineer or compliance section.
- Embeddings cover all persona content, so the chat can pull from any lens.
- Editing one file = updating all three lenses simultaneously — no drift.

**Client-side switching:**
- `<PersonaSwitch>` (Astro component in the site header) sets `data-persona="exec|engineer|compliance|all"` on `<html>` via a 0.5KB inline script.
- `<PersonaSection>` renders as `<section data-for-persona="exec">` with `[data-persona]:not([data-persona="all"]) [data-for-persona]:not([data-for-persona="${chosen}"]) { display: none }` in CSS.
- No JS hydration cost beyond the tiny setter. Pre-render shows all sections (good for SEO and no-JS users).
- Preference persists in `localStorage` so the lens follows the user across pages.

**URL strategy:**
- Canonical URL: `/stages/risk-tiering/` (no persona in URL).
- Optional `?lens=engineer` query for share-links to lens-pinned views — read once on load, replaces the localStorage preference for that session.
- No `/stages/risk-tiering/engineer/` URLs — avoid 3× the URL space, 3× the citation surface, 3× the SEO duplication problem.

---

## Build Order / Data Flow

### Cold build (full site from scratch)

```
1. install deps              (pnpm install)
2. validate content          (astro check + zod schema validation via content config)
3. build matrix.json         (lib/build-matrix.ts → committed file; CI verifies match)
4. build changes.json        (git log --follow per file → ephemeral)
5. build diffs               (jsdiff over all snapshots → ephemeral)
6. astro build               (MDX → HTML, Pagefind index, RSS, sitemap)
7. axe + lighthouse          (PR check; deploy gate)
8. deploy site               (gh-pages branch or actions/deploy-pages)
```

### Content-merge incremental flow

```
PR merges to main
   │
   ├─ deploy-site.yml triggers (always)
   │    └─ steps 2-8 above
   │
   ├─ reindex-vectors.yml triggers IF apps/site/src/content/** changed
   │    └─ diff-since → chunk → embed → upsert
   │
   └─ deploy-worker.yml triggers IF apps/chat-worker/** changed
        └─ wrangler deploy
```

Deploy of site and Worker are **decoupled** by design:
- A content-only change: site redeploys, vectors reindex, Worker untouched.
- A Worker-only change (e.g., prompt tuning): Worker redeploys, site untouched, vectors untouched.
- A schema change in `packages/shared` that affects both: both redeploy independently because the path filter on each workflow catches it (via `packages/shared/**`).

### Chat-request flow (read-only)

```
browser POST /chat { messages: [...] }
   │
   ▼
Worker
  1. rate-limit check (KV)                           ~1ms
  2. embed last user message (Workers AI BGE)        ~50ms (same zone)
  3. Vectorize.query(embedding, topK: 8)             ~30ms
  4. fetch each chunk's metadata + body              ~5ms (metadata is inline)
  5. build prompt: system + cached retrievals + user
  6. anthropic.messages.stream({ system: cached, ... })
                                                     ~700ms to first token (Haiku 4.5)
  7. pipe SSE to client, inject citations into stream
   │
   ▼
browser renders streaming markdown + citation chips
   citation chip "EU AI Act Art 11" links to /regulations/eu-ai-act/2026-05-22/#art-11
   citation chip "Risk Tiering" links to /stages/risk-tiering/#high-risk-categories
```

**Cold start budget:** Workers V8 isolates start in <1ms, so cold start is not the bottleneck. The bottleneck is Claude's TTFT (~500-1000ms with prompt caching warm). The architecture does *nothing* in the Worker that requires bundle-time embedding lookup — keeping the Worker bundle small (~200KB) and the heavy data in Vectorize.

---

## Component Boundaries — What Talks to What

| From | To | Channel | Notes |
|------|----|---------|-------|
| `apps/site` (build) | `packages/shared` schemas | direct import | Zod schemas validate content collections |
| `apps/site` (build) | git (filesystem) | `simple-git` lib | for changes.json + diff generation |
| `apps/site` (runtime, browser) | `apps/chat-worker` | HTTPS POST + SSE | Only network call from the static site |
| `apps/chat-worker` | Cloudflare AI binding | env binding | embed query, no auth, in-zone |
| `apps/chat-worker` | Cloudflare Vectorize binding | env binding | retrieve top-k, no auth, in-zone |
| `apps/chat-worker` | Anthropic API | HTTPS | Worker has `ANTHROPIC_API_KEY` secret |
| `apps/chat-worker` | `packages/shared` types | direct import | shared chunk metadata shape |
| `apps/pipeline` | source websites | fetch / playwright | scraping |
| `apps/pipeline` | git | filesystem writes + `git` CLI | commits snapshots + AI-drafted topic edits |
| `apps/pipeline` | GitHub | `gh` CLI | opens PRs |
| `apps/pipeline` | Anthropic API | HTTPS | AI-drafts topic-page updates |
| `packages/embed-cli` (CI) | Workers AI REST | HTTPS | embeds chunks |
| `packages/embed-cli` (CI) | Vectorize REST | HTTPS | upserts vectors |
| `packages/embed-cli` (CI) | git | filesystem reads | reads changed files |

**Boundaries the architecture forbids:**
- `apps/chat-worker` never writes to git, never opens PRs, never calls Anthropic for anything except generation.
- `apps/site` never makes a runtime network call other than to `/chat` (no analytics, no font CDN, no third-party JS).
- `apps/pipeline` never reads Vectorize and never writes to it (reindex is a separate workflow with separate secrets — least privilege).

---

## Detecting "What Changed Since Last Run"

**Git is the source of truth, not a database.**

For each scraped source, the pipeline runner does:

```typescript
// pseudo
const latestSnapshot = readMostRecentSnapshotFile(`regulations/${source}/snapshots/`);
const freshPage = await fetchAndCleanToMarkdown(sourceUrl);

if (semanticDiff(latestSnapshot.body, freshPage.body).meaningful) {
  const today = isoDate();
  writeFile(`regulations/${source}/snapshots/${today}.md`, freshPage);
  updateIndexFile(`regulations/${source}/index.md`, freshPage);
  await openPR({ branch: `auto/regs/${source}/${today}`, ... });
}
```

**Why filesystem-as-state, not a sidecar DB:**
- Zero infra. The "last seen" state lives in `git log -1 -- regulations/<source>/snapshots/`.
- Trivially reproducible: any developer can `git clone && pnpm pipeline run eu-ai-act` and get the same behavior as CI.
- Audit trail is free: every snapshot is signed by the CI commit.

**Edge case — source URL changed but content is identical:** the pipeline keeps a tiny `regulations/<source>/sources.yml` of canonical URLs (rarely edited by hand). Source URL changes don't trigger snapshot churn unless content also changed.

---

## Component-by-Component Summary

| Component | Language/Runtime | Deploy Unit | Lifecycle | Owns |
|-----------|------------------|-------------|-----------|------|
| `apps/site` | TS + Astro 6, Node 22 build | Static HTML/JS bundle → GitHub Pages | Build-time | Rendering, matrix/changes derivation, persona switching, wizard UI, chat widget shell, diff viewer |
| `apps/chat-worker` | TS, Cloudflare Worker (V8 isolate) | Worker → `chat.aigov.io` | On-request | RAG retrieval, Claude streaming, rate limiting, query embedding |
| `apps/pipeline` | TS + Node 22 | GitHub Actions runner | Scheduled cron + manual | Scrape, clean, diff, AI-draft, PR creation |
| `packages/shared` | TS (library) | npm workspace package | Build-time import | All Zod schemas, TS types, URL builder, persona constants |
| `packages/embed-cli` | TS + Node 22 | GitHub Actions runner (separate job) | On content merge | Chunking, embedding via Workers AI REST, Vectorize upsert |
| `content/` | Markdown + MDX + YAML | Part of `apps/site` | Git-tracked | Source of truth for narrative, regulations, glossary, stories |
| `content/data/matrix.json` | Generated JSON | Part of `apps/site` | Build artifact (committed) | Bidirectional topic↔regulation index |
| `content/data/wizard.json` | Hand-authored JSON | Part of `apps/site` | Edited like content | Decision tree |

---

## Architectural Patterns

### Pattern 1: Frontmatter as Schema-Validated Contract

**What:** Every content file has Zod-validated frontmatter. Schemas live in `packages/shared` and are imported by both the site build (via Astro content config) and the pipeline (for AI-draft validation).

**When:** Always, for every new collection.

**Trade-offs:**
- Pro: AI drafts can be validated against the schema before PR creation — invalid frontmatter never reaches review.
- Pro: Renaming a frontmatter field is a typed refactor across site and pipeline.
- Con: Adding a field requires touching the schema, which means a coordinated edit. Worth it.

### Pattern 2: Build-Generated Derived Data, Committed for Visibility

**What:** Derived JSON (`matrix.json`) is committed alongside source content. A CI check rebuilds and verifies it matches.

**When to use:** When the derived artifact is small (<1MB), has high signal in code review, and is read by client code.

**Trade-offs:**
- Pro: Reviewers see the matrix diff alongside frontmatter edits.
- Pro: Client doesn't need to recompute or fetch.
- Con: A `pre-commit` hook (or just CI check) is required to prevent drift. Acceptable.

### Pattern 3: Per-Source File Scoping for AI PRs

**What:** Every scheduled PR is scoped to a single source's directory plus at most one stage page. No two automated PRs can touch the same file because they're scoped to disjoint directories.

**When:** Always, for any system where multiple bots write to the same repo.

**Trade-offs:**
- Pro: Eliminates merge conflicts between automated PRs.
- Pro: Reviewer scope is narrow — review one source at a time.
- Con: A single semantic change spanning two sources (e.g., a new ISO+NIST alignment) needs two PRs. Document this in the contributor guide.

### Pattern 4: Read-Only Worker, CI-Only Writer

**What:** The Worker only reads from Vectorize. All writes happen in a separate CI workflow with separate secrets.

**When:** Any system where the read path is on the user critical path and the write path is batch.

**Trade-offs:**
- Pro: A bug in the Worker can never corrupt the vector store.
- Pro: Embedding key (which has write scope) is never present in the Worker bundle.
- Con: Reindex latency = "time from merge to next deploy", typically 1-3 minutes. Acceptable.

### Pattern 5: Lens-as-CSS, Not Lens-as-URL

**What:** Persona switching is a CSS visibility toggle driven by a `data-persona` attribute. One MDX file per topic.

**When:** Multi-audience content where lenses are slices of the same canonical story.

**Trade-offs:**
- Pro: Single source of truth — edit once, all lenses update.
- Pro: Stable URLs for citation.
- Con: Total page weight is the sum of all three lenses; users download content they may not see. For 10-20KB topic pages this is fine; for larger pages, consider lazy-loading per persona via `client:visible`.

---

## Data Flow Diagrams

### Site Build

```
content/stages/*.mdx ──┐
content/regulations/* ─┤
content/vendor/* ──────┤── astro:content getCollection()
content/glossary/* ────┤
content/stories/* ─────┘
                          │
                          ▼
              lib/build-matrix.ts ────▶ data/matrix.json (compared to committed)
                          │
                          ▼
              lib/build-changes.ts (git log) ──▶ ephemeral changes.json
                          │
                          ▼
              lib/git-diff.ts (jsdiff) ──▶ ephemeral *.diff.json per snapshot
                          │
                          ▼
                  Astro 6 build
                  - render MDX with PersonaSection
                  - Starlight sidebar/nav/search index (Pagefind)
                  - Mermaid SSR for journey diagram
                  - sitemap, RSS feed
                          │
                          ▼
                  dist/ ──▶ GitHub Pages
```

### Scheduled Pipeline (per source group)

```
cron fires (e.g., scrape-eu-uk.yml)
  │
  ▼
pipeline/run.ts --group eu-uk
  │
  ▼
for source in [eu-ai-act, ico-uk, fca, mhra]:
  try:
    raw = fetch(sourceUrl)                       (cheerio first)
    md = cleanToMarkdown(raw)
    prev = readLatestSnapshot(source)
    diff = semanticDiff(prev, md)
    if not diff.meaningful: continue
    today = today()
    writeSnapshot(source, today, md)
    draftEdits = await claude.draftTopicUpdates(diff, relatedStages(source))
    applyEdits(draftEdits)
    git.add(...); git.commit(`regs(${source}): snapshot ${today}`)
    git.push(`auto/regs/${source}/${today}`)
    gh pr create --head auto/regs/${source}/${today} --body ...
  catch (e):
    postSlackOrIssue(`pipeline failure: ${source}`, e)
    continue
```

### Chat Request

```
User types message
  │
  ▼
ChatWidget.tsx (browser island)
  │
  │ POST /chat
  ▼
Worker (Hono /chat route)
  ├─ rate-limit check (KV sliding window by IP)
  ├─ embed query   (env.AI.run('@cf/baai/bge-base-en-v1.5'))
  ├─ retrieve k=8  (env.VECTORIZE.query(emb, { topK: 8, returnMetadata: 'all' }))
  ├─ build prompt:
  │   - system (cached): "You answer AI governance questions. Cite [source:url]..."
  │   - retrieved chunks (cached when popular): each with metadata
  │   - user message
  ├─ anthropic.messages.stream(...)
  └─ pipe SSE → browser
       │
       ▼
ChatWidget renders streaming markdown
  - parses [source:url] tags into clickable chips
  - chips link to /stages/.../#anchor (always valid because URLs are stable)
```

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–500 chat sessions/day | Default architecture. Free tier covers everything. |
| 500–5K chat sessions/day | Watch Anthropic spend (~$5–30/mo). Aggressive prompt caching on system + top-20 chunks. Consider adding semantic cache (hash query → cached response) in Worker KV. |
| 5K–50K chat sessions/day | Move off Workers free tier ($5/mo Workers Paid). Vectorize still free. Consider per-IP rate limit lowering. |
| 50K+ chat sessions/day | Probably means the site has product-market fit. Add CDN-level cache for the chat endpoint's prelude (cache the embedding step for repeated queries via Cache API). |
| 30+ regulation sources | Pipeline groups stay at ~4. Add per-source flags in `sources.yml` (active: bool, schedule: cron). |
| 50+ stages (extension domain) | Matrix build is O(stages × regs); still <100ms at 100 stages × 30 sources. No change. |

**First bottleneck:** Anthropic token spend if chat usage grows. Mitigate with prompt caching + Haiku-first / Sonnet-on-demand routing.

**Second bottleneck:** GitHub Actions monthly minutes if the pipeline grows or PR builds take longer. Mitigate by caching pnpm + Playwright browsers in Actions cache.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Persona as URL-namespaced pages

**Mistake:** `/exec/stages/risk-tiering/` + `/engineer/stages/risk-tiering/` + `/compliance/stages/risk-tiering/`.

**Why wrong:** Triples the citation surface, splits SEO, requires three copies of every link in the matrix, and a chat citation to the "wrong" persona's URL feels broken.

**Instead:** One canonical URL per topic, lens chosen client-side.

### Anti-Pattern 2: Storing regulation source-of-truth in a database

**Mistake:** "Let's use SQLite or D1 to track regulation snapshots — it'll be easier to query."

**Why wrong:** Breaks the "git = source of truth" model, breaks reproducible builds, requires a write path from CI, requires backup. Adds infra for a problem `git log` already solves.

**Instead:** Dated markdown files + git.

### Anti-Pattern 3: AI drafts that auto-update the matrix

**Mistake:** Pipeline opens a PR that updates `matrix.json` alongside topic edits.

**Why wrong:** `matrix.json` is *derived*. If AI edits it, the next `matrix-check.yml` run will fail (or worse, AI's drift becomes the new truth). Sources of truth and derived artifacts must never cross.

**Instead:** AI only edits frontmatter `regulations:` field. Matrix rebuilds at deploy time from canonical frontmatter.

### Anti-Pattern 4: Inline regulation text in topic pages

**Mistake:** Embedding the actual Article 11 text inside `stages/documentation.mdx`.

**Why wrong:** When the regulation changes, three things must update in lockstep; the pipeline now has to touch topic pages just because a regulation moved a comma. Stale content compounds.

**Instead:** Reference the regulation file. Use `<RegQuote source="eu-ai-act" article="Art-11" />` component that pulls from the latest snapshot at build time. One source, many surfaces.

### Anti-Pattern 5: Diffing raw HTML

**Mistake:** Save the raw HTML page each scrape and diff that.

**Why wrong:** Tracking changes turns into tracking CSS class shuffles, ad code injections, and analytics tag updates. Signal-to-noise collapses; reviewers stop trusting the pipeline.

**Instead:** Diff cleaned markdown after rehype/remark normalization. Strip nav, footer, ads, tracking scripts before diffing.

### Anti-Pattern 6: Embedding runtime in the Worker

**Mistake:** "Let's regenerate embeddings on Worker cold start so they're always fresh."

**Why wrong:** Worker CPU limits, free-tier neuron limits, cold start time, and re-embedding the same chunks on every isolate restart all break.

**Instead:** Reindex in CI on content merge. The Worker only reads.

### Anti-Pattern 7: Mixing wizard logic into the matrix

**Mistake:** Encode wizard rules inside `matrix.json` so the wizard "just queries the matrix."

**Why wrong:** The matrix represents real semantic facts (topic X cites regulation Y). The wizard represents an opinionated path through those facts. Mixing them means changing the wizard requires editing every topic's frontmatter.

**Instead:** Keep `matrix.json` as the facts, `wizard.json` as the opinion. The wizard *reads* the matrix to populate citations in its checklist outputs.

---

## Integration Points

### External Services

| Service | Integration | Notes |
|---------|------------|-------|
| Anthropic Claude API | HTTPS from Worker + pipeline | Worker uses streaming + prompt caching; pipeline uses non-streaming for AI-draft. Secrets: `ANTHROPIC_API_KEY`. |
| Cloudflare Workers AI | env binding (Worker) + REST (CI) | Worker uses binding (no API key); CI uses REST with `CLOUDFLARE_API_TOKEN`. |
| Cloudflare Vectorize | env binding (Worker) + REST (CI) | Read in Worker, write in CI. |
| GitHub API | `gh` CLI in Actions | For opening PRs. Uses `GITHUB_TOKEN` provided by Actions. |
| Source websites (~30 sources) | `fetch` (most) + Playwright (few) | All read-only, no auth. User-Agent: `aigov-bot/1.0 (+https://aigov.io/about)`. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Browser ↔ Worker | HTTPS POST + SSE | Only runtime integration. CORS allowlists the site origin. |
| Worker ↔ Vectorize | env binding | In-zone, no network hop visible to ops. |
| Site build ↔ shared schemas | TS import (workspace) | No runtime cost; build-time only. |
| Pipeline ↔ shared schemas | TS import (workspace) | Same. |
| Pipeline ↔ git | shell + simple-git | Pipeline holds a checkout, mutates files, commits, pushes. |
| Embed CLI ↔ Vectorize | HTTPS REST | Separate from Worker path; uses a different token. |
| matrix builder ↔ content | astro:content getCollection | Synchronous, build-time only. |

---

## Quality-Gate Verification

- [x] **Components clearly defined with boundaries** — see "Component Responsibilities" + "Component Boundaries" tables.
- [x] **Data flow direction explicit for: site build, scheduled pipeline, chat request** — three diagrams in "Data Flow Diagrams" section.
- [x] **Build order implications noted** — see "Build Order / Data Flow" cold-build sequence.
- [x] **Repo directory tree proposed** — full tree in "Repository Layout".
- [x] **Topic ↔ regulation matrix design has concrete proposal** — frontmatter-authored, reverse-indexed at build, committed for review; "Topic ↔ Regulation Bidirectional Matrix" section.
- [x] **Pipeline PR strategy avoids stomping** — three-layer defense (concurrency groups, per-source branches, file-scope isolation); see "Pipeline Orchestration".
- [x] **Embeddings strategy resolved** — generated in CI on content change, stored in Vectorize, citations preserved via stable slugs + chunk metadata + redirect map; see "Embeddings Pipeline for RAG".

---

## Sources

**Astro / Starlight / Content Collections**
- [Astro 6 + Cloudflare Workers quickstart (Zenn)](https://zenn.dev/miyabitti/articles/92a3e2e94356c1?locale=en) — Astro 6 monorepo template with Cloudflare
- [Astro Content Collections API Reference](https://docs.astro.build/en/reference/modules/astro-content/) — `reference()` for cross-collection links
- [Astro Zod API Reference](https://docs.astro.build/en/reference/modules/astro-zod/) — schema patterns for frontmatter
- [Organizing Content with Astro Content Schemas (Monica Powell)](https://aboutmonica.com/blog/organizing-astro-content-with-schemas/) — schema strategies
- [Complete Guide to Astro Content Collections (EastonDev)](https://eastondev.com/blog/en/posts/dev/20251124-astro-content-collections-guide/) — Zod patterns and references
- [Astro Monorepo Architecture (DeepWiki)](https://deepwiki.com/withastro/astro/2-monorepo-architecture) — pnpm workspace conventions
- [TypeScript Monorepo: Sharing Types Between Workers and Next.js Apps](https://www.outstand.so/blog/typescript-monorepo-setup) — workspace shared-types pattern

**Cloudflare Vectorize / Workers AI**
- [Cloudflare Vectorize Metadata Filtering](https://developers.cloudflare.com/vectorize/reference/metadata-filtering/) — namespace + metadata patterns for source attribution
- [Cloudflare Vectorize Insert Vectors Best Practices](https://developers.cloudflare.com/vectorize/best-practices/insert-vectors/) — upsert semantics
- [Cloudflare Vectorize Index Creation](https://developers.cloudflare.com/vectorize/best-practices/create-indexes/) — index design
- [Vectorize Get Started — Embeddings with Workers AI](https://developers.cloudflare.com/vectorize/get-started/embeddings/) — BGE pipeline
- [Building Vectorize on Cloudflare Developer Platform](https://blog.cloudflare.com/building-vectorize-a-distributed-vector-database-on-cloudflare-developer-platform/) — architecture rationale

**Cloudflare Workers**
- [Astro on Cloudflare Workers docs](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/) — deploy pattern
- [Workers Monorepo Template](https://github.com/jahands/workers-monorepo-template) — reference monorepo structure
- [pnpm monorepo + Cloudflare gotchas (Cloudflare Community)](https://community.cloudflare.com/t/dependencies-between-pnpm-monorepo-cannot-be-resolved/690458) — workspace edge cases

**Git-based content versioning**
- [GitLab Handbook frontmatter docs](https://handbook.gitlab.com/docs/frontmatter/) — `lastMeaningfulChange` pattern with status bar
- [git-cliff changelog generator](https://git-cliff.org/) — git-driven change extraction patterns
- [GitHub Docs YAML frontmatter conventions](https://docs.github.com/en/contributing/writing-for-github-docs/using-yaml-frontmatter) — fields and validation

**GitHub Actions PR orchestration**
- [GitHub Actions auto-update PR + conflict detection (community)](https://github.com/orgs/community/discussions/166932) — concurrency group patterns
- [GitHub Actions and Merge Conflicts: Comprehensive Guide (Medium)](https://medium.com/@FartsyRainbowOctopus/github-actions-and-merge-conflicts-a-comprehensive-analysis-and-definitive-guide-to-unlocking-54fa45a38886) — file-scope isolation rationale
- [Copilot agentic workflows guide (GitHub Blog)](https://github.blog/ai-and-ml/github-copilot/from-idea-to-pr-a-guide-to-github-copilots-agentic-workflows/) — automated PR conventions

**URL stability + RAG citations**
- [URL Slug Best Practices (DevToolHub 2026)](https://devtoolhub.net/blog/url-slug-best-practices/) — slug-based redirects
- [URL to Markdown for LLM & RAG: Complete Guide (SearchCans 2026)](https://www.searchcans.com/blog/ultimate-guide-url-markdown-llm-rag-2026/) — citation preservation patterns
- [Front-Matter Standard for AI Crawlers (TrySteakhouse)](https://blog.trysteakhouse.com/blog/front-matter-standard-using-yaml-metadata-programmatically-control-crawler-behavior) — frontmatter as RAG metadata

**Stack baseline**
- [Existing STACK.md research](/Users/anand/AIgov/.planning/research/STACK.md) — Astro 6 + Starlight + Cloudflare picks validated upstream

---

*Architecture research for: AI Governance knowledge site + RAG chat*
*Researched: 2026-05-24*
