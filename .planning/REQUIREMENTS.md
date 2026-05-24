# Requirements: AI Governance

**Defined:** 2026-05-24
**Core Value:** A practitioner with no prior AI-governance background can land on this site, follow a story, and walk away with a concrete, current, regulation-aware plan for their company — confident the content reflects the world *as of this week*, not last year.

YOLO mode + coarse granularity + full-vision v1. Categories follow the research synthesis (STACK / FEATURES / ARCHITECTURE / PITFALLS / SUMMARY). The Traceability table is populated by the roadmapper.

---

## v1 Requirements

### Foundation (FND)

Infrastructure and constraints that must exist before any narrative is authored.

- [ ] **FND-01**: pnpm monorepo with `apps/{site,chat-worker,pipeline}` and `packages/{shared,embed-cli}` workspaces; Zod schemas in `packages/shared` are the single source of truth for all content shape
- [ ] **FND-02**: Astro 6 + Starlight 0.39+ site scaffolded with Tailwind v4 (`@tailwindcss/vite`) and Node 22
- [ ] **FND-03**: Site deploys to GitHub Pages on push to `main`; Cloudflare CDN is configured in front of Pages from day one (Pitfall 9 — Pages bandwidth cap)
- [ ] **FND-04**: Five typed Astro content collections — `stages`, `regulations`, `vendor`, `glossary`, `stories` — with cross-references via `reference()` and Zod schemas imported from `packages/shared`
- [ ] **FND-05**: Reusable shell components ship and are documented: `<PersonaSection persona="exec|engineer|compliance">`, `<RegQuote source article snapshot>`, `<JurisdictionLens>`, `<DiffViewer>`, `<ChangeLog>`, `<GlossaryTerm>`, `<MermaidJourney>`
- [ ] **FND-06**: Starlight nav shows the 12-stage spine sidebar on every page; landing-page Mermaid placeholder of the journey is wired (final visual lands in Content phase)
- [ ] **FND-07**: A "sustainability mode" feature flag in `apps/site/src/config/site.ts` controls cron cadence and surfaces a "maintained at low cadence" notice site-wide when active (Pitfall 7 — solo-author burnout)
- [ ] **FND-08**: A keepalive GitHub Actions workflow runs weekly and touches the repo so scheduled crons are not auto-disabled at the 60-day inactivity threshold (Pitfall 4)
- [ ] **FND-09**: A heartbeat workflow records per-source `last-run-<source>.json` files and opens a GitHub issue if any heartbeat is older than 2× its cron interval; failures post to a webhook
- [ ] **FND-10**: CI gates enforce LCP / INP / CLS budgets via Lighthouse-CI and accessibility via axe-core on every PR; image and total-page-weight budgets fail the build on exceedance
- [ ] **FND-11**: Print stylesheet, mobile responsiveness, dark mode, and WCAG 2.2 AA verified on the shell before any content is authored (these are constraints, not polish)
- [ ] **FND-12**: A content-density threshold is defined and documented in `MAINTENANCE.md` (minimum topics, glossary terms, regulation snapshots) — public launch is blocked until met (Pitfall 11 — sparse-corpus search)
- [ ] **FND-13**: Repo-level `MAINTENANCE.md`, `SECURITY.md`, `CONTRIBUTING.md`, and an `About` page acknowledge single-author status and document escalation/co-maintainer plans
- [ ] **FND-14**: Footer-level "Not legal advice" disclaimer renders on every page; per-regulation pages render an in-context disclaimer banner

### Content (CNT)

The narrative spine — 12 stage explainers, glossary, fictional companies, persona lenses.

- [ ] **CNT-01**: All 12 Storbaek stages are authored as deep, standalone explainers (1500–3500 words each): AI Policy, EU AI Act Risk Tiering, Risk Check, Compliance, Third-party AI Risk, Data Controls, Continuous Red-teaming, Documentation, Accountability, Agentic AI Oversight, Incident Response, Monitoring
- [ ] **CNT-02**: Each stage page surfaces three persona lenses (exec / engineer / compliance) as inline `<PersonaSection>` blocks on a single canonical MDX file, switched client-side via a sticky global toggle
- [ ] **CNT-03**: Each stage page weaves at least one fictional-company scenario through the topic in narrative form (not sidebar-only callouts)
- [ ] **CNT-04**: At least three fictional companies are authored from different jurisdictions (e.g., US-based Acme Robotics, Berlin-based Sigma Health, London-based Aurora Insurance, Tokyo-based Densha Logistics) and referenced consistently across stages (Pitfall 12 — jurisdiction blind spots)
- [ ] **CNT-05**: Every stage page has a per-stage Mermaid micro-diagram showing where it sits in the journey and what it depends on
- [ ] **CNT-06**: Every regulatory claim on a stage page is backed by an inline citation via `<RegQuote>` — no free-text quoted regulation language is permitted in merged content (Pitfall 6 — hallucinated quotes)
- [ ] **CNT-07**: A glossary collection of at least 60 terms is authored; first-occurrence-only tooltip wrapping is applied automatically on stage pages
- [ ] **CNT-08**: A "why this matters" plain-language callout appears under every regulatory citation on stage pages
- [ ] **CNT-09**: Landing-page Mermaid of the full 12-stage journey is the final, polished version (replaces FND-06 placeholder)
- [ ] **CNT-10**: An editorial style guide (`docs/STYLE.md`) forbids "you should" / "you must" prescriptive language site-wide; CI grep gates merged content (Pitfall 2 — UPL framing)
- [ ] **CNT-11**: A persona-lens completeness CI rule fails the build if any stage page is missing one of the three required lenses (Pitfall 8 — lens rot)

### Tracking & Pipeline (TRK)

Scheduled scrape → diff → AI-draft → PR pipeline with the changelog/diff UI it feeds.

- [ ] **TRK-01**: Per-source-group GitHub Actions workflows exist with `concurrency` groups and path-filtered triggers: `scrape-eu-uk`, `scrape-us-state`, `scrape-global`, `scrape-vendor`
- [ ] **TRK-02**: Per-source adapters under `apps/pipeline/src/sources/<source>/` follow a shared interface and are API-first where possible (EUR-Lex CELLAR/SPARQL, NIST, OECD), `fetch + cheerio` second, Playwright third — never Firecrawl
- [ ] **TRK-03**: Tracked sources cover, at minimum: EU AI Act + UK ICO; NIST AI RMF + US Executive Order + at least one state law (e.g., CO AI Act); ISO/IEC 42001 + OECD AI Principles + India MEITY + Singapore Model AI Gov; OpenAI / Anthropic / Google / Microsoft / Meta usage policies; OWASP LLM Top 10 + MITRE ATLAS
- [ ] **TRK-04**: Each tracked source stores dated snapshot files as cleaned markdown under `content/regulations/<source>/snapshots/<YYYY-MM-DD>.md`; raw HTML is never the diff substrate
- [ ] **TRK-05**: A `meaningful.ts` semantic diff filter is calibrated against 30 days of historical scrapes from five representative sources and committed with the calibration test data
- [ ] **TRK-06**: Per-source sanity assertions (word-count bounds, content fingerprint, must-contain phrases) gate every scrape; a diff-size circuit breaker treats outlier "huge change" diffs as suspect (Pitfall 5 — scraper brittleness)
- [ ] **TRK-07**: AI-drafted PRs use Anthropic's Citations API constrained to the `<RegQuote>` component; free-text quotes are forbidden by prompt; a `verify-quotes` CI gate re-fetches every cited snapshot and fails on mismatch (Pitfall 6)
- [ ] **TRK-08**: PR scope is structurally constrained — each automated PR touches exactly one source's directory + at most one topic page — making concurrent-PR merge stomps impossible
- [ ] **TRK-09**: PR classification gates merge behavior — editorial/clarification → auto-merge after CI; amendment/new-section → human review required; PR body always leads with a 5-line summary + reviewer checklist (Pitfall 3 — PR review fatigue)
- [ ] **TRK-10**: A weekly load-alarm workflow auto-throttles pipeline cadence to "sustainability mode" when the open-PR backlog exceeds a defined threshold
- [ ] **TRK-11**: Build-time generators produce a committed `matrix.json` (topic↔regulation reverse index) and an ephemeral `changes.json` (from `git log`); `matrix-check` CI rebuilds `matrix.json` from scratch and fails on mismatch with the committed copy
- [ ] **TRK-12**: Per-page changelog timeline renders on every stage and regulation page, sourced from `changes.json`
- [ ] **TRK-13**: Global "What's new" feed page groups changes by ISO week, links to per-page changelogs and diff views, and exposes the same data as RSS at `/feed.xml`
- [ ] **TRK-14**: Red/green text-level diff viewer renders any tracked change via `diff2html` (build-time JSON, lazy-loaded), with a `<details><pre>` no-JS fallback
- [ ] **TRK-15**: Per-source rollup pages exist for every tracked source (one regulation/framework per page) with timestamps, latest snapshot link, and full snapshot history
- [ ] **TRK-16**: Each source has a per-source `RUNBOOK.md` documenting auth, rate limits, content structure, fallback strategy, and known scrape failure modes
- [ ] **TRK-17**: Adversarial-ML control catalogue cross-lists OWASP LLM Top 10 + MITRE ATLAS + PyRIT + Garak entries from the Continuous Red-teaming stage page

### Wizard (WIZ)

Deterministic, zero-LLM guided playbook generator.

- [ ] **WIZ-01**: Decision tree authored as Zod-validated JSON at `apps/site/src/data/wizard.json`, rendered by a small React/Solid island; ~5–6 questions deep
- [ ] **WIZ-02**: Wizard branches on at least: provider vs deployer, jurisdiction (EU / UK / US / APAC / global), use-case risk tier, agentic vs non-agentic, sensitive-data presence
- [ ] **WIZ-03**: Wizard output is a checklist where every item has an action, a citation to a regulation snapshot, and a link to the relevant stage page; items are checkbox-toggleable client-side
- [ ] **WIZ-04**: Wizard output is **never** framed as "your tailored compliance checklist" — copy reads as "topics to discuss with counsel" and renders a per-jurisdiction in-context disclaimer above the result (Pitfall 2 — UPL framing)
- [ ] **WIZ-05**: Wizard state is encoded as URL-hash with a `v=1` schema version field so links are shareable and forward-compatible
- [ ] **WIZ-06**: Wizard supports "Save as PDF" via the print stylesheet, "Copy as Markdown" via a copy button, and a shareable URL — no PDF generation infra, no email capture, no PII collection
- [ ] **WIZ-07**: Wizard output cross-links via `matrix.json` to "topics that also discuss this article" so it doubles as a discovery surface into the narrative

### Chat (CHT)

RAG chat grounded in the site's content + tracked regulations with inline citations.

- [ ] **CHT-01**: `apps/chat-worker` is a Hono application deployed to Cloudflare Workers with routes `/chat`, `/feedback`, `/healthz`
- [ ] **CHT-02**: `packages/embed-cli` runs only in CI on content-merge path filter; chunks markdown at H2/H3 (~500-token chunks); embeds via Workers AI BGE-base; upserts to Cloudflare Vectorize with rich metadata (source_type, source_path, title, heading, url, snapshot_date, chunk_id)
- [ ] **CHT-03**: Worker token has read-only Vectorize permission; CI token has write-only Vectorize permission — privileges never overlap
- [ ] **CHT-04**: Chat retrieval issues a Workers-AI query embedding, retrieves topK=8 from Vectorize, and calls Claude Haiku 4.5 streaming with the Anthropic **Citations API** so cite-to-chunk mapping is authoritative, not regex-inferred
- [ ] **CHT-05**: Every chat citation links to a **dated snapshot URL** (never a rolling canonical) and the snapshot date is visible in the citation hover card (Pitfall 1 — citation drift)
- [ ] **CHT-06**: Chat system prompt hardcodes refusal patterns for legal-advice questions, "you must" / "you are required to" language, and prompt-injection patterns (Pitfalls 2 and M-7)
- [ ] **CHT-07**: Prompt caching is enabled on system prompt + top-20 popular retrieval chunks; tokens consumed and cache-hit rate are logged
- [ ] **CHT-08**: ChatWidget React island renders inline numbered citations, a sidecar source list, and hover cards (with snapshot date); streams via SSE; sanitizes markdown output
- [ ] **CHT-09**: Rate limiting enforced — 20 req/hour per IP, 1000 req/day global — via Cloudflare native rate-limit binding; CORS allowlist is the site origin only; `X-Frame-Options: DENY`
- [ ] **CHT-10**: Cloudflare Turnstile invisible challenge gates `/chat`; a semantic cache (hash of query + retrieval fingerprint → answer) in Workers KV holds 24h to amortize repeat queries (Pitfall 10 — cost runaway)
- [ ] **CHT-11**: A monthly Anthropic spending cap is enforced — when exceeded, `/chat` returns a graceful "chat unavailable, try again next month" UI without crashing the site
- [ ] **CHT-12**: A daily cost dashboard pulls Anthropic usage and posts to a webhook; an injection-test fixture suite of at least 20 known-bad queries runs in CI and asserts expected refusals
- [ ] **CHT-13**: A `vectors-deployed-at` marker is published on every reindex; ChatWidget surfaces an "index updating" banner when the marker is fresher than the last visit

### Search & Discovery (SRC)

- [ ] **SRC-01**: Pagefind client-side search is enabled site-wide via Starlight's built-in integration; ⌘K / Ctrl+K shortcut opens the search modal
- [ ] **SRC-02**: Search indexes all stage pages, regulation pages, vendor pages, and glossary entries; results show snippet, title, and source type
- [ ] **SRC-03**: Search empty-state offers a one-click "ask in chat" handoff with the typed query pre-filled

### Trust, Accessibility & Distribution (TAD)

- [ ] **TAD-01**: Public launch is gated on a lawyer's review of the disclaimer, footer, Terms, wizard output framing, and chat system prompt (non-negotiable per Pitfall 2)
- [ ] **TAD-02**: Beta-review pass before public launch by at least three reviewers covering EU, UK, and APAC perspectives (Pitfall 12 — jurisdiction blind spots)
- [ ] **TAD-03**: An "Edit on GitHub" link and a "Found an issue?" link render on every page
- [ ] **TAD-04**: Cloudflare Web Analytics (aggregate, no cookies, no PII) is configured; no third-party tracking scripts, no cookie banner
- [ ] **TAD-05**: Final accessibility audit (WCAG 2.2 AA) and Core Web Vitals audit pass on all stage and regulation pages before public launch
- [ ] **TAD-06**: Per-page OG/Twitter cards generated at build time; favicon set; mobile font sizes verified on real devices

---

## v1.1 Requirements (Deferred)

Acknowledged scope deferred to a follow-on milestone; tracked here so they don't disappear.

### Future Differentiators

- **FUT-01**: Snapshot compare picker (pick any two snapshots of a regulation; diff them)
- **FUT-02**: Citation export (BibTeX / RIS for academic use)
- **FUT-03**: Curated cross-stage "what's similar" links between related stages
- **FUT-04**: "AI-drafted section" transparency badge on content blocks that originated from a merged AI-draft PR
- **FUT-05**: Per-persona read-time estimates
- **FUT-06**: Cross-jurisdiction comparison view (e.g., "how does Article 6 compare to NIST AI RMF GOVERN")
- **FUT-07**: Multi-language / i18n (Astro Starlight supports it; English-only for v1)
- **FUT-08**: GitHub Sponsors / co-maintainer recruitment surfaces

---

## Out of Scope

Explicit exclusions — anti-features documented to prevent re-adding.

| Feature | Reason |
|---------|--------|
| User accounts / login | Privacy and infra burden; wizard + chat are stateless by design |
| Comments / community discussion in-product | Moderation overhead; GitHub Issues/Discussions suffice |
| Lead-gen forms / email capture | Site is a public knowledge resource, not a funnel |
| Cookie banners | No cookies dropped; zero-tracking analytics by design |
| Push notifications | Out of scope for a static site; RSS is the subscription mechanism |
| Social-share buttons | Third-party tracking risk + zero impact on goal |
| Auto-merging AI-drafted PRs without review | A governance site that auto-publishes unreviewed AI content is self-contradictory (Pitfall 3) |
| Becoming a SaaS GRC tool | No risk registers, model inventories, evidence repos — we *explain* governance, we don't *operate* a platform |
| Becoming a legal-advice service | Site explains and points to authoritative sources; per disclaimer + lawyer review |
| AI-persona assistant with a name/avatar | Adds anthropomorphism that complicates the disclaimer story |
| Gamification / streaks / badges | Trivializes a serious domain |
| Inline ads / sponsored content | Trust posture — open knowledge base, no commercial pressure |
| Real-time chat between users | Outside core value; would need accounts and moderation |
| Mobile-app builds | Web-first; great mobile web is sufficient |
| Public release before full v1 ships | Trust posture — half-built governance content erodes credibility |

---

## Traceability

Every v1 requirement maps to exactly one phase.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FND-01 | Phase 1 | Pending |
| FND-02 | Phase 1 | Pending |
| FND-03 | Phase 1 | Pending |
| FND-04 | Phase 1 | Pending |
| FND-05 | Phase 1 | Pending |
| FND-06 | Phase 1 | Pending |
| FND-07 | Phase 1 | Pending |
| FND-08 | Phase 1 | Pending |
| FND-09 | Phase 1 | Pending |
| FND-10 | Phase 1 | Pending |
| FND-11 | Phase 1 | Pending |
| FND-12 | Phase 1 | Pending |
| FND-13 | Phase 1 | Pending |
| FND-14 | Phase 1 | Pending |
| CNT-01 | Phase 2 | Pending |
| CNT-02 | Phase 2 | Pending |
| CNT-03 | Phase 2 | Pending |
| CNT-04 | Phase 2 | Pending |
| CNT-05 | Phase 2 | Pending |
| CNT-06 | Phase 2 | Pending |
| CNT-07 | Phase 2 | Pending |
| CNT-08 | Phase 2 | Pending |
| CNT-09 | Phase 2 | Pending |
| CNT-10 | Phase 2 | Pending |
| CNT-11 | Phase 2 | Pending |
| TRK-01 | Phase 3 | Pending |
| TRK-02 | Phase 3 | Pending |
| TRK-03 | Phase 3 | Pending |
| TRK-04 | Phase 3 | Pending |
| TRK-05 | Phase 3 | Pending |
| TRK-06 | Phase 3 | Pending |
| TRK-07 | Phase 3 | Pending |
| TRK-08 | Phase 3 | Pending |
| TRK-09 | Phase 3 | Pending |
| TRK-10 | Phase 3 | Pending |
| TRK-11 | Phase 3 | Pending |
| TRK-12 | Phase 3 | Pending |
| TRK-13 | Phase 3 | Pending |
| TRK-14 | Phase 3 | Pending |
| TRK-15 | Phase 3 | Pending |
| TRK-16 | Phase 3 | Pending |
| TRK-17 | Phase 3 | Pending |
| WIZ-01 | Phase 4 | Pending |
| WIZ-02 | Phase 4 | Pending |
| WIZ-03 | Phase 4 | Pending |
| WIZ-04 | Phase 4 | Pending |
| WIZ-05 | Phase 4 | Pending |
| WIZ-06 | Phase 4 | Pending |
| WIZ-07 | Phase 4 | Pending |
| CHT-01 | Phase 5 | Pending |
| CHT-02 | Phase 5 | Pending |
| CHT-03 | Phase 5 | Pending |
| CHT-04 | Phase 5 | Pending |
| CHT-05 | Phase 5 | Pending |
| CHT-06 | Phase 5 | Pending |
| CHT-07 | Phase 5 | Pending |
| CHT-08 | Phase 5 | Pending |
| CHT-09 | Phase 5 | Pending |
| CHT-10 | Phase 5 | Pending |
| CHT-11 | Phase 5 | Pending |
| CHT-12 | Phase 5 | Pending |
| CHT-13 | Phase 5 | Pending |
| SRC-01 | Phase 1 | Pending |
| SRC-02 | Phase 1 | Pending |
| SRC-03 | Phase 5 | Pending |
| TAD-01 | Phase 6 | Pending |
| TAD-02 | Phase 6 | Pending |
| TAD-03 | Phase 6 | Pending |
| TAD-04 | Phase 6 | Pending |
| TAD-05 | Phase 6 | Pending |
| TAD-06 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 71 total
- Mapped to phases: 71 (100%)
- Unmapped: 0 ✓

**Per-phase requirement counts:**
- Phase 1 (Foundation & Chrome): 16 reqs (FND-01..14, SRC-01, SRC-02)
- Phase 2 (Content Spine): 11 reqs (CNT-01..11)
- Phase 3 (Tracking Pipeline): 17 reqs (TRK-01..17)
- Phase 4 (Deterministic Wizard): 7 reqs (WIZ-01..07)
- Phase 5 (RAG Chat): 14 reqs (CHT-01..13, SRC-03)
- Phase 6 (Polish & Pre-Launch Gate): 6 reqs (TAD-01..06)

---
*Requirements defined: 2026-05-24*
*Last updated: 2026-05-24 after roadmap creation (traceability populated)*
