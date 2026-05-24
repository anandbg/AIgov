# Feature Research

**Domain:** Public knowledge site explaining a regulated, fast-moving technical domain (AI governance) to mixed audiences (executives, engineers, compliance officers)
**Researched:** 2026-05-24
**Confidence:** HIGH for table stakes and anti-features; MEDIUM-HIGH for specific UX recommendations (cross-checked against 3+ exemplars per group)

---

## TL;DR

Build the v1 around six load-bearing features: (1) **the 12-stage narrative spine** rendered as deep MD/MDX explainers with a fictional-company story flowing through each stage, (2) **persona lenses** as inline filterable callouts on the same canonical page (not separate URLs, not a global toggle), (3) **per-page changelog + global "What's new" feed + red/green text diffs** powered by git, (4) a **deterministic wizard** that outputs a printable + shareable-URL checklist (no login), (5) **RAG chat** with Perplexity-style inline numbered citations and source hover cards, and (6) **Pagefind client-side search** with glossary-term tooltips on hover throughout the prose. The Storbaek 12-stage diagram is the canonical entry-point visual (Mermaid).

The biggest differentiators vs IAPP/OECD/AI Act Explorer are: **plain-language story framing**, **week-resolution change tracking with actual diffs** (not just "updated on..."), and **persona-aware regulation mapping** (one click on Article 11 shows the exec/engineer/compliance read). Everything else is table stakes — fail one and the site feels like a half-built blog.

Deliberately **not building**: user accounts, comments, lead-gen forms, paywall/login, multi-language, interactive risk-register / GRC operation, social sharing buttons, dark patterns, cookie banners, push notifications, gamification, "AI advisor" personas, automated PR auto-merge.

---

## Feature Landscape

### Table Stakes (Readers Expect These)

If any one is missing, a visitor's mental model is "this is a blog, not a reference."

| # | Feature | Why Expected | Complexity | Phase Fit | Notes |
|---|---------|--------------|------------|-----------|-------|
| TS-1 | **12 stage explainer pages** (one per Storbaek stage) | The site's value prop is the journey; without the full set it's a teaser. | L | v1 launch | Each ~1500–3500 words, story-framed, with persona callouts, glossary links, regulation cross-refs. |
| TS-2 | **Per-topic "Last updated" + change log** | Visitors landing from search must know if content is stale. Standard pattern on IAPP, AI Act Explorer, gdpr.eu. | S | v1 launch | Git-derived; auto-rendered from commit metadata. |
| TS-3 | **Global "What's new" / changelog feed** | Returning readers want a one-glance "what moved this week." OECD, IAPP, gdpr.eu all have variations. | M | v1 launch | Reverse-chronological linear list, grouped by week. Not a Facebook-style feed (avoid noise). |
| TS-4 | **Client-side search across all content** | Modern docs site (Stripe, Algolia DocSearch, Starlight default) — search shortcut on ⌘K/Ctrl-K. | S | v1 launch | Pagefind via Starlight, zero config. |
| TS-5 | **Glossary with hover tooltips on defined terms** | Mixed audience requires plain-language defs; readers expect a hover popup, not a footnote round-trip. Pattern documented across Writerside, Hugo, etc. | M | v1 launch | Centralized glossary collection; terms wrapped in `<dfn>` with hover cards. Cap tooltip body ~10–20 words. |
| TS-6 | **Inline links to authoritative regulation sources** | Every regulatory claim must cite primary source — this is the trust floor for a governance site. | S | v1 launch | Per-paragraph link out + canonical citation at section foot. |
| TS-7 | **Mobile-responsive, keyboard-navigable layout** | 2026 baseline. WCAG 2.2 AA is in the project constraints. | M | v1 launch | Starlight default + axe-core gate in CI. |
| TS-8 | **Table of contents per long page** | Long-form docs without TOC feel unusable. Starlight provides this OOTB. | S | v1 launch | Auto-generated from headings; sticky on desktop. |
| TS-9 | **Sidebar navigation showing the 12-stage spine** | Readers must always see where they are in the journey. | S | v1 launch | Sidebar with current-stage highlight + prev/next links at page foot. |
| TS-10 | **Dark mode** | Expected on any 2026 dev/policy site. | S | v1 launch | Starlight default. |
| TS-11 | **Per-source "Tracked regulations" index** | Readers landing on EU AI Act / NIST RMF want a one-page rollup: current version, snapshot dates, mapped stages. | M | v1 launch | One page per tracked source; auto-rendered from scrape manifest. |
| TS-12 | **Disclaimer that this is not legal advice** | Required to avoid trust + liability hits in regulated domain; standard on every gov-info site. | S | v1 launch | Persistent footer disclaimer + per-page banner on regulation pages. |
| TS-13 | **Canonical 12-stage diagram on the landing page** | The Storbaek journey *is* the mental model; landing without it loses the spine. | S | v1 launch | Mermaid via `astro-mermaid`. |
| TS-14 | **RSS / Atom feed for "What's new"** | Practitioners track 5–10 sources; feed support is how they keep up without checking. | S | v1 launch | Auto-generated from changelog. |
| TS-15 | **Print stylesheet for explainer pages** | Compliance officers print to share internally. Standard pattern. | S | v1 launch | `@media print` rules; hide nav/chat. |
| TS-16 | **OG/Twitter card metadata per page** | Pages shared in Slack/LinkedIn need preview cards. Baseline 2026. | S | v1 launch | Starlight has basic; extend with stage-specific OG images. |
| TS-17 | **Stable URLs / no slug drift** | Citations from external sites (the whole point of a public reference) must not 404. | S | v1 launch | Redirect map maintained per-rename. |

### Differentiators (Why This Site, Not IAPP)

Where the site competes. Anchor on what Core Value asks for: *current, regulation-aware, plain-language, mixed-audience*.

| # | Feature | Value Proposition | Complexity | Phase Fit | Notes |
|---|---------|-------------------|------------|-----------|-------|
| D-1 | **Fictional company story woven through each stage** | "Acme Robotics deploys a CV model" runs from policy to monitoring — gives readers a concrete grounding the IAPP/Stanford trackers do not. | M | v1 launch | Recurring sidebar character card ("Acme Robotics — Stage 3 of 12") + story callouts inline. Not full short fiction; ~150-word vignettes at section breaks. |
| D-2 | **Persona lenses (exec / engineer / compliance) on the same page** | One canonical doc serves three audiences without three docs to maintain. Differentiator vs Stripe-style separate-doc-tree approach. | M | v1 launch | Inline tabbed callouts at section level + a single sticky toggle that visually emphasizes the active lens (collapses others to one-line summaries). |
| D-3 | **Red/green text-level diffs for every tracked regulation change** | Practitioners want to know *what words changed*, not just "updated on." AI Act Explorer + OECD do not show actual diffs. | M | v1 launch | `git diff` → `diff2html` (jsdiff for word-level on prose). Clickable from changelog entries. |
| D-4 | **Weekly cadence + visible "scraped X ago" timestamp on every tracked source** | "As of this week" is in Core Value. Make freshness visible — most trackers are silent about staleness. | S | v1 launch | Scrape script writes `lastChecked` + `lastChanged` to frontmatter; render in source-page header. |
| D-5 | **Topic ↔ regulation matrix** | One-click answer to "which regulations touch this stage?" and the reverse "which stages does Article 11 affect?" Stanford HAI tracks but doesn't cross-map. | M | v1 launch | Bidirectional `regulations[]` field in stage frontmatter + Zod-validated; rendered as a sidebar block and a separate matrix view. |
| D-6 | **Deterministic wizard → tailored checklist (printable + shareable URL)** | No-login playbook generator. Not LLM, so reproducible and citable. Differentiator vs both gdprchecklist.io (static) and consultancy gates. | M | v1 launch | Pure client-side decision tree; state encoded in URL hash (`#deployer=true&jurisdiction=eu&risk=high`); print stylesheet for PDF; "copy markdown" button. No saved profiles, no email capture. |
| D-7 | **RAG chat with inline numbered citations + source hover cards** | 2026 best practice (Perplexity, NotebookLM). Hovering a [1] shows snippet + link; clicking opens the page. | L | v1 launch | Worker streams response with citation markers; client renders hover cards from a sidecar source list. Confirmed as current best practice — NotebookLM hover-over-citation is "considered a game-changer" per the visibilie.com source below. |
| D-8 | **Plain-language defined-terms layer (glossary tooltips everywhere)** | Mixed-audience requires lower context cost; differentiator vs primary-source legalese. | M | v1 launch | Build-time pass auto-wraps glossary terms in prose with `<dfn data-term="...">`; hover renders definition. Skip in code/headings. |
| D-9 | **"Compare snapshots" picker on tracked sources** | Beyond per-change diff: "show me everything that changed between v1.0 and v1.4." | M | v1.1 | URL-driven, two snapshot dropdowns, server-rendered diff. Defer to v1.1 if it slows launch. |
| D-10 | **Open source repo as the artifact** | Repo *is* the citation — readers can verify methodology, propose edits via PR, fork. Differentiator vs IAPP (closed) and consultancy whitepapers (gated). | S | v1 launch | Already in the constraints; surface a "View source / edit on GitHub" link per page. |
| D-11 | **Per-page "Read time" + persona-weighted variants** | Helps execs decide "is this 4 min or 25 min for me?" | S | v1.1 | Compute at build time; show executive read time, engineer read time separately when persona expansions differ. |
| D-12 | **Stage-level Mermaid micro-flows** | Each stage has its own mini sub-process diagram (e.g., risk-tiering decision flow). Visual reinforcement of the spine. | M | v1 launch | `astro-mermaid` per page. |
| D-13 | **Zero-tracking analytics** | Honest signal in a domain where everyone deploys cookie-consent walls. Trust-builder. | S | v1 launch | Cloudflare's free aggregate analytics (cookieless); no GA/Plausible. Document in privacy notice. |
| D-14 | **Citation badge on AI-drafted sections** | When a section was opened by an AI PR and approved, label it transparently. Walks the talk on AI governance. | S | v1.1 | Frontmatter flag `draftedBy: ai-PR-#123`; small badge in section header. |
| D-15 | **"What's similar" cross-links between stages** | Stage 2 (Risk Tiering) and Stage 4 (Compliance) overlap; cross-link with explicit "related" panel. | S | v1.1 | Manual `related: []` frontmatter, rendered as bottom-of-page cards. |
| D-16 | **Wizard outputs include source citations next to every checklist item** | Differentiator vs gdprchecklist.io — each item cites the regulation that produced it. | S | v1 launch | Each rule in the decision tree carries `sources: []`; rendered next to the checkbox. |
| D-17 | **"Why this matters" callouts written for non-lawyers** | The "so what" panel under every regulatory citation — what does Article 11 mean for a 20-person SaaS, in two sentences. | M | v1 launch | Style as visually distinct from primary content; can be authored alongside or by AI-drafted PR. |
| D-18 | **Searchable, filterable "vendor policy" rollups** | Aggregates current OpenAI/Anthropic/Google/Microsoft/Meta usage policies in one place with diffs. Saves practitioners hours. | M | v1 launch | One page per vendor, auto-updated; same diff treatment as regs. |
| D-19 | **Adversarial-ML control catalogue (OWASP LLM Top 10, MITRE ATLAS, Garak)** | These are now expected controls — surfacing them in plain English next to the regulation that demands them differentiates from pure policy trackers. | M | v1 launch | Cross-listed from the "Continuous Red-teaming" stage. |
| D-20 | **Citation export ("cite this page")** | Practitioners writing internal docs want a clean reference (BibTeX, APA, Markdown). Differentiator borrowed from arXiv/Nature pattern. | S | v1.1 | Modal with copy-able citation formats; include page version hash. |

### Anti-Features (Commonly Requested, Deliberately Not Built)

| # | Feature | Why Requested | Why Problematic | Alternative |
|---|---------|---------------|-----------------|-------------|
| AF-1 | **User accounts / logins** | "Save your wizard results, get personalized updates" | Privacy burden, infra cost, GDPR scope creep, breaks no-tracking promise, adds maintenance forever. Explicitly out of scope per PROJECT.md. | Wizard state in URL hash; RSS for updates; print/copy for the checklist. |
| AF-2 | **Comments / community discussion** | "Engagement!" | Moderation cost (especially on regulatory content where wrong-info is harmful), spam, off-topic drift. Explicitly out of scope. | GitHub Issues/Discussions for the repo; "Edit on GitHub" link per page. |
| AF-3 | **Lead-gen forms / email gates** | "Build a list, monetize." | Project is non-commercial; gating regulatory info erodes trust and clashes with the IAPP/consultancy pattern we're explicitly counter-positioning against. | None — content is fully open. RSS for those who want updates. |
| AF-4 | **Multi-language / i18n** | EU AI Act exists in 24 languages; readers want their language. | 24x maintenance cost for a one-person canonical author. Explicit out of scope. | Link to official multilingual primary sources. |
| AF-5 | **Cookie consent banner** | Standard pattern. | Required only if you set non-essential cookies — by choosing cookieless analytics we avoid this entirely. Trust-builder. | Zero cookies; static privacy notice page. |
| AF-6 | **Push notifications / web push** | "Keep readers engaged" | Permission-prompt blight, low signal/noise, privacy entanglement. | RSS, GitHub watch, optional email digest (mailto, no list management). |
| AF-7 | **Social-share buttons (Twitter/LinkedIn/etc.)** | "Make it shareable" | Adds trackers, visual clutter, low actual usage. URLs are already shareable. | Copy-URL button (zero JS). |
| AF-8 | **Live chat / human support widget** | "Help users." | Cost, expectation creep, off-hours fail. Wizard + chat + GitHub Issues handle real questions. | None. |
| AF-9 | **In-product community / forum** | "Build a community" | Tied to AF-2; same reasons. | GitHub Discussions in the repo. |
| AF-10 | **Risk register / model inventory / GRC operation** | "Why explain when you can DO?" | Explicit out of scope — we are not a GRC SaaS. Crossing this line means PII, accounts, compliance liability. | Point to existing GRC tools (Holistic AI, OneTrust, etc.) where relevant. |
| AF-11 | **AI-persona "assistant" with name and avatar** | Trendy. | Adds anthropomorphic surface area; clashes with the no-hype, source-cited tone. Chat is functional, not a character. | Plain chat panel labelled "Ask the docs." |
| AF-12 | **Auto-publishing AI-drafted content** | Speed. | Explicit out of scope per PROJECT.md; trust hit is catastrophic on a governance site. | PR workflow + human reviewer. |
| AF-13 | **Gamification (badges / streaks / "level up")** | Engagement. | Inappropriate for regulatory content; trivializes the domain; classic anti-pattern for serious knowledge tools. | None. |
| AF-14 | **Inline ads / sponsorships** | "Sustainability." | Erodes trust on a "we don't sell you anything" knowledge site. Project is no-commercial. | GitHub sponsors, optional; never on-page. |
| AF-15 | **Heavy front-page hero with video + parallax** | Marketing aesthetic. | Hurts LCP/INP, hurts accessibility, makes the site feel like a product brochure rather than a reference. | Honest landing: 12-stage diagram + one-line value prop + search. |
| AF-16 | **A "compare jurisdictions" feature beyond v1** | Looks compelling. | Requires multi-jurisdiction expertise we may not have at v1 quality; risk of presenting wrong cross-references with high confidence. | Per-jurisdiction source pages first; cross-jurisdiction view only after the per-jurisdiction layer is solid. Defer to v2. |
| AF-17 | **AI-generated "Did you mean..." search suggestions** | Looks smart. | Adds LLM call to every search; Pagefind handles prefix matches already. | Pagefind defaults. |
| AF-18 | **A "save / favourite" feature for pages** | "Useful for return readers." | Requires accounts or local storage UX that confuses without sync. | Browser bookmarks. |
| AF-19 | **Per-user wizard history** | "Resume your assessment." | Requires accounts. | Bookmarkable URL hash captures the whole state. |
| AF-20 | **Vector-only search (replace Pagefind with RAG search)** | "Smart search." | Worse for known-term lookup, slower, more cost, removes offline capability. Pagefind + RAG chat is the right split. | Keep both — Pagefind for find-this-page, chat for answer-this-question. |
| AF-21 | **Custom code-block syntax themes per persona** | Cool. | Maintenance for marginal value. | One theme matched to Starlight defaults. |
| AF-22 | **"Subscribe to a specific regulation"** | Sounds useful. | Requires email list + per-source filter logic + delivery infra. RSS does this for free. | Per-source RSS feeds (`/sources/eu-ai-act/feed.xml`). |

---

## Specific UX Recommendations

These are called out because they're high-leverage decisions that shape v1.

### Citation UX (How Should Regulation Citations Render?)

**Recommendation:** Hybrid — **inline links** in prose, **footnote-style citation block** at end of each major section, **hover cards** for primary regulation cites.

| Pattern | Use when |
|---------|----------|
| Inline link (`[Article 11](url)`) | Single citation, conversational prose, link is obvious. |
| Footnote/endnote bracketed `[12]` with sidebar definition | Multiple cites stacking in one paragraph. |
| Hover card (NotebookLM/Perplexity style) | Primary regulation references — show citation snippet + jurisdiction + date in a popover. |
| Sidebar "Sources for this section" | At the end of each H2 section, render an explicit collapsible source list. |

**Avoid:** opening cited sources in modal overlays (breaks back-button); inline expand/collapse for long citations (DOM bloat); requiring a click to even see the citation (defeats trust signal).

Build cost: M. Reuse the chat citation component for in-page hover cards.

### Persona Lens UX (Toggle? URL? Inline?)

**Recommendation:** **Inline persona callouts on a single canonical page**, with a sticky **global lens toggle** that visually emphasizes the active persona and de-emphasizes (collapses to one-line summaries) the others. No separate URLs.

Why not:
- **Three separate pages per topic:** 3x maintenance, fragments the URL ecosystem, breaks search, breaks linking ("which version did you mean?").
- **Three separate sites/subdomains:** even worse.
- **Click-to-reveal tabs:** hides content from non-active-persona readers who may want to skim all three.

The chosen pattern keeps the canonical content unified, makes lenses additive (not exclusive), and degrades gracefully when JS is off (all three lenses expanded). This is closer to Stripe's docs-with-toggleable-language-blocks than to a hard persona split.

Implementation: MDX component `<Lens persona="exec">...</Lens>`; client-side script reads `localStorage.activePersona` and emphasizes; URL param `?lens=exec` overrides for shareable links.

Build cost: M.

### Wizard Output Format

**Recommendation:** **Three output paths from the same wizard result page**: (1) **print stylesheet → "Save as PDF"** via browser print, (2) **shareable URL** (state in hash) that anyone can open to see the same checklist, (3) **"Copy as Markdown"** button for pasting into Notion/Jira/internal wikis.

No PDF generation server-side (adds infra). No email-me-the-result (adds email infra + privacy scope).

Each checklist item includes:
- The action ("Document a risk assessment for each high-risk system")
- The regulation citation that produced it ("EU AI Act Art. 9")
- A link to the stage page that explains it
- A checkbox (local-only, not persisted)

Build cost: M. The wizard logic is the hard part; the output formats are cheap once the result page exists.

### Chat Citation Pattern

**Recommendation:** **Inline numbered citations `[1] [2]` with hover cards** — confirmed as current best practice. NotebookLM and Perplexity converge on this pattern, and the user-research signal (users hover ~2 sources per answer-engine query vs 12 per traditional search) suggests inline cites materially shift trust.

Render contract:
- Worker streams response text with `[[cite:doc-id:chunk-id]]` markers.
- Client replaces markers with numbered links (`[1]`, `[2]`) inline.
- A sidecar source list renders below the response (collapsible).
- Hovering a number opens a popover with: source title, jurisdiction, snippet (first ~200 chars of the cited chunk), and a "Open page" link.
- Clicking the number scrolls to the source list item and pulses it.

Use Anthropic's native Citations API for grounding so the cite-to-chunk mapping is authoritative, not LLM-claimed.

Build cost: L for the full UX, but the bulk is wiring; the design pattern is settled.

### "What Changed" Timeline UX

**Recommendation:** **Linear, reverse-chronological changelog list grouped by ISO week**, not a feed and not a heatmap.

| Pattern | Why not |
|---------|---------|
| Facebook-style feed | Encourages skimming/dismissal; bad for "I need to find what changed last March." |
| Calendar heatmap | Looks cool, low information density per unit screen; works for "activity over time" but not "what changed." |
| Linear list grouped by week | Scannable, deep-linkable per week, RSS-friendly, plays well with search. **Chosen.** |

Each entry: `[Source] · [Date] · One-line summary · "View diff →"`. Filter chips at top: by source, by stage. Permalinks `/whats-new/2026-W21`.

Build cost: M. The git plumbing is the work; the UI is a list.

### Story Framing UX

**Recommendation:** **Recurring fictional company ("Acme Robotics") introduced once on the landing page, with a sidebar character/profile card on every stage page + inline story vignettes (~150 words) at section boundaries.** Not full short-fiction chapters, not just abstract examples.

Sidebar card example:
```
ACME ROBOTICS
50-person CV startup
Stage: 4 of 12 (Compliance)
Risk: high-risk Annex III
Jurisdiction: EU + US
```

Inline vignettes are visually distinct (italic + left border) and always show the company hitting the stage's central decision: "Acme's CTO realizes their model retrain pipeline lacks a version-pinned eval set..."

Why not full short-fiction chapters: too much scroll cost for engineers/compliance who want the reference content, not narrative. Why not just abstract examples: defeats the differentiator. The middle is the right level.

Build cost: M. The hard part is writing them well; the rendering is trivial.

---

## Feature Dependencies

```
TS-1 (12 stage pages)
    └──requires──> TS-9 (sidebar nav of the spine)
    └──requires──> TS-13 (12-stage landing diagram)
    └──enables──> D-1 (story vignettes per stage)
    └──enables──> D-2 (persona lenses inline)

TS-2 (per-page changelog) + TS-3 (global feed) + D-3 (diff viewer)
    └──all require──> Git-derived build pipeline that surfaces commit metadata
    └──enable──> D-4 (visible scrape timestamps)
    └──enable──> D-9 (snapshot-to-snapshot compare)
    └──enable──> TS-14 (RSS feed)

D-6 (wizard)
    └──requires──> Decision-tree authoring layer (Zod schema for rules)
    └──requires──> URL hash → wizard state hydrator
    └──enables──> D-16 (wizard items cite sources) — only useful if D-5 (topic↔reg matrix) exists

D-7 (RAG chat)
    └──requires──> Worker + Vectorize + Anthropic API (see STACK.md)
    └──requires──> Pre-computed embeddings of all content (build-time step)
    └──depends_on──> TS-1 (need content to ground in)
    └──depends_on──> TS-11 (need source pages to cite to)
    └──enhances──> D-8 (citation hover cards can share component)

TS-5 (glossary tooltips) + D-8 (auto-wrap)
    └──requires──> Glossary collection (Zod schema)
    └──requires──> Build-time term-detection pass
    └──conflicts──> Tooltip-on-every-instance (intentionally limit to first occurrence per page)

D-2 (persona lenses)
    └──conflicts_with──> Separate persona URLs / sites (do not do both)
    └──enhances──> D-7 (chat can be persona-aware: if lens=exec, prefer exec-framed snippets)

D-5 (topic ↔ regulation matrix)
    └──requires──> Zod-validated bidirectional refs in frontmatter
    └──enables──> TS-11 (source rollup pages)
    └──enables──> D-16 (wizard items linkable to reg pages)

TS-12 (disclaimer)
    └──must_precede──> public launch (legal floor)
```

### Dependency Notes

- **Per-page changelog (TS-2), "What's new" feed (TS-3), and diff viewer (D-3) share a single git-derived data pipeline.** Build them as one piece of plumbing or you'll triple the work.
- **Wizard checklist items (D-6) depend on the topic↔regulation matrix (D-5).** Without the matrix, citation links inside wizard output are manual to wire and will rot.
- **Glossary tooltips (TS-5/D-8) should auto-wrap only the first occurrence of each term per page** — wrapping every instance is the classic accessibility/visual-noise anti-pattern.
- **Persona lenses (D-2) should be inline on one URL.** Combining "inline lenses" with "separate URLs per persona" is the worst case — both maintenance burdens and zero benefit.
- **Chat (D-7) and Pagefind search (TS-4) are not substitutes.** Keep both; chat is for "what does this mean for me," search is for "find the page about X."
- **Story vignettes (D-1) and persona lenses (D-2) layer on the same prose.** Author once, present three ways: persona callouts + story vignettes + canonical reference content all coexist on the same page.

---

## MVP Definition

### Launch With (v1 — full private→public release per PROJECT.md)

PROJECT.md is explicit: ship the full v1 vision before public launch. This is not a "ship minimal then iterate publicly" project. So v1 = everything below.

**Content & Narrative (TS-1, TS-9, TS-13, D-1, D-2, D-12, D-17)**
- [ ] All 12 stage pages, ~1500–3500 words each, story-framed
- [ ] Sidebar showing the 12-stage spine with current-stage highlight
- [ ] Landing-page 12-stage Mermaid diagram
- [ ] Acme Robotics fictional company sidebar + inline vignettes per stage
- [ ] Inline persona lens callouts (exec / engineer / compliance) per stage
- [ ] Per-stage micro Mermaid flows where useful
- [ ] "Why this matters" callouts for every regulatory citation

**Regulation & Source Tracking (TS-11, D-4, D-5, D-18, D-19)**
- [ ] Per-source rollup pages for every tracked regulation/framework
- [ ] Visible "Last scraped" + "Last changed" timestamps on every source page
- [ ] Topic ↔ regulation bidirectional cross-reference
- [ ] Vendor policy rollups (OpenAI, Anthropic, Google, Microsoft, Meta)
- [ ] Adversarial-ML control catalogue (OWASP LLM Top 10, MITRE ATLAS, PyRIT, Garak)

**Change Tracking UX (TS-2, TS-3, TS-14, D-3)**
- [ ] Per-page changelog with "Last updated" and timeline
- [ ] Global "What's new" feed grouped by ISO week
- [ ] Red/green text-level diffs for any tracked change
- [ ] RSS/Atom feeds (global + per-source)

**Search, Glossary, Chat, Wizard (TS-4, TS-5, D-6, D-7, D-8, D-16)**
- [ ] Pagefind client-side search with ⌘K
- [ ] Glossary with hover tooltips on first occurrence of defined terms
- [ ] Deterministic wizard outputs printable + shareable-URL + copy-as-markdown checklist
- [ ] Wizard items cite the regulation that produced them
- [ ] RAG chat with inline numbered citations + source hover cards (Anthropic Citations API)

**Trust, Distribution, Quality (TS-6, TS-7, TS-10, TS-12, TS-15, TS-16, TS-17, D-10, D-13)**
- [ ] Inline links to authoritative regulation sources on every claim
- [ ] WCAG 2.2 AA compliance verified in CI (axe-core)
- [ ] Dark mode (Starlight default)
- [ ] "Not legal advice" disclaimer in footer + per-regulation-page banner
- [ ] Print stylesheet for stage pages and wizard output
- [ ] OG/Twitter metadata per page (extend Starlight defaults)
- [ ] Stable URLs with redirect map maintained per rename
- [ ] "View source / edit on GitHub" link per page
- [ ] Cloudflare zero-tracking analytics; published privacy notice

### Add After v1 Launch (v1.1)

Things that are real value but the launch can live without.

- [ ] **D-9** "Compare snapshots" picker for tracked sources — trigger: any source with >3 snapshots stored
- [ ] **D-11** Per-persona read-time estimates — trigger: feedback that exec readers want time signals
- [ ] **D-14** AI-drafted-section badge — trigger: first AI PRs are landing; transparency
- [ ] **D-15** "What's similar" cross-links — trigger: stages have settled, manual curation worth it
- [ ] **D-20** Citation export modal (BibTeX, APA, Markdown) — trigger: external academic/internal citation requests
- [ ] **Per-source RSS sub-feeds** at `/sources/<id>/feed.xml` (extension of TS-14)
- [ ] **Email digest** (mailto-based, no list management) — only if RSS signal proves insufficient

### Future Consideration (v2+)

- [ ] **Cross-jurisdiction compare view** — defer until per-jurisdiction layers are solid (AF-16 risk if rushed)
- [ ] **Audio/podcast summaries per stage** — high cost, defers until clear demand
- [ ] **Interactive case-study walkthroughs** beyond the Acme vignettes
- [ ] **Translation pipeline** — only if user demand strongly signals it (still in current "out of scope")
- [ ] **Persona-aware chat routing** (lens-specific system prompts) — only after observing chat usage patterns
- [ ] **"AI Governance maturity self-assessment"** as a richer wizard variant
- [ ] **Integration with Notion / Confluence / Jira** for exporting wizard output programmatically

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| TS-1 12 stage pages | HIGH | HIGH | P1 |
| TS-2 per-page changelog | HIGH | LOW | P1 |
| TS-3 global "what's new" | HIGH | MEDIUM | P1 |
| TS-4 Pagefind search | HIGH | LOW | P1 |
| TS-5 glossary tooltips | MEDIUM | MEDIUM | P1 |
| TS-6 inline reg links | HIGH | LOW | P1 |
| TS-7 a11y / mobile | HIGH | MEDIUM | P1 |
| TS-9 sidebar spine | HIGH | LOW | P1 |
| TS-11 source rollup pages | HIGH | MEDIUM | P1 |
| TS-12 disclaimer | HIGH | LOW | P1 |
| TS-13 landing diagram | HIGH | LOW | P1 |
| TS-14 RSS feed | MEDIUM | LOW | P1 |
| TS-15 print CSS | MEDIUM | LOW | P1 |
| TS-17 stable URLs | HIGH | LOW | P1 |
| D-1 story vignettes | HIGH | MEDIUM | P1 |
| D-2 persona lenses | HIGH | MEDIUM | P1 |
| D-3 red/green diffs | HIGH | MEDIUM | P1 |
| D-4 scrape timestamps | HIGH | LOW | P1 |
| D-5 topic↔reg matrix | HIGH | MEDIUM | P1 |
| D-6 wizard | HIGH | MEDIUM | P1 |
| D-7 RAG chat | HIGH | HIGH | P1 |
| D-8 glossary auto-wrap | MEDIUM | MEDIUM | P1 |
| D-10 GitHub edit link | MEDIUM | LOW | P1 |
| D-12 stage Mermaid flows | MEDIUM | MEDIUM | P1 |
| D-13 zero-tracking analytics | MEDIUM | LOW | P1 |
| D-16 wizard cites sources | HIGH | LOW | P1 |
| D-17 "why this matters" | HIGH | MEDIUM | P1 |
| D-18 vendor policy rollups | HIGH | MEDIUM | P1 |
| D-19 adversarial-ML catalogue | HIGH | MEDIUM | P1 |
| D-9 snapshot compare | MEDIUM | MEDIUM | P2 |
| D-11 read times | LOW | LOW | P2 |
| D-14 AI-drafted badge | MEDIUM | LOW | P2 |
| D-15 cross-links | MEDIUM | LOW | P2 |
| D-20 citation export | MEDIUM | LOW | P2 |
| All AF-* anti-features | varies | varies | **P0 NOT-DO** (explicit decision) |

**Priority key:**
- P1: Required for v1 launch (per project decision to ship complete)
- P2: Add post-launch when triggers fire
- P3: Future consideration only

The implication: v1 scope is **large** because the project chose "ship complete" over "ship incremental." The phase plan should sequence v1 work into deliverable slices (e.g., spine + chrome → content authoring → tracking → wizard → chat → polish), not de-scope.

---

## Competitor Feature Analysis

| Feature | IAPP Resource Center | AI Act Explorer | OECD AI Observatory | gdpr.eu / GDPR Checklist | Stripe Docs (reference) | **Our Approach** |
|---------|---------------------|-----------------|---------------------|--------------------------|-------------------------|------------------|
| Plain-language explainers | Mostly behind member gate | Some explainers; mostly source text | Policy summaries, dense | Yes (gdpr.eu strong) | Yes (best-in-class) | **Yes — story-framed, persona-aware (differentiator)** |
| Story / fictional company framing | No | No | No | Limited | Limited (snippet examples) | **Yes (D-1, differentiator)** |
| Persona lenses on same page | No (separate audience pages at best) | No | No | No | Toggleable code language (analogous pattern) | **Yes (D-2, differentiator)** |
| Per-doc changelog | Partial (date stamps) | Date stamps; no diffs | Date stamps; no diffs | Partial | Yes ("Updated on") | **Yes + red/green diffs (D-3, differentiator)** |
| Global "what changed" feed | Newsroom-style articles | Some announcements | News feed | Limited | Changelog page | **Yes, with diff click-through (TS-3 + D-3)** |
| Multi-source regulation tracker | Yes (table-driven) | EU only | 1,300+ initiatives, low depth per item | EU/GDPR only | n/a | **Yes, with topic mapping (D-5, D-18)** |
| Search | Site search | Yes | Yes | Yes | Yes (Algolia DocSearch) | **Pagefind client-side (TS-4)** |
| Glossary with tooltips | Glossary as separate page | Some hover defs | No | Partial | No tooltip but linked terms | **Inline hover tooltips (TS-5 / D-8, differentiator)** |
| Citations on every claim | Yes | Yes (source text) | Yes | Yes | n/a | **Yes (TS-6)** |
| Decision-tree wizard | "Compliance Assessment" tool | "EU AI Act Compliance Checker" | Self-assessment tool | gdprchecklist.io (separate) | n/a | **Yes, with source-cited items + shareable URL (D-6 + D-16, differentiator vs static checklist)** |
| RAG chat | No (as of 2026) | No (as of 2026) | No (as of 2026) | No | No (docs are static) | **Yes (D-7, differentiator)** |
| Diff viewer | No | No | No | No | n/a | **Yes (D-3, big differentiator)** |
| Login wall | Yes (premium content) | No | No | No | No (docs free) | **None (intentional)** |
| Comments | No (good) | No (good) | No (good) | No (good) | No (good) | **None (AF-2)** |
| Lead-gen forms | Yes | No | No | No | Soft (signup) | **None (AF-3)** |
| Open-source repo | No | No | No | Partial | Some examples | **Yes (D-10, big differentiator)** |
| Vendor policy tracking | Limited | No | No | No | n/a | **Yes (D-18, differentiator)** |
| Adversarial ML controls | Limited | No | No | No | n/a | **Yes (D-19, differentiator)** |

**Headline takeaways:**
- **Diff viewer + per-page changelog + global feed** is the single biggest competitive gap — every tracker shows dates but not what changed. Combined, these turn a knowledge site into a *monitoring* tool.
- **Persona lenses inline on one page** is unique — competitors either pick one audience or shove three docs at you.
- **Open-source repo** is the second-biggest differentiator vs IAPP/consultancy gated content.
- **RAG chat with proper citations** is leading-edge; nobody in the AI-governance tracker space has shipped it well as of May 2026.
- **Plain-language story framing** is the differentiator vs every primary-source-text site.

---

## Sources

**RAG citation UX**
- [How AI Platforms Choose What to Cite: RAG Explained (Visiblie)](https://www.visiblie.com/blog/how-ai-platforms-choose-sources) — Confirms NotebookLM hover-citation as 2026 best practice; Perplexity averages ~6.6 citations per response.
- [LLM Citation Tracking: How AI Systems Choose Sources (Ekamoira, 2026)](https://www.ekamoira.com/blog/ai-citations-llm-sources) — User-behavior data: ~2 sources hovered on answer engines vs ~12 on traditional search.
- [In-Text Citations like Perplexity (AnythingLLM issue)](https://github.com/Mintplex-Labs/anything-llm/issues/2064) — Implementation pattern reference.

**EU AI Act tracking sites**
- [AI Act Explorer (artificialintelligenceact.eu)](https://artificialintelligenceact.eu/ai-act-explorer/) — 150k monthly users; multi-language side-by-side comparison; user-feedback responsiveness in 1–2 weeks.
- [EU AI Act Compliance Checker (artificialintelligenceact.eu)](https://artificialintelligenceact.eu/assessment/eu-ai-act-compliance-checker/) — Wizard pattern reference for tailored output.
- [EU AI Act implementation timeline](https://artificialintelligenceact.eu/implementation-timeline/) — Pattern for visualizing regulatory evolution over time.

**Policy trackers**
- [IAPP Global AI Law and Policy Tracker](https://iapp.org/resources/article/global-ai-legislation-tracker) — Multi-jurisdiction policy tracking; member-gated for full content.
- [IAPP US State AI Governance Legislation Tracker](https://iapp.org/resources/article/us-state-ai-governance-legislation-tracker) — State-by-state pattern.
- [IAPP AI Governance Center](https://iapp.org/ai-governance) — Persona-resource model.
- [OECD.AI Policy Navigator](https://oecd.ai/en/dashboards/overview) — 1,300+ initiatives; filter by Countries / Policy Instruments / Target Groups (informs our topic↔reg matrix design).
- [OECD.AI Policy Observatory blog (Introducing the Navigator)](https://oecd.ai/en/wonk/introducing-gaiin) — Filter/layout/accessibility improvements rationale.

**Glossary tooltip pattern**
- [Tooltips: Definition, Examples & Best Practices (Docsie)](https://www.docsie.io/blog/glossary/tooltips/) — 10–20 word sweet spot; ARIA / keyboard / screen-reader requirements.
- [Glossary Tooltip Hover with Hugo Shortcodes (DEV)](https://dev.to/uzukwu_michael_91a95b823b/how-i-added-glossary-tooltip-hover-to-kgateway-docs-using-hugo-shortcodes-1e6o) — Implementation reference.
- [JetBrains Writerside Tooltips docs](https://www.jetbrains.com/help/writerside/tooltips.html) — Centralized glossary.xml pattern adapted to our content collections.

**Compliance wizard / checklist patterns**
- [gdprchecklist.io](https://gdprchecklist.io/) — Filterable static checklist; open-source; informs our differentiator (we add per-item citations + tailored output).
- [GDPR.eu compliance checklist](https://gdpr.eu/checklist/) — Industry-standard checklist UX baseline.
- [NIST AI RMF Playbook (AIRC)](https://airc.nist.gov/airmf-resources/playbook/) — Reference for action-oriented framework rendering.
- [Holistic AI NIST AI RMF core elements](https://www.holisticai.com/blog/nist-ai-rmf-core-elements) — Vendor-side framing of the framework.

**Stripe docs (persona / lens pattern reference)**
- [Stripe Documentation](https://docs.stripe.com/) — Audience-segmented navigation; toggleable code-language pattern.
- [Stripe Apps Design Patterns](https://docs.stripe.com/stripe-apps/patterns) — Component-composition UI patterns reference.
- [The Stripe Developer Experience and Docs Teardown (Moesif)](https://www.moesif.com/blog/best-practices/api-product-management/the-stripe-developer-experience-and-docs-teardown/) — Audience-split rationale (developers vs business).

**NIST AI RMF**
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) — Authoritative framework reference.
- [Introduction to the NIST AI RMF Explainer Video](https://www.nist.gov/video/introduction-nist-ai-risk-management-framework-ai-rmf-10-explainer-video) — Government-style explainer baseline.

---

*Feature research for: AI Governance knowledge site (Storbaek 12-stage spine, mixed audiences, regulation tracking, wizard, chat)*
*Researched: 2026-05-24*
