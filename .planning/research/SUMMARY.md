# Project Research Summary

**Project:** AI Governance (public knowledge site + companion repo)
**Domain:** Content-heavy public documentation site for a regulated, fast-moving domain — Astro static site + serverless RAG chat + scheduled scrape→AI-draft→PR pipeline; single primary author
**Researched:** 2026-05-24
**Confidence:** HIGH

## Executive Summary

This is a documentation/knowledge site dressed up as a *monitoring tool*: the spine is Dan Storbaek's 12-stage AI Governance Journey rendered as deep, story-framed, persona-aware explainers, but the load-bearing differentiator vs IAPP / OECD / AI Act Explorer is **per-page changelogs + global "what's new" feed + red/green text-level diffs** sourced from git history of scraped regulation snapshots. Experts in 2026 build this category as **Astro 6 + Starlight on GitHub Pages** (free, fast, git-native) with a **single Cloudflare Worker** handling RAG chat (Vectorize + Workers AI embeddings + Claude Haiku 4.5 with the official Citations API), all under a **pnpm monorepo** with three deploy units (`apps/site`, `apps/chat-worker`, `apps/pipeline`) sharing Zod schemas in `packages/shared`. Total expected cost: **$0–$15/month**.

The recommended approach is **single-canonical-MDX-per-topic** with inline `<PersonaSection>` blocks (no URL fragmentation), **frontmatter-authored topic↔regulation matrix** with a build-generated reverse index committed for review-time visibility, **dated snapshot files** as the diff substrate (cleaned markdown, not raw HTML), **read-only Worker / write-only CI** boundary on Vectorize, and **AI drafts that open scoped PRs to disjoint directories** to make merge-stomping structurally impossible. PROJECT.md's constraint to "ship full v1 before going public" means scope is fixed and large — the roadmap must sequence it into deliverable slices, not de-scope it.

The dominant risks are not technical — they are **trust, legal, and human-sustainability** risks. Top five: (1) **stale citations** drifting between reindex and content change destroys the chat's value prop; (2) **UPL exposure** if the wizard outputs anything reading as "your tailored compliance checklist" (DoNotPay FTC settlement + 2026 OpenAI UPL lawsuit are live precedent); (3) **AI-drafted PR review fatigue** silently shipping wrong content (the Dependabot pattern); (4) **GitHub Actions cron silently disabled after 60 days** of low repo activity during the private-build phase; (5) **solo-author burnout** at month 10 (the Booklore / Kubernetes Ingress NGINX pattern). Each has a concrete mitigation that must be wired into a *specific* phase, not deferred to "polish" — these are not bugs to be fixed later, they are constraints to design around from Day 1.

## Key Findings

### Recommended Stack

A content-first stack with one serverless dynamic component and zero conventional infra. **Astro 6 + Starlight** is the consensus 2026 choice for content-heavy documentation (verified via multiple production migrations from Docusaurus/Next.js); paired with **Tailwind v4** for styling and **Pagefind** (built into Starlight) for client-side search. The chat backend is a single **Cloudflare Worker on Hono** calling **Vectorize** for retrieval and **Anthropic Claude Haiku 4.5** for generation, with **Workers AI BGE-base** providing embeddings at build time. Diffs render with **diff2html** (~30KB, client-side, lazy-loaded). Scraping uses **fetch + cheerio first, Playwright in Actions when JS is required, no Firecrawl** (cost discipline). Mermaid via **astro-mermaid** for the 12-stage journey diagram.

**Core technologies:**
- **Astro 6 + Starlight** — static site + docs theme — fastest builds, lightest JS, built-in Pagefind/dark-mode/a11y/i18n, Cloudflare-backed
- **Tailwind v4** — styling — compiles in ms via Lightning CSS, zero config, plays well with Starlight tokens
- **Cloudflare Workers (Hono)** — chat endpoint — 100K req/day free, sub-1ms cold starts, in-zone bindings
- **Cloudflare Vectorize + Workers AI** — RAG store + embeddings — 30M queried/mo + 10K neurons/day free, single-vendor, no cross-cloud hop
- **Anthropic Claude Haiku 4.5** — RAG generation — $1/$5 per MTok, native Citations API (the differentiator for governance content), streaming, prompt caching
- **diff2html + jsdiff** — change rendering — build-time diff JSON + client-side render with no-JS `<details><pre>` fallback
- **GitHub Pages + GitHub Actions** — hosting + CI — free for public repos, git-native deploy, cron for scheduled scrapes
- **pnpm workspaces** — monorepo — three apps (site, chat-worker, pipeline) + two shared packages (`shared` schemas, `embed-cli`)

**Critical version requirements:** Astro **6.0+** (not 5; Cloudflare Workers support shipped in 6), Starlight **0.39+** (Astro 6 compat), Tailwind **v4** (use `@tailwindcss/vite` not PostCSS), Node **22+** (Astro 6 requirement).

See full detail: [STACK.md](./STACK.md).

### Expected Features

PROJECT.md mandates "ship the full v1 vision before public launch" — so v1 scope is large by design. The feature set decomposes into **six load-bearing capabilities** that must all be present: (1) the 12 stage explainer pages with story framing + persona lenses; (2) per-page changelog + global feed + red/green diffs; (3) scheduled regulation tracking with visible "last scraped X ago"; (4) deterministic wizard outputting printable + shareable-URL checklist; (5) RAG chat with inline numbered citations + hover cards via Anthropic Citations API; (6) Pagefind search with glossary tooltips throughout the prose. The single biggest competitive gap vs IAPP/OECD/AI Act Explorer is the **diff + changelog + feed combination** — every competitor shows dates, none show what actually changed.

**Must have (table stakes — TS-1 through TS-17):**
- All 12 Storbaek stages as deep, standalone, story-framed explainers (the spine — without all 12, it's a teaser)
- Per-topic "Last updated" + change log, plus global "What's new" feed, plus RSS — table stakes for any tracker
- Client-side search (Pagefind via Starlight, ⌘K shortcut)
- Glossary with hover tooltips on first occurrence of defined terms per page
- Inline citations to authoritative regulation sources on every regulatory claim
- WCAG 2.2 AA + mobile-responsive + dark mode + print stylesheet + stable URLs
- "Not legal advice" disclaimer — footer + per-regulation-page banner (legal floor)
- Per-source rollup pages (one page per tracked regulation/framework) with timestamps
- Landing-page Mermaid of the 12-stage spine + sidebar showing it on every page

**Should have (differentiators — D-1 through D-20):**
- Story-framed fictional company woven through each stage (multiple jurisdictions to avoid US-centric framing)
- Persona lenses (exec / engineer / compliance) inline on the same canonical page, switched client-side
- Red/green text-level diffs for every tracked regulation change
- Topic ↔ regulation bidirectional matrix
- Deterministic wizard → checklist (printable + shareable URL + copy-as-markdown), with citations next to every item
- RAG chat with inline numbered citations + source hover cards (Anthropic Citations API)
- Auto-wrapped glossary tooltips on first term occurrence
- Vendor policy rollups (OpenAI/Anthropic/Google/Microsoft/Meta) with same diff treatment
- Adversarial-ML control catalogue (OWASP LLM Top 10, MITRE ATLAS, PyRIT, Garak)
- "Why this matters" callouts under every regulatory citation, written for non-lawyers
- Zero-tracking analytics (Cloudflare aggregate) + open-source repo as the artifact

**Defer (v1.1 / v2+):** snapshot compare picker, citation export, cross-stage "what's similar" links, AI-drafted-section badge, per-persona read-time, cross-jurisdiction compare view, translation/i18n.

**Anti-features (explicitly NOT building):** user accounts, comments, lead-gen forms, cookie banners, push notifications, social-share buttons, AI-persona assistant with name/avatar, gamification, auto-merging AI PRs, GRC operation, inline ads.

See full detail: [FEATURES.md](./FEATURES.md).

### Architecture Approach

**Three independent subsystems** coordinated through git as the source of truth: a build-time static-site generator that produces the public artifact, a scheduled pipeline that scrapes regulators and opens scoped PRs, and a read-only chat Worker. The architecture's defining choice is **git as the database** — no Postgres, no D1, no sidecar state store. Regulation snapshots are dated markdown files in each source's `snapshots/` directory; "what changed since last run" is `git log -1 -- regulations/<source>/snapshots/`. The topic↔regulation matrix is **authored on topic pages** (one author, deliberate) and **reverse-indexed at build time** into a committed `matrix.json` (so the diff appears in code review). The site and Worker deploy independently; Vectorize re-indexing is gated on content path filters. **Personas are CSS visibility toggles on a single canonical MDX file per topic** — no URL fragmentation, no citation surface explosion.

**Major components:**
1. **`apps/site` (Astro 6 + Starlight)** — content rendering, matrix/changes derivation, persona switching, wizard UI, chat widget shell, diff viewer → static HTML to GitHub Pages
2. **`apps/chat-worker` (Hono on Cloudflare Worker)** — RAG retrieval, Claude streaming with Citations API, rate limiting, query embedding → Cloudflare Worker
3. **`apps/pipeline` (Node + GitHub Actions)** — per-source-group scraping (eu-uk / us-state / global / vendor), HTML→MD cleaning, semantic diffing, AI-draft topic edits, PR opening → never deployed, runs only in Actions
4. **`packages/shared` (Zod schemas)** — single source of truth for content shape; imported by site build, Worker, and pipeline → typed refactors across the whole repo
5. **`packages/embed-cli`** — runs in CI on content merge; chunks changed MD files at H2/H3, embeds via Workers AI REST, upserts to Vectorize → Worker only reads; CI only writes (least privilege)
6. **`content/` collections** — five typed collections (`stages`, `regulations`, `vendor`, `glossary`, `stories`) with cross-references via Astro `reference()`
7. **Generated `matrix.json` + `changes.json`** — matrix is committed for review visibility (CI rebuilds and verifies match); changes.json is ephemeral (built per deploy from `git log`)

**Repo layout skeleton:** `apps/{site,chat-worker,pipeline}/`, `packages/{shared,embed-cli}/`, `.github/workflows/{deploy-site,deploy-worker,reindex-vectors,scrape-eu-uk,scrape-us-state,scrape-global,scrape-vendor,matrix-check,lighthouse-ci,axe-ci}.yml`, `pnpm-workspace.yaml`.

**Critical boundary rules:** Worker never writes, pipeline never reads Vectorize, site build never makes runtime network calls. Each subsystem owns its mutation surface → failures isolable. Each automated PR is scoped to a single source's directory + at most one topic page → two automated PRs can never touch the same file → no merge stomping.

See full detail: [ARCHITECTURE.md](./ARCHITECTURE.md).

### Critical Pitfalls

The "Top 7 That Sink This Project" from PITFALLS.md — each must be designed-around, not patched-around:

1. **Stale citations between reindex and source change.** Pin every chat citation to a dated snapshot URL (never to rolling `index.md`); embed snapshot date in chunk metadata; surface "as of YYYY-MM-DD" in citation hover cards; weekly drift audit on 50 random prior answers. **Phase:** Chat — baked into citation contract before launch.

2. **"Not legal advice" disclaimer doesn't shield against UPL / FTC claims.** Frame wizard output as "topics to discuss with counsel," never "your tailored compliance checklist"; per-jurisdiction in-context disclaimers; chat system prompt forbids "you must" / "you are required to"; **real lawyer reviews disclaimer, footer, terms, and wizard framing before public launch (non-negotiable)**. **Phase:** Foundation + Wizard + Chat + pre-launch lawyer review.

3. **AI-drafted PR review fatigue (the Dependabot trap).** Batch by source group (one PR/group/run, ~4/week not 30+); classify diffs as editorial/clarification (auto-merge after CI) vs amendment/new-section (open PR); PR body leads with 5-line summary; machine-verified quote contract via `<RegQuote>` component; weekly load alarm auto-throttles cadence on backlog. **Phase:** Pipeline — must ship before any cron is enabled.

4. **GitHub Actions cron silently disabled after 60 days inactivity.** Commit a keepalive workflow Day 1; per-source heartbeat with `last-run-<source>.json`; freshness check workflow that opens issues if a heartbeat is >2× cron interval old; visible "last scraped X ago" on every source page with build-time deploy gate. **Phase:** Foundation + Pipeline.

5. **Scraper brittleness — silent restructure → garbage PR labeled "huge change."** API-first per adapter (EUR-Lex CELLAR/SPARQL, not HTML); per-source sanity assertions (wordCount, fingerprint, must-contain phrases); diff-size circuit breaker reverses the signal ("huge change" = "SUSPECT scraper breakage"); per-source `RUNBOOK.md`. **Phase:** Pipeline.

6. **AI hallucinated regulation quotes that verify visually but misrepresent.** **Mandatory machine-verified quote contract** — every `"quote"` in merged content must come from a `<RegQuote source="..." article="..." snapshot="..." />` component that resolves at build time from the snapshot file; the site cannot render a quote that doesn't exist; AI-draft prompts forbid free-text quotes; `verify.json` sidecar + CI gate re-fetches each cited snapshot. **Phase:** Pipeline (component + CI gate) before any AI-draft PR opens.

7. **Solo author burnout (the Booklore pattern).** Build a **"sustainability mode" toggle** Day 1 (drops cadence to weekly, surfaces "maintained at low cadence" on the site); cap maintenance hours per week, throttle pipeline when review backlog grows; `MAINTENANCE.md` + About-page acknowledgment of single-author status; recruit 2-3 beta reviewers pre-launch. **Phase:** Foundation + Polish + Ongoing.

**Other high-priority pitfalls:** persona lens content rot (Pitfall 8 — compliance lens stales fastest), GitHub Pages bandwidth at Year 2-3 (Pitfall 9 — put Cloudflare CDN in front Day 1), chat cost spike from abuse (Pitfall 10 — spending cap + rate limit + Turnstile + semantic cache before launch), Pagefind on sparse corpus (Pitfall 11 — gate launch on density threshold), jurisdictional/cultural framing blind spots (Pitfall 12 — multiple fictional companies from multiple jurisdictions).

See full detail: [PITFALLS.md](./PITFALLS.md).

## Implications for Roadmap

**Cross-cutting "what blocks what" pattern drawn from all four researchers:**

- **Disclaimer copy + sustainability-mode toggle + keepalive workflow + Cloudflare CDN in front of Pages + Lighthouse/axe CI gates must exist Day 1** — they are not polish; they are constraints to design around. (Pitfalls 2, 4, 7, 9, M-6)
- **Content density threshold must be defined before any pipeline work** — Phase 3 otherwise ships low-signal regulation pages onto a corpus too thin for Pagefind. (Pitfall 11)
- **Pipeline cannot ship until `<RegQuote>` machine-verified quote contract + per-source sanity checks + diff-size circuit breaker + classification gating + heartbeat alerts all exist** (Pitfalls 3, 5, 6, 4).
- **Topic ↔ regulation matrix (D-5) must exist before wizard (D-6) can cite sources well**, before chat (D-7) can ground retrievals in topic context, and before vendor rollups (D-18) work as a discovery surface.
- **Persona-lens completeness CI rule must exist before the second stage page is authored** — otherwise Pitfall 8 becomes baked-in technical debt.
- **Chat citation contract (pinned to dated snapshots, snapshot date in metadata) must be designed before any chat answer ships** — retrofitting invalidates every prior shared link. (Pitfall 1)
- **Lawyer review of disclaimer/wizard framing is the single hardest-to-parallelize blocker** — schedule it early, against Foundation+Wizard outputs.

### Phase 1: Foundation & Chrome

**Rationale:** Multiple critical pitfalls (2, 4, 7, 9) require Day-1 plumbing that is impossible to retrofit cleanly. The shell exists before any narrative so Phase 2 authors against real components, not stubs. Pitfall 11 (sparse-corpus search) gated by defining a density threshold here.

**Delivers:** Astro 6 + Starlight site shell deployed to GitHub Pages behind Cloudflare CDN; Tailwind v4; Starlight nav showing 12-stage spine sidebar; landing-page Mermaid placeholder; persona-switch shell + `<PersonaSection>`; glossary collection scaffold + first-occurrence-only wrap; `<RegQuote>` component; zero-tracking Cloudflare analytics; RSS plumbing; print stylesheet; OG/Twitter cards; redirect-map mechanism; **disclaimer + footer + About + MAINTENANCE.md + sustainability-mode flag**; keepalive + heartbeat + failure-alert webhook workflows; **Lighthouse-CI + axe-core + LCP/INP/CLS budgets enforced as PR gates**; image/page-weight budgets; content-density-threshold definition.

**Addresses:** TS-7, TS-8, TS-9, TS-10, TS-12, TS-13 (placeholder), TS-14, TS-15, TS-16, TS-17, D-10, D-13, plus `packages/shared` Zod schemas.

**Avoids:** Pitfalls 2, 4, 7, 9, 11, M-4, M-6, m-1.

### Phase 2: Content Authoring (12 Stages + Glossary + Stories)

**Rationale:** With shell + primitives in place, narrative spine becomes real. Must happen before Pipeline (Phase 3) so AI-drafted PRs have topic pages to propose edits against. Multi-jurisdiction story framing (Pitfall 12) must be planned *before* the first story is written. Persona-lens completeness CI rule (Pitfall 8) must be wired before the second stage page.

**Delivers:** All 12 stage pages story-framed + persona-aware (~1500-3500 words each); 3-4 fictional companies from different jurisdictions (Acme Robotics US, Sigma Health Berlin, Aurora Insurance London, Densha Logistics Tokyo); persona lenses (exec/engineer/compliance) per stage; per-stage Mermaid micro-flows; "why this matters" callouts; full glossary with synonyms; final landing-page Mermaid; lens-completeness CI rule; lens last-touched timestamps in UI; editorial style guide forbidding "you should" / "you must" prescription.

**Uses:** Astro content collections + Zod schemas + components from Phase 1.

**Implements:** TS-1, TS-5, TS-6, TS-13 (final), D-1, D-2, D-8, D-12, D-17.

**Avoids:** Pitfalls 8, 12, M-1, 2 (prescription rule).

### Phase 3: Regulation Tracking Pipeline (Scrape → Diff → AI-Draft → PR)

**Rationale:** This phase is the dangerous one — it ships the pipeline that itself becomes the worst pitfall surface (PR fatigue, hallucinated quotes, broken scrapers, silent cron, bandwidth, lens drift). Must come **after** content (Phase 2) so AI-drafts have topic pages to edit, and **before** Wizard/Chat (4 & 5) because both depend on populated `regulations/`. Most pitfall mitigations land here.

**Delivers:** Per-source-group workflows with concurrency groups; per-source adapters (API-first for EUR-Lex/NIST/OECD; cheerio second; Playwright third); HTML→cleaned-markdown via remark/rehype; semantic diff `meaningful.ts` calibrated against 30 days historical scrapes; **per-source sanity assertions**; **diff-size circuit breaker** reversing "huge change" signal; **AI-draft via Claude Citations API with `<RegQuote>` constraint** + "never claim" forbidden-words list; `verify.json` sidecar + `verify-quotes` CI gate; per-source-group batched PRs with structured body + reviewer checklist; classification gating (editorial/clarification auto-merge; amendment/new-section open PR); per-source `RUNBOOK.md`; weekly load alarm with auto-throttle on backlog; per-source heartbeat + freshness alerts; meaningful-change filter on RSS; build-generated `matrix.json` + `changes.json`; per-page changelog timeline + global "What's new" feed grouped by ISO week; red/green diff viewer with `<details><pre>` no-JS fallback; `<JurisdictionLens>` component if material differences exist; per-source rollup pages; vendor policy rollups; adversarial-ML catalogue cross-listed from Continuous Red-teaming stage.

**Uses:** Astro collections + Zod schemas; Anthropic API; Citations API; GitHub Actions concurrency + path filters + branch protection on `auto/*`.

**Implements:** TS-2, TS-3, TS-11, TS-14, D-3, D-4, D-5, D-16 (via matrix), D-18, D-19.

**Avoids:** Pitfalls 3, 4, 5, 6, 8 (lens-aware drafting), M-3, M-8, M-9, m-4, plus several security mistakes (least-privilege tokens, branch protection on `auto/*`, sources.yml allowlist).

### Phase 4: Deterministic Wizard

**Rationale:** Depends on the topic↔regulation matrix from Phase 3. Lower technical complexity than Chat (Phase 5) so naturally precedes it. Pitfall 2 (UPL framing) is the dominant risk; must be designed into the wizard spec, not patched in review.

**Delivers:** JSON-authored decision tree in `apps/site/src/data/wizard.json` (Zod-validated); React/Solid island rendering ~5-6 questions deep; output = checklist with action + citation + link to stage page + checkbox; **output framed as "topics to discuss with counsel," NEVER "your tailored compliance checklist"**; per-jurisdiction in-context disclaimer banner above wizard output; **URL-hash state with `v=1` schema version** (defends against M-5); shareable URL + "Save as PDF" via print + "Copy as Markdown"; checklist items pull from `matrix.json` for "topics that also discuss this article" discovery; no PII collection; no saved profiles, no email capture.

**Uses:** `matrix.json` from Phase 3; print stylesheet from Phase 1; Zod schema from `packages/shared`.

**Implements:** D-6, D-16.

**Avoids:** Pitfalls 2, M-5. Triggers lawyer review of wizard output framing in parallel.

### Phase 5: RAG Chat

**Rationale:** Highest implementation complexity, highest cost-spike risk, highest legal exposure per interaction. Depends on populated content (Phase 2), populated regulations (Phase 3), and the matrix (Phase 3). Citation contract must be designed before first chat ships — Pitfall 1 retrofits invalidate every prior shared link.

**Delivers:** `apps/chat-worker` with Hono routes (`/chat`, `/feedback`, `/healthz`); `packages/embed-cli` running in CI on content-merge path filter; chunk strategy at H2/H3 (~500 tokens) with `chunk_id = file_path#heading_slug#chunk_index`; Workers AI BGE embeddings; Vectorize upsert with rich metadata (source_type, source_path, title, heading, url, snapshot_date); **read-only Worker / write-only CI boundary via separate tokens**; query embedding via Worker AI binding; Vectorize retrieval (topK=8); Anthropic Claude Haiku 4.5 streaming with **Citations API** (authoritative cite-to-chunk mapping); system prompt with hardcoded refusal patterns + "never claim" / "never prescribe" rules; **prompt caching** on system + top-20 popular retrievals; **citations pinned to dated snapshot URLs** with snapshot date in hover cards; ChatWidget React island consuming SSE, rendering inline numbered citations + sidecar source list + hover cards; **rate limiting** (per-IP 20 req/hour, global 1000 req/day) via Cloudflare native; **Cloudflare Turnstile** invisible challenge; CORS allowlist site origin only + `X-Frame-Options: DENY`; **monthly Anthropic spending cap** with graceful chat-unavailable degradation; daily cost dashboard via Anthropic usage API → webhook; semantic cache (hash query + retrievals) in Workers KV for 24h; XSS-sanitized markdown output; CI grep for `sk-ant-` in `dist/`; injection-test fixture suite (20 known-bad queries → expected refusal); `vectors-deployed-at` published marker for "index updating" banner; redirect map for citation URL stability across renames.

**Uses:** Vectorize, Workers AI, Anthropic API, all Phase 2+3 content, `matrix.json`.

**Implements:** D-7.

**Avoids:** Pitfalls 1, 2 (system-prompt refusal), 6 (Citations API extended to chat), 10, M-7, m-7, plus most security mistakes around the Worker.

### Phase 6: Polish & Pre-Launch Gate

**Rationale:** Where all "looks done but isn't" checks happen. Pre-public-launch is the only chance to catch first-impression failures — Pitfall 7 (burnout), 12 (jurisdiction blind spots), and overall trust posture all gate here.

**Delivers:** Mermaid responsive layout (mobile fallback); favicon + per-page OG image generation; mobile font sizes verified on real devices; first-time-visitor banner; "Edit on GitHub" + "found an issue?" links per page; AI-drafted-section transparency badge (D-14 if first AI PRs have landed); search empty-state → "ask in chat" handoff; per-vendor freshness gate hardening; quarterly lens-review tooling (scheduled GitHub issue with matrix.json-derived checklist); GitHub Sponsors plumbing + co-maintainer documentation; bandwidth monitoring dashboard; **3-jurisdiction beta-reviewer pass** (1-2 EU compliance pros, 1 UK, 1 APAC); **lawyer sign-off on disclaimer, footer, terms, wizard output framing, chat system prompt** (single largest legal cost; non-negotiable); "Looks Done But Isn't" checklist run formally; density-threshold verified met; final Lighthouse pass with tightened budgets.

**Implements:** D-11, D-14, D-15 (manual cross-links if curated), D-20.

**Avoids:** Pitfalls 7, 12, 2 (lawyer review), M-2, m-2/m-3/m-5/m-6.

### Phase Ordering Rationale

- **Foundation precedes Content** because Phase 1 ships the components Phase 2 authors against.
- **Content precedes Pipeline** because AI-drafted PRs need topic pages to edit.
- **Pipeline precedes Wizard and Chat** because both depend on populated regulations + the matrix.
- **Wizard precedes Chat** because the wizard is deterministic (lower risk) and shares the citation-component infrastructure Chat extends. Also lets lawyer review of wizard happen in parallel with Chat construction.
- **Polish is its own phase**, not spread across phases — Pitfalls 7 and 12 require a deliberate pre-launch pause (beta readers, lawyer sign-off, sustainability artifacts).
- **Sustainability-mode + keepalive ship in Phase 1, not Phase 6** — "Day 1, not later" principle from PITFALLS.md.
- **CI gates escalate phase by phase** rather than landing all in Polish — each phase that ships new surfaces also ships the gate that prevents regressions on that surface.

### Research Flags

**Phases likely needing deeper research during planning (use `/gsd:research-phase`):**

- **Phase 3 (Pipeline):** Highest novelty + most pitfall surface. Topics: EUR-Lex CELLAR/SPARQL API mechanics + auth + rate limits; NIST/ICO/MEITY data availability per source; Claude Citations API contract for batch (non-streaming) drafting; `meaningful.ts` heuristics calibration on real regulator HTML; GitHub Actions `concurrency` group edge cases.
- **Phase 5 (RAG Chat):** Highest complexity + highest cost risk. Topics: Anthropic Citations API streaming marker format and partial-citation handling; Cloudflare Vectorize metadata-filter performance vs `topK`; Workers AI BGE chunk-size sweet spot for governance prose; prompt-caching `cache_control` semantics; Cloudflare Turnstile integration with Hono SSE handler.
- **Phase 4 (Wizard):** Lower technical novelty but legal-framing research needed — UPL precedent specific to "decision-tree → checklist" tools beyond DoNotPay; lawyer-review intake.
- **Phase 6 (Polish):** Beta-reviewer recruitment is a network task, not research; lawyer sourcing should start at Phase 1.

**Phases with standard patterns (skip research-phase):**

- **Phase 1 (Foundation):** Astro/Starlight scaffold, Cloudflare CDN in front of Pages, Lighthouse-CI + axe-core gates, RSS plumbing, `astro-mermaid` — all well-documented patterns; STACK.md + ARCHITECTURE.md already specify the picks.
- **Phase 2 (Content):** Authoring is domain work, not technical research; persona-lens / glossary patterns are settled.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Every core pick verified against official 2026 vendor docs. The one MEDIUM in STACK.md (`astro-mermaid`, Firecrawl skip) is a tradeoff call. |
| Features | HIGH | Table stakes cross-checked against 3+ exemplars (IAPP, AI Act Explorer, OECD, gdpr.eu, Stripe). Differentiators anchored on Core Value and where competitors demonstrably do not deliver. Anti-features mapped to PROJECT.md's out-of-scope list. |
| Architecture | HIGH | Verified against Astro/Starlight/Cloudflare/GitHub Actions official docs. MEDIUM on a few opinionated patterns (matrix-derived-from-topic-frontmatter direction, single-canonical-MDX-per-topic for personas) — tradeoff calls rather than verification gaps. |
| Pitfalls | HIGH | Legal-exposure, citation-drift, scraper, burnout, bandwidth pitfalls all backed by 2024-2026 case law, post-mortems, or platform docs. MEDIUM on content-rot SEO mechanics and multi-persona maintenance specifics (project-specific extrapolations). |

**Overall confidence:** HIGH. All four research files independently converged on the same architecture (Astro 6 + Cloudflare + git-as-database + AI-drafted-PR-with-human-review) and the same risk hierarchy (citations, legal, fatigue, burnout). The convergence is itself evidence of confidence.

### Gaps to Address

- **Lawyer-review sourcing and budget** — flagged as the single largest legal cost; PROJECT.md and FEATURES.md do not specify budget or relationship. **Handling:** First item in Phase 1; lawyer engaged by Phase 4 start.
- **Beta-reviewer recruitment from 3+ jurisdictions** — required by Pitfall 12 mitigation but not enumerated as a task. **Handling:** Explicit Phase 6 gate; outreach during Phase 2.
- **`meaningful.ts` semantic-diff thresholds** — both ARCHITECTURE and PITFALLS flag the need but neither specifies values. **Handling:** First task in Phase 3 — calibrate against 30 days of historical scrapes from 5-10 representative sources.
- **EUR-Lex / NIST / ICO API specifics** — STACK says "API first per adapter" but doesn't document each. **Handling:** Per-adapter research spike at Phase 3 kick-off; `apps/pipeline/src/sources/<source>/README.md` documents auth, rate limits, content structure, fallback.
- **Anthropic spending-cap UX + degradation testing** — PITFALLS prescribes a hard cap; degradation UX is unspecified. **Handling:** Phase 5 deliverable — trigger cap intentionally, verify site stays functional.
- **Cloudflare Vectorize metadata-filter performance** — ARCHITECTURE assumes filter cost is negligible. **Handling:** Phase 5 pre-implementation benchmark (1000-vector test index).
- **AI-draft classifier calibration** — both ARCHITECTURE and PITFALLS prescribe classification gating but the classifier is unspecified. **Handling:** Phase 3 ships conservative thresholds (everything opens a PR initially); Phase 6 revisits with empirical data.

## Sources

### Primary (HIGH confidence)
- Astro 6 release blog + InfoQ coverage + Starlight 0.39 release notes
- Cloudflare official docs (Workers / Vectorize / Workers AI limits + pricing)
- Anthropic official: Claude Haiku 4.5 announcement, Citations API docs, prompt caching docs
- GitHub Pages official docs + GitHub Actions community discussion #57858 (60-day cron disabling)
- FTC official DoNotPay case — UPL precedent
- 2026 OpenAI UPL lawsuit (Legal.io), French Bar / Morgan Lewis March 2026 guidance
- Cloudflare 2026 Threat Report (AI-DDoS abuse)
- Anthropic vs Chinese-AI-firms (SiliconANGLE Feb 2026; 13M conversation harvest)
- IAPP, AI Act Explorer, OECD AI Observatory, gdpr.eu/gdprchecklist.io, Stripe Docs — competitor analysis
- 2026 PulsePoint RAG survey (58% of teams update indexes monthly or less)
- Kubernetes Ingress NGINX EOL (March 2026), Booklore — burnout precedents
- byteiota / OpenJSF / Socket / Open Source Pledge — burnout statistics
- GroupBWT / Browserless 2026 web scraping surveys
- EUR-Lex docs (Publication Office APIs) + `eurlex` R package quirks
- Astro Content Collections + `reference()` docs + Cloudflare monorepo template

### Secondary (MEDIUM confidence)
- Distr migration-from-Docusaurus-to-Starlight 2026
- Pagefind vs Orama comparison + HN thread
- `astro-mermaid` npm + Starlight Mermaid discussion #1259
- diff2html v3 GitHub + npm
- Stripe docs developer-experience teardowns (Moesif)
- Dependabot/Renovate operational reports (Safeguard, Vife)
- `gautamkrishnar/keepalive-workflow` marketplace
- Lushbinary 2026 RAG production guide (semantic cache 30-60% reduction)
- TheLegalPrompts 2026 + 700-case AI-hallucination landscape
- 2026 NIST AI RMF Playbook + Holistic AI
- Cloudflare AI WAF / prompt-injection detection (Cloudswitched 2026)
- Microsoft/Dropbox git-bloat engineering articles

### Tertiary (LOW confidence — patterns asserted but not exhaustively verified)
- Specific Anthropic Citations API streaming token shape (needs Phase 5 spike)
- Cloudflare Vectorize metadata-filter performance under load (needs Phase 5 benchmark)
- `meaningful.ts` semantic-diff thresholds (needs Phase 3 calibration)
- Lawyer-review cost / sourcing in AI-governance niche (market rate not researched)
