# AI Governance

## What This Is

A maintained, public knowledge site + companion repository that explains AI governance in plain language and guides companies on how to implement it. The site is structured as a 12-stage **AI Governance Journey** (Policy → Risk Tiering → ... → Monitoring), tracks the world's authoritative regulations and vendor frameworks, and shows exactly what changed week-to-week so practitioners can stay current without reading 500 pages of legislation themselves.

The audience is mixed — executives, engineers, and compliance officers — and the same content is surfaced through persona lenses so each reader gets what they need without context-switching.

## Core Value

**A practitioner with no prior AI-governance background can land on this site, follow a story, and walk away with a concrete, current, regulation-aware plan for their company — and be confident the content reflects the world *as of this week*, not last year.**

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. v1 = the full vision. -->

**Content & Narrative**
- [ ] All 12 stages of the AI Governance Journey covered as deep, standalone explainers
- [ ] Each topic told as a story — a fictional company being walked through that stage
- [ ] Each topic surfaces three persona lenses (exec / engineer / compliance) on the same canonical content
- [ ] Plain-language framing (no unexplained jargon; defined terms link to a glossary)

**Regulation & Source Tracking**
- [ ] Scheduled ingestion of EU AI Act + UK regulation (ICO, sector regulators)
- [ ] Scheduled ingestion of US sources (NIST AI RMF, US Executive Order, state laws)
- [ ] Scheduled ingestion of global standards (ISO/IEC 42001, OECD, India MEITY, Singapore, Japan)
- [ ] Scheduled ingestion of vendor + security frameworks (OpenAI / Anthropic / Google / Microsoft / Meta policies, OWASP LLM Top 10, MITRE ATLAS, PyRIT, Garak)
- [ ] Each tracked source has a snapshot history stored in git
- [ ] Each topic page is mapped to the regulations it touches

**Change Tracking UX**
- [ ] Per-page changelog with "Last updated" and "What changed" timeline
- [ ] Global "What's new" feed across all topics and tracked sources
- [ ] Click-through to a red/green text diff for any change

**Guidance & Interaction**
- [ ] Guided wizard (no LLM) that asks deployer-or-provider, jurisdiction, risk tier, etc., and outputs a tailored implementation checklist the user can save/print
- [ ] RAG-powered chat grounded in the site's content + tracked regs, with inline citations linking back to source pages
- [ ] Client-side search across all content

**Pipeline & Maintenance**
- [ ] Hybrid content pipeline: regs auto-tracked + diffed, vendor news AI-drafted into PRs, core narrative human-authored with AI assistance
- [ ] AI-drafted changes open as pull requests for human review (never auto-merged without review)
- [ ] Build is reproducible from any commit; deploying = git push

**Distribution & UI**
- [ ] Site hosted on GitHub Pages (static); chat API hosted as a serverless function (Cloudflare Workers or equivalent)
- [ ] UI quality is a first-class requirement — fast, beautiful, mobile-first, accessible
- [ ] Repo serves as the artifact itself (open knowledge base on launch)

### Out of Scope

- **User accounts / personalization with login** — privacy and infra burden not worth it for a public knowledge site; wizard + chat can be stateless
- **Multi-language / i18n** — English-only for v1; translation is a separate effort
- **Comments / community discussion in-product** — issues/discussions on GitHub are sufficient and avoid moderation overhead
- **Becoming a legal-advice service** — site explains and points to authoritative sources; it does not substitute for counsel (must be clearly disclaimed)
- **Becoming a SaaS GRC tool** — no risk registers, model inventories, evidence repositories; we *explain* governance, we don't *operate* a GRC platform
- **Auto-publish without human review** — speed is not worth the trust hit on a domain where wrong content is harmful
- **Public-facing release before the full vision works** — repo stays private until end-to-end experience is launchable

## Context

**Domain landscape (May 2026):**
- EU AI Act has been live since Aug 2025; high-risk obligations and serious-incident reporting (72h) are in force
- US Executive Order on AI + NIST AI RMF are the de-facto US baseline; state laws (CO, NY, CA) are layering on
- ISO/IEC 42001 (AI management system standard) is emerging as the certifiable "ISO 27001 for AI"
- UK is post-white-paper, sector-regulator-led (ICO, FCA, MHRA each shipping their own AI guidance)
- Vendor policies (OpenAI / Anthropic / Google / Microsoft / Meta) shift quarterly and matter for deployer compliance
- Adversarial ML / red-teaming (OWASP LLM Top 10, MITRE ATLAS, PyRIT, Garak) is now an expected control for high-risk systems

**Reference structure:**
The site's spine is the 12-stage "AI Governance Journey" diagram by Dan Storbaek (provided as project context):
**START → AI Policy → EU AI Act Risk Tiering → Risk Check → Compliance → Third-party AI Risk → Data Controls → Continuous Red-teaming → Documentation → Accountability → Agentic AI Oversight → Success → Incident Response → Monitoring → END**

**Why this site needs to exist:**
Existing material is either (a) primary-source legalese, (b) vendor marketing, or (c) consultancy whitepapers behind gates. There is no plain-language, source-cited, regulation-tracking, "what changed this week" reference written for mixed audiences.

**Operating model:**
Anand (the author) writes the canonical narrative; AI agents propose updates as PRs; humans approve before publish. The repo is the source of truth and the artifact.

## Constraints

- **Hosting**: GitHub Pages for the static site; serverless function (Cloudflare Workers free tier preferred) for chat API — must stay near zero ongoing cost
- **Trust**: Content must cite authoritative sources for every regulatory claim; auto-generated content must be marked and human-approved before merge
- **Maintainability**: Pipeline must run unattended on a schedule (GitHub Actions cron) and surface noise-free PRs — a tired maintainer must be able to skim a week of changes in 15 minutes
- **Privacy**: No user tracking that requires consent banners; no analytics that store PII; chat queries are not retained
- **Performance**: Static pages must achieve excellent Core Web Vitals; chat must stream first token in under ~1s on typical connections
- **Accessibility**: WCAG 2.2 AA is the baseline (this is a governance site — it has to walk the talk)
- **Time to public launch**: Build privately until the full v1 vision works end-to-end; no shipping a half-built version

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Static site on GitHub Pages + serverless chat function | Near-zero hosting cost, git-native change tracking, public-knowledge-base feel; serverless covers the one dynamic need (RAG chat) | — Pending |
| Hybrid content pipeline (auto regs / AI-drafted vendor news / manual narrative) | Different sources warrant different cadence and trust levels; one-size pipeline would either be too slow for regs or too sloppy for narrative | — Pending |
| Storbaek 12-stage journey as the narrative spine, with persona lenses and other entry points layered on top | The journey gives readers a clear mental model; lenses and search ensure no one is forced down a linear path | — Pending |
| Both wizard (deterministic playbook) AND RAG chat (open Q&A) | Wizard handles "give me the checklist for my situation"; chat handles "what does Article 11 mean for me" — different jobs | — Pending |
| Full diff view (per-page changelog + global feed + red/green text diffs) | The change-tracking story is the site's differentiator vs static wikis; halfway treatment would undercut the value prop | — Pending |
| Private repo until the full v1 ships publicly | Half-built governance content erodes trust; better to launch complete | — Pending |
| Human-in-the-loop on every AI-drafted change | A governance site that itself auto-publishes unreviewed AI content would be ironic; PR workflow is the trust mechanism | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-24 after initialization*
