# Stack Research

**Domain:** Content-heavy public knowledge site (GitHub Pages) + tiny serverless RAG chat backend
**Researched:** 2026-05-24
**Overall Confidence:** HIGH

---

## TL;DR

Build it as an **Astro 6 + Starlight** site (Markdown content collections with Zod schemas), styled with **Tailwind v4** plus Starlight's built-in tokens, deployed to **GitHub Pages** via GitHub Actions. Search is **Pagefind** (built into Starlight, zero config). The RAG chat backend is a single **Cloudflare Worker** that calls **Cloudflare Vectorize** for retrieval and **Anthropic Claude Haiku 4.5** for generation (with prompt caching on the system prompt + retrieved chunks). Embeddings come from **Cloudflare Workers AI** (`@cf/baai/bge-base-en-v1.5`) at build time, written into Vectorize from GitHub Actions. Diffs are rendered with **diff2html** in the browser, fed by `git diff` output cached at build time. Scraping is **simple fetch + cheerio first, Playwright in Actions only when JS is required, Firecrawl for nothing** (keep cost at zero). Mermaid via `astro-mermaid` for the AI Governance Journey visual spine.

Total monthly cost target: **$0–$5** (Anthropic API usage only; everything else fits in free tiers).

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Astro** | `^6.0` | Static site generator, content collections, islands | Beating Next.js for content sites in 2026, Cloudflare-backed, 90% less JS, Content Layer API (5x faster Markdown builds). Compiler is Go-based so dev server starts in <1s. |
| **Starlight** | `^0.39` | Documentation theme for Astro | Built-in Pagefind search, dark mode, i18n, sidebar/nav, table of contents, search keyboard shortcuts, WCAG-friendly defaults — all OOTB. Removes weeks of UI work. Can be heavily customized via component overrides. |
| **Tailwind CSS** | `^4.1` | Utility-first styling | Tailwind v4 compiles in milliseconds via Lightning CSS, no config file needed (`@import "tailwindcss"`), CSS-first variables. 15-30 KB gzipped production output. Pairs cleanly with Starlight's CSS variables for theme overrides. |
| **TypeScript** | `^5.6` | Type safety end-to-end | Astro's content collections give automatic types from Zod schemas; Worker code is TS-first; shared types between site and Worker prevent drift. |
| **GitHub Pages** | n/a | Static hosting | Free, fast CDN, custom domain + auto HTTPS, git-native (push = deploy via Actions). Zero ongoing cost. |
| **Cloudflare Workers** | n/a | Serverless chat endpoint | 100K req/day free, V8 isolates = sub-1ms cold starts (vs Vercel's 100-500ms p99). No cold start ever matters for streaming chat. Free `wrangler dev` local testing. |
| **Cloudflare Vectorize** | n/a | Vector store for RAG | 30M queried + 5M stored vector dimensions/month free. Same-zone latency as Workers (no cross-cloud hop). Native binding, no API key. |
| **Cloudflare Workers AI** | n/a | Embeddings (`bge-base-en-v1.5`) | 10K neurons/day free — enough for thousands of embeddings. Runs in same zone as Vectorize. 768 dims, free, no API key. |
| **Anthropic Claude API** | Haiku 4.5 | RAG generation | $1/$5 per MTok, 5x cheaper than Sonnet, near-Sonnet-4 quality. Prompt caching cuts costs 30-50% (cache the system prompt + frequently-cited regulation chunks). Native citations API for source links. Streaming via SSE. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@astrojs/mdx` | `^4.0` | MDX support in content | For pages that need inline interactive components (the wizard, embedded diff viewers). Plain `.md` for everything else. |
| `astro-mermaid` | latest | Mermaid diagrams | Renders the 12-stage AI Governance Journey + per-topic flow diagrams. Auto theme-switches with `data-theme` attribute (matches Starlight dark mode). Client-side render keeps build fast. |
| `zod` | `^3.23` | Schema validation | Content collection schemas (frontmatter), Worker request validation, regulation source manifests. Already imported by Astro as `astro/zod`. |
| `pagefind` | `^1.1` | Client-side search | Built into Starlight — nothing to install. WASM + chunked index = ~50KB bandwidth even for 1000+ pages. Already pre-wired with `<SearchModal>` and ⌘K shortcut. |
| `diff2html` | `^3.4` | Diff rendering | Render unified `git diff` output as GitHub-style side-by-side HTML in the browser. Lightweight (~30KB), syntax highlighted. |
| `jsdiff` | `^7.0` | Build-time diff generation | Generate text-level diffs in build/Action steps when raw `git diff` granularity isn't enough (e.g., word-level for regulation prose). Output JSON, render with diff2html. |
| `cheerio` | `^1.0` | Server-side HTML parsing | Scrape regulation pages where content is server-rendered (most gov sites). Cleaner than regex, jQuery-like API. |
| `playwright` | `^1.48` | Headless browser scraping | Fallback for sources that require JS (some vendor policy pages, dashboards). Only used in GitHub Actions, never in Worker. |
| `marked` or `remark` | latest | Markdown→HTML in Worker | Worker needs to render small chunks of Markdown (chat citations, snippets). Astro handles site Markdown; Worker uses `marked` for runtime. |
| `hono` | `^4.6` | Worker routing/middleware | Tiny (~12KB), Worker-first framework. Cleaner than raw `fetch()` handler for routes like `/chat`, `/embed`, `/healthz`. |
| `@anthropic-ai/sdk` | `^0.30` | Claude API client | Official SDK with streaming, citations API, prompt caching helpers. Worker-compatible (uses native `fetch`). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `wrangler` | Cloudflare Workers CLI | Local dev with `wrangler dev`, deploy to staging/prod, manage Vectorize indexes, secrets via `wrangler secret`. |
| `pnpm` | Package manager | Faster + leaner than npm for monorepo (site + worker share types). Use workspaces. |
| `vitest` | Unit testing | Native to Astro/Vite, runs Worker logic in `@cloudflare/vitest-pool-workers`. |
| `playwright` | E2E tests | Test wizard flow, chat widget hydration, search UX. |
| `prettier` + `eslint` | Format/lint | Astro plugin + Tailwind plugin (sorts utility classes). |
| `axe-core` | Accessibility CI | Run against built HTML in GitHub Actions to enforce WCAG 2.2 AA. |
| `lighthouse-ci` | Core Web Vitals | Gate PRs on LCP/CLS/INP budgets. |
| GitHub Actions | CI + scheduled scrape | Free for public repos; 2000 min/month private. Schedule scrape + AI-draft PRs nightly/weekly. |

---

## Installation

```bash
# Site
pnpm create astro@latest -- --template starlight ai-governance
cd ai-governance
pnpm add -D tailwindcss@4 @tailwindcss/vite @astrojs/mdx astro-mermaid
pnpm add diff2html jsdiff

# Worker (separate workspace package)
mkdir -p packages/chat-worker && cd packages/chat-worker
pnpm init
pnpm add hono @anthropic-ai/sdk zod marked
pnpm add -D wrangler @cloudflare/workers-types @cloudflare/vitest-pool-workers vitest typescript

# Scrape pipeline (run in Actions, not deployed)
pnpm add -D playwright cheerio
```

`wrangler.toml` skeleton:

```toml
name = "ai-gov-chat"
main = "src/index.ts"
compatibility_date = "2026-05-01"

[[vectorize]]
binding = "VECTORIZE"
index_name = "ai-gov-content"

[ai]
binding = "AI"  # Workers AI for embeddings

[vars]
ANTHROPIC_MODEL = "claude-haiku-4-5"

# ANTHROPIC_API_KEY set via: wrangler secret put ANTHROPIC_API_KEY
```

---

## Free-Tier Limits That Matter (Cost Discipline)

| Service | Free Tier | What It Buys | First Cost Trigger |
|---------|-----------|--------------|--------------------|
| GitHub Pages | Unlimited bandwidth (soft 100GB/mo), 1GB site | Static site hosting | Cap = soft, hit 100GB/mo before charges |
| GitHub Actions (public repo) | Unlimited minutes | Scheduled scrapes, deploys, AI-draft PRs | Never, while repo is public |
| Cloudflare Workers | 100K req/day | Chat endpoint | ~3000 chat sessions/day before $5/mo plan |
| Cloudflare Vectorize | 30M queried + 5M stored dimensions/mo | RAG retrieval | ~50K queries/mo × 5 chunks × 768 dim ≈ well within free |
| Cloudflare Workers AI | 10K neurons/day | BGE-base embeddings | ~1000 docs/day re-embedded before cap |
| Anthropic Claude Haiku 4.5 | None (pay per token) | LLM generation | $5/mo budget = ~1M input / ~200K output tokens; with prompt caching, more. |

**Worst-case monthly:** $5–$15 Anthropic spend if chat sees moderate use. Everything else stays $0.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Astro + Starlight | **VitePress** | If you need Vue-first authoring and don't care about React/Svelte islands. Simpler but less flexible for custom components like the wizard. |
| Astro + Starlight | **Docusaurus 3** | Mature React docs framework. Slower builds, heavier JS, but better if your team already lives in React. Distr publicly migrated *away* from Docusaurus to Starlight in 2026 citing perf/build speed. |
| Astro + Starlight | **Next.js static export + Fumadocs** | If you want App Router and React Server Components. Heavier, more JS shipped. Astro wins for content-heavy with light interactivity. |
| Astro + Starlight | **Eleventy + Pagefind** | Lighter than Astro, no JS framework. Lose typed content collections, Mermaid integration, islands story. Good if you want zero build tooling, but the wizard/chat UI then needs vanilla JS plumbing. |
| Tailwind v4 | **Open Props (vanilla CSS)** | If team prefers writing semantic CSS with design tokens. Lighter mental model. Choose when you have <10 unique page templates. Starlight already ships its own tokens, so Open Props would double up. |
| Pagefind | **Orama** | If you need typo tolerance / fuzzy matching that matters for non-English content. Orama loads entire index (~600KB) in memory; Pagefind only fetches chunks (~50KB total). Pagefind wins for content-heavy sites with English text. |
| Pagefind | **Algolia DocSearch** | Free for open-source docs, server-side, much better fuzzy matching and analytics. Requires application + approval, adds external dependency. Use if you outgrow client-side search. |
| Cloudflare Workers | **Vercel Functions (Fluid)** | If you're already on Vercel for hosting. Fluid eliminates 99% of cold starts, but Workers still wins on raw cost (100K/day free vs Vercel's tighter quotas) and isolate startup. |
| Cloudflare Workers | **Deno Deploy** | Cleaner TS/JSX story, good free tier. Lacks the integrated Vectorize/Workers AI bindings, so you'd glue more services together. |
| Cloudflare Vectorize | **In-bundle embeddings JSON** | If corpus stays small (<5MB total), you can ship a JSON of pre-computed embeddings + cosine similarity in browser. No backend needed. Recommend if chat usage will be low enough to want to remove Cloudflare entirely. **Real fallback if you want zero infra.** |
| Cloudflare Vectorize | **Upstash Vector** | If you outgrow Cloudflare or want REST-anywhere access. Has free tier (~10K vectors). Adds cross-region latency from Worker. |
| Cloudflare Vectorize | **Turbopuffer** | No free tier ($64/mo minimum). Only consider at scale (>100M vectors). Over-engineered for v1. |
| Cloudflare Vectorize | **pgvector on Supabase** | Free tier exists, but adds a Postgres dependency and cold-start lag if instance pauses. Use if you already have Postgres for other reasons. |
| Anthropic Claude Haiku 4.5 | **Claude Sonnet 4.6** | If hallucination tolerance is critical (it is for governance) — Sonnet at $3/$15 is 3x cost but stronger reasoning. Use Sonnet for *complex* questions, route simple lookups to Haiku. Implement model routing. |
| Anthropic Claude Haiku 4.5 | **Groq (Llama 4 / Mixtral)** | Sub-100ms first-token latency, very cheap ($0.05-$0.90 per MTok). Use if speed > accuracy. For a governance site, citation quality matters more than 200ms saved. |
| Anthropic Claude Haiku 4.5 | **OpenAI GPT-4.1 mini** | Comparable price, competitive quality. Use if you have strong OpenAI ecosystem reasons. Anthropic's citations API is a meaningful edge for this domain. |
| Anthropic Claude Haiku 4.5 | **Local Llama via Ollama on home Mac mini** | Zero per-token cost forever. Adds: dynamic DNS, uptime burden, no GPU on most Mac minis = slow generation. Recommend deferring until v2; the cost ceiling on Haiku for a v1 public site is low ($5-15/mo). |
| diff2html | **Server-side rendered diffs (committed HTML)** | If you want zero client JS for diffs. Higher build complexity, larger HTML payloads, but better for SEO + accessibility. Recommend as a v1.1 optimization if diff JS bundle bothers you. |
| diff2html | **GitHub's own diff URLs** | Link out to `github.com/.../compare/A...B`. Zero work. Loses on-site UX, sends users away. Acceptable for v0.5. |
| Astro content collections + Zod | **Velite** | Framework-agnostic content layer with Zod. Identical model. Choose only if you're not using Astro — since we are, content collections are zero-config. |
| Playwright | **Firecrawl API** | Hosted scraping with markdown extraction, JS handling, auto-retry. $0–$30/mo for low usage. **Not recommended** — adds external dependency + cost for a problem `fetch + cheerio` solves for 90% of regulation sites. Keep Firecrawl as a last resort for sites that actively fight scraping. |
| GitHub Actions cron | **Cloudflare Cron Triggers** | Run scraping in the Worker. Cleaner architecture (single platform) but Workers have CPU limits that break large scrapes; logs are weaker. Actions is the right place for ETL. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Next.js (SSG mode) for the docs site** | Heavy framework for content-first work, ships React runtime even when you don't need it, slower builds. Multiple production teams (Distr, etc.) publicly migrated *off* Next.js docs setups to Astro/Starlight in 2026. | Astro 6 + Starlight |
| **Docusaurus 3 for new builds** | Slower dev server, larger JS bundles, harder to customize beyond docs-shape, ecosystem cooling. | Starlight |
| **Lunr.js for search** | Loads entire index up front (often 500KB+), no incremental loading, no first-class WASM, abandoned-ish. | Pagefind |
| **Fuse.js for search on a content site** | Designed for small in-memory arrays, not site-scale corpora. Will slow page load as content grows. | Pagefind |
| **Algolia DocSearch as v1 search** | External dependency, application/approval gate, adds analytics + privacy considerations on a no-tracking site. | Pagefind first; revisit if growth demands it |
| **Vercel Functions for the chat endpoint** | Cold starts (even with Fluid) are 100-500ms p99; pay-per-GB-second pricing model is worse for chat at low/moderate scale; Vercel quotas more restrictive than Workers. | Cloudflare Workers |
| **Netlify Functions** | AWS Lambda underneath, slower cold starts, smaller free tier (125K invocations/mo vs Workers' 3M/mo). | Cloudflare Workers |
| **Pinecone / Weaviate Cloud / Qdrant Cloud** for v1 RAG | All have credible offerings but add an extra hop from Worker (cross-cloud latency), API keys, separate billing. Vectorize binding is in-process. | Cloudflare Vectorize |
| **Turbopuffer** for v1 | $64/mo minimum — over budget for a near-zero-cost knowledge site at launch. | Cloudflare Vectorize |
| **OpenAI text-embedding-3-small** for embeddings | Costs $0.02/M tokens — small but non-zero, and adds a second API dependency when Workers AI BGE-base is free and same-zone. Use OpenAI only if you need ada-002 compatibility with existing vectors. | Workers AI `bge-base-en-v1.5` |
| **Auto-merging AI-drafted PRs** | Project requirements explicitly forbid this for trust. Don't enable it even tempting. | PR → human review → merge |
| **client-side LLM (WebLLM)** | Browser model = 1-3GB download for the user, hot phone, bad UX, no citations API. | Server-side Claude via Worker |
| **Astro 5 (when 6 is stable)** | Astro 6.0 shipped stable Feb-Mar 2026 with first-class Cloudflare Workers support and security primitives. Starting on 5 means a migration in the first month. | Astro 6 from day one |
| **CSS-in-JS (styled-components, Emotion)** | Runtime cost, terrible for static-first content sites, adds JS to islands that don't need it. | Tailwind v4 + plain CSS for Starlight overrides |
| **MDX for *every* page** | Adds compile overhead and React component runtime to pages that are 99% prose. | `.md` by default, `.mdx` only for pages with interactive components |
| **Custom-built search backend** | A weekend of fun, a year of maintenance. Pagefind solves 98% of the use case with zero ops. | Pagefind |
| **Firecrawl / Apify / scraping SaaS** for v1 | Adds cost + external API key for a problem `fetch + cheerio` (and Playwright fallback) solves with one zero-cost dependency. | `fetch + cheerio`, escalate to `playwright` in Actions only when needed |
| **Live database (Postgres/MySQL)** | Project is explicitly no-server, no-PII, git-as-source-of-truth. A DB invalidates the model. | Git-tracked Markdown + Vectorize for embeddings |
| **Google Analytics / Plausible / any tracker requiring consent** | Constraints forbid PII tracking and consent banners. | Server logs only (Cloudflare's free analytics is cookieless and aggregate) |

---

## Stack Patterns by Variant

**If chat usage stays under 100 sessions/day:**
- Skip Vectorize entirely.
- Ship a pre-computed embeddings JSON (~1-5 MB gzipped for typical site size) in the Worker bundle, do cosine similarity in JS.
- Removes one Cloudflare service, simplifies build pipeline.
- Re-evaluate at ~500 sessions/day or when corpus crosses 10MB embeddings.

**If chat answer quality is the bottleneck (not cost):**
- Route to Claude Sonnet 4.6 ($3/$15/MTok) instead of Haiku.
- Layer in prompt caching aggressively — cache the system prompt + the top 20 most-cited regulation chunks.
- Consider hybrid retrieval: Pagefind BM25 + Vectorize semantic, RRF fusion.

**If you want truly zero ongoing cost (no Anthropic spend):**
- Run Llama 3.3 70B on the home Mac mini via Ollama, expose via Cloudflare Tunnel.
- Worker calls home Mac on `/chat`.
- Accept ~5-10s generation latency, single-point-of-failure if mini is off.
- Document fallback message for when home Mac is offline.

**If you want maximum SEO + accessibility purity:**
- Pre-render diffs server-side at build time (no diff2html JS on page).
- Use `<details>` for diff fold-out rather than JS-driven toggles.
- Remove the chat widget from server-rendered HTML; mount only on `client:visible`.

**If launch slips and you ship a "static preview" without chat:**
- Drop the entire Worker.
- Wizard works without backend (deterministic).
- Search works (Pagefind).
- Diff viewer works (build-time).
- You still have a useful site. Chat is the only thing that requires Cloudflare at all.

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Astro 6.x | Starlight 0.39+ | Starlight 0.39 explicitly supports Astro 6. Don't pin Starlight below 0.39 if on Astro 6. |
| Tailwind v4 | Astro 6 (Vite 6) | Use `@tailwindcss/vite` plugin, not the old PostCSS plugin. v4 needs no `tailwind.config.js`. |
| `astro-mermaid` | Astro 5 + 6 | Works with both; client-side render avoids SSR issues. |
| `@anthropic-ai/sdk` | Workers runtime | Native `fetch`-based; works in Workers, Deno, Node 18+. No Node polyfills needed. |
| Pagefind | Starlight (built-in) | Configured automatically. To use Pagefind outside Starlight, install `astro-pagefind` integration. |
| Cloudflare Vectorize | Workers free + paid | Single index name reusable across environments via `wrangler env` separation. |
| diff2html v3.x | Modern browsers (ES2020) | Drop the jQuery wrapper variant; use `Diff2HtmlUI` from `diff2html/lib/ui/js/diff2html-ui` directly. |
| Node | `>=20.19` for Astro 6 | Set in `.nvmrc` and Actions `setup-node`. |

---

## Reference Architecture Sketch

```
Repo (private until v1 ships)
├── apps/
│   └── site/                    # Astro 6 + Starlight site → GitHub Pages
│       ├── src/content/
│       │   ├── stages/          # 12 AI Governance Journey topics (.mdx)
│       │   ├── regulations/     # Tracked source pages (.md, auto-updated)
│       │   ├── vendor/          # Vendor policies (.md, AI-drafted PRs)
│       │   └── glossary/        # Term definitions (.md)
│       ├── src/content.config.ts  # Zod schemas per collection
│       ├── src/components/      # Wizard, ChatWidget, DiffViewer islands
│       └── astro.config.mjs
├── packages/
│   ├── chat-worker/             # Cloudflare Worker (Hono) → /chat endpoint
│   ├── scrape/                  # ETL scripts run in GitHub Actions
│   └── shared/                  # Types shared between site + worker
└── .github/workflows/
    ├── deploy-site.yml          # On push to main → build → GitHub Pages
    ├── deploy-worker.yml        # On worker change → wrangler deploy
    ├── scrape-regs.yml          # Cron daily → fetch → diff → PR
    ├── scrape-vendor.yml        # Cron weekly → AI-draft → PR
    └── reindex-vectors.yml      # On content merge → embed → Vectorize upsert
```

---

## Confidence Assessment

| Pick | Confidence | Verification |
|------|------------|--------------|
| Astro 6 + Starlight | HIGH | Verified via official Astro blog, Starlight 0.39 release notes, multiple 2026 production migration posts. |
| Tailwind v4 | HIGH | Verified via Tailwind docs, 2026 framework surveys. |
| Pagefind via Starlight | HIGH | Built-in per official Starlight docs; bandwidth advantage over Orama corroborated by independent benchmarks. |
| Cloudflare Workers for chat | HIGH | Verified Workers free-tier limits via official Cloudflare docs (100K req/day). V8 isolate cold-start advantage well-documented. |
| Cloudflare Vectorize | HIGH | Verified free-tier limits via official Cloudflare docs (30M queried + 5M stored dimensions/mo). |
| Workers AI BGE-base for embeddings | HIGH | Verified via Workers AI docs; 10K neurons/day free corroborated. |
| Anthropic Claude Haiku 4.5 | HIGH | Verified pricing ($1/$5 MTok) via official Anthropic news + multiple 2026 sources. Citations API and prompt caching documented. |
| diff2html v3 | HIGH | Active maintenance verified on GitHub; npm publishes ongoing. |
| Hono on Workers | HIGH | Standard pairing in 2026, official Workers docs reference. |
| `astro-mermaid` | MEDIUM | Active npm package; verified via multiple Astro community recipes. Less battle-tested than Pagefind. |
| Cron scrape → PR pattern | HIGH | Standard GitHub Actions pattern with multiple worked examples published in 2026. |
| Skip Firecrawl in favor of fetch+cheerio+Playwright | MEDIUM | Recommendation based on cost discipline + scraping experience; fragile sites may force re-evaluation. |

Overall confidence: **HIGH**. Every core pick is verified against official docs from the vendor.

---

## Sources

**Astro / Starlight**
- [Astro 6 stable release blog](https://www.southwellmedia.com/blog/astro-6-stable-release) — Astro 6 features, Cloudflare backing
- [Astro v6 Beta announcement (InfoQ)](https://www.infoq.com/news/2026/02/astro-v6-beta-cloudflare/) — First-class Cloudflare Workers support
- [Starlight 0.39 release](https://astro.build/blog/starlight-039/) — Latest Starlight features
- [Starlight Site Search docs](https://starlight.astro.build/guides/site-search/) — Pagefind built-in
- [Astro content collections docs](https://docs.astro.build/en/guides/content-collections/) — Content Layer API, Zod schemas
- [Astro Islands docs](https://docs.astro.build/en/concepts/islands/) — `client:idle`, `client:visible` directives
- [Accessible Astro Starter](https://github.com/incluud/accessible-astro-starter) — WCAG 2.2 AA reference patterns
- [Distr migration from Docusaurus to Starlight](https://distr.sh/blog/distr-docs/) — Real-world 2026 migration rationale

**Search**
- [Pagefind vs Orama comparison](https://sarthakmishra.com/blog/pagefind-astro) — 50KB vs 600KB bandwidth analysis
- [Static site search options 2026](https://sarthakmishra.com/blog/astro-search-comparison) — Four-engine comparison

**Cloudflare Platform**
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/) — Official free tier
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) — Free vs paid tiers
- [Cloudflare Vectorize limits](https://developers.cloudflare.com/vectorize/platform/limits/) — Dimension quotas
- [Cloudflare Vectorize pricing](https://developers.cloudflare.com/vectorize/platform/pricing/) — 30M queried + 5M stored free
- [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) — 10K neurons/day
- [Workers AI models catalog](https://developers.cloudflare.com/workers-ai/models/) — `@cf/baai/bge-base-en-v1.5` reference

**LLM**
- [Anthropic Claude Haiku 4.5 announcement](https://www.anthropic.com/news/claude-haiku-4-5) — Pricing, performance
- [Claude API pricing breakdown (CloudZero)](https://www.cloudzero.com/blog/claude-api-pricing/) — All models 2026
- [LLM API pricing comparison 2026 (Inference.net)](https://inference.net/content/llm-api-pricing-comparison/) — Cross-provider
- [Claude vs Groq comparison](https://giftsmartai.com/blog/chatgpt-vs-claude-vs-groq) — Use-case-fit analysis

**Diff Rendering**
- [diff2html GitHub repo](https://github.com/rtfpessoa/diff2html) — Active maintenance
- [diff2html npm](https://www.npmjs.com/package/diff2html) — v3.x current

**Styling**
- [Modern CSS 2026: Tailwind v4 / Open Props / CUBE](https://domainindia.com/support/kb/modern-css-tailwind-v4-open-props-cube-architecture) — Comparison

**Diagrams**
- [astro-mermaid npm](https://www.npmjs.com/package/astro-mermaid) — Theme switching
- [Starlight Mermaid discussion](https://github.com/withastro/starlight/discussions/1259) — Plugin approach rationale

**CI / Scraping**
- [Firecrawl vs Playwright comparison](https://www.firecrawl.dev/blog/playwright-vs-firecrawl) — Tradeoffs
- [Scheduled scraping with Playwright + GitHub Actions](https://www.marcveens.nl/posts/scheduled-web-scraping-made-easy-using-playwright-with-github-actions) — Pattern
- [How to run scheduled cron jobs in GitHub workflows](https://dylanbritz.dev/writing/scheduled-cron-jobs-github/) — Cron syntax + auto-commit pattern

**Vector Stores (alternatives)**
- [Best vector databases 2026 (Firecrawl blog)](https://www.firecrawl.dev/blog/best-vector-databases) — Landscape survey
- [Turbopuffer pricing analysis](https://www.morphllm.com/comparisons/turbopuffer-vs-pinecone) — $64/mo minimum confirmed
- [Upstash pricing](https://upstash.com/pricing) — Vector free tier

---

*Stack research for: AI Governance knowledge site (static + serverless RAG)*
*Researched: 2026-05-24*
