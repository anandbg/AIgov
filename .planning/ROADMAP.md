# Roadmap: AI Governance

## Overview

A six-phase vertical-MVP build of a public AI-governance knowledge site (Astro 6 + Starlight on GitHub Pages behind Cloudflare CDN) with a scheduled scrape → diff → AI-draft → PR pipeline (Node + GitHub Actions), a deterministic wizard (URL-hash state), and a RAG chat (Cloudflare Worker + Vectorize + Claude Haiku 4.5 with Citations API). Each phase ships an end-to-end vertical slice the maintainer can interact with: Phase 1 produces a live, accessible shell with Day-1 pitfall mitigations baked in; Phase 2 makes the 12-stage narrative real and persona-aware; Phase 3 ships the tracking pipeline (the dangerous one — all hallucination/PR-fatigue/scraper mitigations land here); Phase 4 makes the wizard demoable with shareable URLs; Phase 5 makes chat answer with snapshot-pinned citations; Phase 6 is the pre-public-launch gate (lawyer sign-off, multi-jurisdiction beta review, density threshold met). The repo stays private until the end of Phase 6.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Chrome** - Live site shell deployed behind Cloudflare CDN with Day-1 pitfall mitigations (disclaimer, sustainability mode, keepalive, heartbeat, CI gates, density threshold)
- [ ] **Phase 2: Content Spine** - All 12 stage explainers authored as story-framed, persona-aware, glossary-tooltipped narrative with multi-jurisdiction fictional companies
- [ ] **Phase 3: Tracking Pipeline** - Scheduled scrape → diff → AI-draft → PR pipeline with hallucination-proof quote contract, per-source sanity gates, classification gating, per-page changelog, global "What's new" feed, diff viewer, vendor + adversarial-ML rollups
- [ ] **Phase 4: Deterministic Wizard** - Zero-LLM JSON-decision-tree wizard producing shareable, printable, copy-as-markdown "topics to discuss with counsel" output with per-item citations
- [ ] **Phase 5: RAG Chat** - Cloudflare Worker chat endpoint streaming Claude Haiku 4.5 with snapshot-pinned citations, prompt caching, rate limiting, Turnstile, spending cap, cost dashboard, semantic cache, search→chat handoff
- [ ] **Phase 6: Polish & Pre-Launch Gate** - Lawyer sign-off, 3-jurisdiction beta review, "Edit on GitHub" links, Cloudflare analytics, OG cards, final WCAG 2.2 AA + Core Web Vitals audit; public-launch flip

## Phase Details

### Phase 1: Foundation & Chrome
**Goal**: A live, accessible site shell exists at a real URL with every Day-1 pitfall mitigation in place, so all subsequent content authoring happens against real components and real CI gates — not stubs.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: FND-01, FND-02, FND-03, FND-04, FND-05, FND-06, FND-07, FND-08, FND-09, FND-10, FND-11, FND-12, FND-13, FND-14, SRC-01, SRC-02
**Success Criteria** (what must be TRUE):
  1. Maintainer can visit the live (private) site at a real URL, behind Cloudflare CDN, served from GitHub Pages on push to `main` — every page renders the 12-stage sidebar, dark mode, mobile responsiveness, print stylesheet, "Not legal advice" footer disclaimer, and validates against WCAG 2.2 AA on axe-core
  2. Opening any page on a mobile device or with JS disabled produces a usable, accessible layout with the spine sidebar collapsed sensibly, the disclaimer visible, and ⌘K/Ctrl-K opens a working Pagefind search modal across whatever content exists
  3. Pushing a PR that exceeds the Lighthouse LCP/INP/CLS budgets, fails axe-core checks, or exceeds the image/page-weight budget visibly fails CI and blocks merge
  4. The keepalive workflow has fired at least once (an empty commit lands on `main`), heartbeat workflow has written `last-run-*.json` for each scheduled job, and triggering a failure posts to the configured webhook — verified by intentionally breaking a workflow once
  5. Flipping the `sustainabilityMode` flag in `apps/site/src/config/site.ts` causes "maintained at low cadence" notice to render site-wide and `MAINTENANCE.md` + `About` page acknowledge single-author status, escalation plan, content-density threshold (12 stages + 10+ sources + 60+ glossary terms), and lawyer-review outreach status
**Plans**: 8 plans
Plans:
- [ ] 01-01-PLAN.md — Initialize standalone git repo + Node/pnpm runtime + SETUP.md human-action checklist
- [ ] 01-02-PLAN.md — pnpm monorepo scaffold + Zod schemas in packages/shared (FND-01)
- [ ] 01-03-PLAN.md — Astro 6 + Starlight 0.39 + Tailwind v4 site scaffold + Pagefind search (FND-02, SRC-01, SRC-02)
- [ ] 01-04-PLAN.md — Five content collections wired to @aigov/shared schemas + fixture content (FND-04)
- [ ] 01-05-PLAN.md — Shell components + global.css theme + disclaimer surface + print stylesheet (FND-05, FND-06, FND-11, FND-14)
- [ ] 01-06-PLAN.md — site.ts config + About page + MAINTENANCE/SECURITY/CONTRIBUTING docs + density UI (FND-07, FND-12, FND-13)
- [ ] 01-07-PLAN.md — GitHub Pages deploy + keepalive + heartbeat workflows + Cloudflare CDN docs (FND-03, FND-08, FND-09)
- [ ] 01-08-PLAN.md — CI quality gates: Lighthouse + axe-core + weight budget (FND-10)
**UI hint**: yes

### Phase 2: Content Spine
**Goal**: All 12 Storbaek-stage explainers are authored, story-framed, persona-aware, and richly cross-linked into the glossary and (placeholder) regulation pages — making the site a complete, readable narrative end-to-end even before the live pipeline ships.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: CNT-01, CNT-02, CNT-03, CNT-04, CNT-05, CNT-06, CNT-07, CNT-08, CNT-09, CNT-10, CNT-11
**Success Criteria** (what must be TRUE):
  1. A reader can land on `/` and walk all 12 Storbaek stages in order via the sidebar, each as a 1500–3500-word standalone explainer with a per-stage Mermaid micro-flow, "why this matters" callouts under every regulatory citation, and visible inline `<RegQuote>` components (no free-text quoted regulation language anywhere in merged content)
  2. Toggling the global persona switch (exec / engineer / compliance) on any stage page visually emphasizes the active lens and collapses the other two — all three lenses are present on every stage page, enforced by the persona-lens completeness CI rule (PR that drops a lens fails)
  3. At least three fictional companies from different jurisdictions (e.g., Acme Robotics US, Sigma Health Berlin, Aurora Insurance London, Densha Logistics Tokyo) are introduced on the landing page and woven as in-prose narrative through stages — no story lives in sidebar-only callouts
  4. Hovering any defined term on any stage page shows a glossary tooltip with definition (first-occurrence-only per page, skipped inside code and headings); the glossary collection has at least 60 terms
  5. The landing-page Mermaid renders the polished, final 12-stage journey (replacing Phase 1 placeholder), and the editorial style guide (`docs/STYLE.md`) plus its CI grep gate fails any PR containing "you should" / "you must" prescriptive language in merged content
**Plans**: TBD
**UI hint**: yes

### Phase 3: Tracking Pipeline
**Goal**: The scheduled scrape → diff → AI-draft → PR pipeline ships safely — every Pitfall-3/4/5/6 mitigation (hallucination-proof quote contract, per-source sanity gates, diff-size circuit breaker, classification gating, batched PRs, heartbeat alerts, load-alarm auto-throttle) is in place before the first cron fires, and the diff/changelog/feed UI surfaces real changes to readers.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: TRK-01, TRK-02, TRK-03, TRK-04, TRK-05, TRK-06, TRK-07, TRK-08, TRK-09, TRK-10, TRK-11, TRK-12, TRK-13, TRK-14, TRK-15, TRK-16, TRK-17
**Success Criteria** (what must be TRUE):
  1. Maintainer can run `pnpm pipeline run <source>` locally on any of the tracked sources (EU AI Act, UK ICO, NIST AI RMF, US EO, one state law, ISO/IEC 42001, OECD, India MEITY, Singapore, OpenAI/Anthropic/Google/Microsoft/Meta usage policies, OWASP LLM Top 10, MITRE ATLAS) and — when content changed — see a scoped PR opened on a per-source branch, with a structured 5-line summary, classification (editorial → auto-merge / amendment → human-review), reviewer checklist, and machine-verifiable `<RegQuote>` citations; the `verify-quotes` CI gate re-fetches every cited snapshot and fails on mismatch
  2. Every stage page and regulation page renders a per-page changelog timeline sourced from `changes.json`, and `/whats-new` renders changes grouped by ISO week with the same data exposed at `/feed.xml` (RSS) — only `meaningful.ts`-passing changes appear (whitespace, CSS class shuffles, etc. filtered out)
  3. Clicking any change in the timeline or feed opens a red/green text-level diff (lazy-loaded `diff2html`) with a `<details><pre>` no-JS fallback, and per-source rollup pages exist for every tracked source with timestamps and full snapshot history
  4. Scheduled `scrape-eu-uk` / `scrape-us-state` / `scrape-global` / `scrape-vendor` workflows run on cron with concurrency groups, path-filtered triggers, heartbeat writes, failure-alert webhooks, and the load-alarm workflow auto-throttles cadence to sustainability mode when the open-PR backlog exceeds threshold; a `matrix-check` CI rebuilds `matrix.json` from scratch on every PR and fails on mismatch
  5. The Continuous Red-teaming stage page surfaces the adversarial-ML control catalogue cross-listing OWASP LLM Top 10 + MITRE ATLAS + PyRIT + Garak entries, and per-source `RUNBOOK.md` files exist for every tracked source documenting auth, rate limits, content structure, fallback strategy, and known scrape failure modes
**Plans**: TBD
**UI hint**: yes

### Phase 4: Deterministic Wizard
**Goal**: A reader can answer ~5–6 questions and receive a personalized, source-cited, shareable "topics to discuss with counsel" checklist — never framed as legal advice, always cross-linked back into the narrative via the topic↔regulation matrix.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: WIZ-01, WIZ-02, WIZ-03, WIZ-04, WIZ-05, WIZ-06, WIZ-07
**Success Criteria** (what must be TRUE):
  1. A reader can complete the wizard on `/wizard` (~5–6 questions branching on provider-vs-deployer, jurisdiction EU/UK/US/APAC/global, use-case risk tier, agentic vs non-agentic, sensitive-data presence) and see a checklist where every item has an action, a citation to a dated regulation snapshot, a link to the relevant stage page, and a client-side checkbox
  2. The output page is framed as "topics to discuss with counsel for your jurisdiction" (never "your tailored compliance checklist"), renders a per-jurisdiction in-context disclaimer banner above the result, and collects zero PII (no email capture, no saved profiles)
  3. The maintainer can share the same wizard result by copying the URL — wizard state is encoded in the URL hash with a `v=1` schema version field, so links are forward-compatible and re-opening the URL reproduces the same checklist; printing the page produces a clean PDF via the print stylesheet, and a "Copy as Markdown" button copies the result to the clipboard
  4. Each checklist item links via `matrix.json` to "topics that also discuss this article," turning the wizard into a discovery surface back into the 12-stage narrative
**Plans**: TBD
**UI hint**: yes

### Phase 5: RAG Chat
**Goal**: A reader can ask a free-text question and receive a Claude Haiku 4.5 streamed answer with inline numbered citations pinned to dated snapshot URLs (never rolling canonical), with rate limits, spending cap, Turnstile, and graceful degradation all in place before the first public question is answered.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: CHT-01, CHT-02, CHT-03, CHT-04, CHT-05, CHT-06, CHT-07, CHT-08, CHT-09, CHT-10, CHT-11, CHT-12, CHT-13, SRC-03
**Success Criteria** (what must be TRUE):
  1. A reader can open the ChatWidget on any page, ask a governance question, and see a streamed Claude Haiku 4.5 answer with inline numbered citations and a sidecar source list — each citation hover card shows the snapshot date and the citation link resolves to a dated snapshot URL (e.g., `/regulations/eu-ai-act/2026-05-22/#art-11`), never to a rolling canonical
  2. Hitting the chat 21 times from the same IP in one hour is rejected with a clear "rate limit reached" message; an embedded `<iframe>` on a third-party site is blocked by CORS + `X-Frame-Options: DENY`; Turnstile invisible challenge fires on first request; manually triggering the monthly Anthropic spending cap returns a graceful "chat temporarily unavailable" UI without breaking search, wizard, or content
  3. Crafting any of the 20 known-bad queries in the injection-test fixture suite (legal-advice requests, "you must" / "you are required to" patterns, prompt-injection patterns) produces the expected refusal pattern — CI fails if any query is answered instead of refused
  4. Searching for a term that returns zero Pagefind results shows an empty state with a one-click "Ask in chat" handoff that pre-fills the chat with the typed query
  5. The daily cost dashboard posts yesterday's Anthropic usage to the configured webhook, the `vectors-deployed-at` marker is published on every reindex, and the ChatWidget surfaces an "index updating" banner when the marker is fresher than the last visit
**Plans**: TBD
**UI hint**: yes

### Phase 6: Polish & Pre-Launch Gate
**Goal**: All "looks done but isn't" pitfalls are closed; a real lawyer has signed off on disclaimer + footer + Terms + wizard framing + chat system prompt; 3-jurisdiction beta reviewers have read the site; the density threshold is verified met — and the repo is ready to flip from private to public.
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: TAD-01, TAD-02, TAD-03, TAD-04, TAD-05, TAD-06
**Success Criteria** (what must be TRUE):
  1. A real lawyer has reviewed and signed off in writing on the disclaimer, footer, Terms, wizard output framing, and chat system prompt — the sign-off email/PDF is committed to `.planning/legal/` and referenced in `MAINTENANCE.md`
  2. At least three external beta reviewers covering EU, UK, and APAC perspectives have read the full site, filed feedback as GitHub issues, and have had their reviews resolved or explicitly deferred to v1.1 with reasoning
  3. Every page renders an "Edit on GitHub" link and a "Found an issue?" link (pre-templated GitHub Issue), Cloudflare Web Analytics is configured (aggregate, no cookies, no PII, no third-party tracking scripts, no cookie banner anywhere on the site), and per-page OG/Twitter cards are generated at build time with a favicon set
  4. The final WCAG 2.2 AA audit (axe-core + manual keyboard nav) and Core Web Vitals audit pass on all stage and regulation pages on real mobile devices; the density threshold (12 stages, 60+ glossary terms, 10+ tracked sources with snapshots) is verified met
  5. The repo can flip from private to public with `gh repo edit --visibility public` and the README points to the live site URL — every "Looks Done But Isn't" checklist item from PITFALLS.md is checked and dated in `.planning/legal/launch-checklist.md`
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Chrome | 0/8 | Not started | - |
| 2. Content Spine | 0/TBD | Not started | - |
| 3. Tracking Pipeline | 0/TBD | Not started | - |
| 4. Deterministic Wizard | 0/TBD | Not started | - |
| 5. RAG Chat | 0/TBD | Not started | - |
| 6. Polish & Pre-Launch Gate | 0/TBD | Not started | - |
