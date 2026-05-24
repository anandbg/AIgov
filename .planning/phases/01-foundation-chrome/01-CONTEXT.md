# Phase 1: Foundation & Chrome - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — 4 areas, 16 decisions, user accepted all recommendations

<domain>
## Phase Boundary

A live, accessible site shell exists at a real URL with every Day-1 pitfall mitigation in place — pnpm monorepo, Astro 6 + Starlight + Tailwind v4, five typed content collections, reusable shell components, GitHub Pages deploy fronted by Cloudflare CDN, CI gates (Lighthouse-CI, axe-core, weight budgets), keepalive + heartbeat workflows, sustainability mode feature flag, repo-level governance docs, and the "Not legal advice" disclaimer surface. All subsequent content authoring (Phase 2) happens against real components and real CI gates — not stubs.

In-scope requirements: FND-01..14, SRC-01, SRC-02 (16 total).

</domain>

<decisions>
## Implementation Decisions

### Visual Shell & Component Defaults

- **Color palette**: Starlight defaults overridden via Tailwind v4 `@theme` with a custom accent (slate/indigo) — formal but warm. CSS variables (`--sl-color-accent-*`) drive both Starlight and our custom components for theme parity.
- **Typography**: Starlight default `system-ui` body stack and `ui-monospace` for code blocks. No web-font fetches in v1 — preserves LCP budget and removes a CWV risk.
- **Density**: Comfortable — Starlight's default `--sl-content-pad-x: 1rem`, optimized for long-form 1,500–3,500-word stage explainers.
- **`<PersonaSection>` toggle UI**: Sticky top-of-page pill toggle (Exec / Engineer / Compliance) with URL hash `?lens=<persona>` for shareability. Hidden non-active lenses are still in DOM (for search indexing and SEO); CSS-only swap by default, JS only for the toggle interaction.

### Deploy Wiring (GitHub Pages + Cloudflare CDN)

- **Domain at launch**: Custom domain `ai-governance.tld` from Phase 1 — DNS + TLS pipeline bakes in early. Specific domain name is a placeholder constant (`SITE_DOMAIN`) until acquired; switching DNS later is one config flip.
- **Cloudflare proxy mode**: Proxied (orange cloud) — Pitfall 9 mitigation (Pages bandwidth cap) only works when Cloudflare is in front. DNS-only mode is explicitly rejected.
- **TLS termination**: Cloudflare Universal SSL with Full (strict) mode to GitHub Pages — preserves end-to-end encryption while keeping Cloudflare as the visible cert authority.
- **Cache policy**: Aggressive `Cache-Control: public, max-age=31536000, immutable` on hashed asset URLs (`/_astro/*`); `max-age=300, must-revalidate` on HTML routes via Cloudflare Page Rules / Cache Rules. Set explicitly in `wrangler`/Pages workflow comments since GitHub Pages serves no `Cache-Control` headers by default.

### Operational Cadence & Thresholds

- **Keepalive cadence (FND-08)**: Weekly cron (`0 6 * * 1` — Mon 06:00 UTC) — well inside the 60-day inactivity threshold; touches a `.heartbeat/keepalive` file via empty commit on a dedicated branch.
- **Heartbeat alert destination (FND-09)**: GitHub Issues with label `heartbeat-failure` (always-on) + optional webhook URL via repo secret `HEARTBEAT_WEBHOOK_URL` for Slack/Discord/Pushover. No email integration in v1 (requires SMTP infra).
- **Sustainability mode trigger (FND-07)**: Dual — manual boolean flag in `apps/site/src/config/site.ts` (overrides all) AND automatic flip when open AI-drafted PR backlog exceeds threshold (TRK-10). When active, site shows a "maintained at low cadence" notice and pipeline crons drop to bi-weekly.
- **Open-PR backlog threshold (TRK-10)**: 8 open AI-drafted PRs (label `ai-draft`) triggers auto-throttle to sustainability mode. Tunable via `SUSTAINABILITY_PR_THRESHOLD` env var on the load-alarm workflow.

### Disclaimer & Trust Surface

- **Footer disclaimer (FND-14)**: "This site explains AI governance. It is not legal advice. Consult qualified counsel before acting on any content." — short, jurisdiction-neutral, present on every page. Final copy locked in Phase 6 after lawyer review (TAD-01); current text is a placeholder reviewed in Phase 6.
- **Per-regulation in-context banner (FND-14)**: Sticky banner at the top of every regulation page showing regulation name + last-scraped date + "Not legal advice" pill. Banner is dismissible per-session but reappears on navigation to another regulation page.
- **About page tone (FND-13)**: Transparent solo-author framing — real name and contact, mission statement, escalation/contact path, explicit "co-maintainer wanted" call-out with link to GitHub Issues. Acknowledges single-author risk per Pitfall 7.
- **Content-density threshold (FND-12)**: Documented in `MAINTENANCE.md` as gate to public toggle — minimum 12 stage explainers authored + ≥60 glossary terms + ≥30 regulation snapshots tracked. Phase 6 verifies threshold met before flipping repo private→public.

### Claude's Discretion

The following are left to implementation judgment, grounded in research files and codebase conventions as they emerge:

- **Lighthouse-CI score budgets (FND-10)**: Use Astro 6 + Starlight defaults as baseline (LCP < 2.5s, INP < 200ms, CLS < 0.1); tune downward after the first real stage page builds and surfaces actual numbers.
- **Image-weight budget (FND-10)**: TBD after Mermaid renders land in Phase 2. Target < 100KB/image, < 500KB total page weight as opening figures.
- **Per-jurisdiction disclaimer wording (FND-14)**: Placeholder text in v1; locked by lawyer in Phase 6 (TAD-01). The component contract is final; only the strings change.
- **Mermaid placeholder fidelity for landing page (FND-06)**: Functional but not polished — boxes + arrows showing the 12-stage spine. Final visual lands in CNT-09 (Phase 2).
- **Repo name / GitHub org**: Use existing `AIgov` directory name; org/owner is user's GitHub account unless specified.
- **Component file colocation**: Astro idiomatic — `apps/site/src/components/<ComponentName>.astro` for static, `<ComponentName>.tsx` for React islands.

</decisions>

<code_context>
## Existing Code Insights

### Repository State
- Greenfield: `AIgov/` contains only `CLAUDE.md` (project instructions) and `.planning/` (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, config.json, research/).
- No `package.json`, no `apps/`, no `packages/` yet — Phase 1 creates the entire monorepo from scratch.

### Reusable Assets from Research
- `.planning/research/STACK.md` — definitive stack picks (Astro 6, Starlight 0.39+, Tailwind v4, Cloudflare Workers/Vectorize/Workers AI, Claude Haiku 4.5, pnpm, Hono).
- `.planning/research/ARCHITECTURE.md` — monorepo layout `apps/{site,chat-worker,pipeline}` + `packages/{shared,embed-cli}`; `packages/shared` is the single source of truth for Zod schemas (FND-01).
- `.planning/research/FEATURES.md` — component contracts for `<PersonaSection>`, `<RegQuote>`, `<JurisdictionLens>`, `<DiffViewer>`, `<ChangeLog>`, `<GlossaryTerm>`, `<MermaidJourney>`.
- `.planning/research/PITFALLS.md` — 12+ pitfall mitigations; Pitfall 4, 7, 9, 11, 12 are directly Phase 1 in-scope.

### Established Patterns
- **No existing code patterns to inherit** — this phase establishes them. Decisions made here become the baseline for Phases 2–6.
- TypeScript-first end-to-end (Worker, site, pipeline, shared types).
- Zod schemas in `packages/shared` are the single source of truth for content shape (FND-01) — content collections, Worker request validation, pipeline manifests all import from there.

### Integration Points
- GitHub Actions: `.github/workflows/` for deploy (Pages), keepalive (FND-08), heartbeat (FND-09), CI gates (FND-10), load-alarm (TRK-10 — built in Phase 3 but env wiring lives here).
- `apps/site/src/config/site.ts` — central feature-flag and configuration file referenced by FND-07 sustainability mode.
- `MAINTENANCE.md` / `SECURITY.md` / `CONTRIBUTING.md` at repo root (FND-13).
- `apps/site/astro.config.mjs` — Starlight + Tailwind + Mermaid integration wiring.

</code_context>

<specifics>
## Specific Ideas

- Hosting model: **GitHub Pages fronted by Cloudflare CDN** (orange-cloud proxied) for bandwidth shielding (Pitfall 9). Apex domain on Cloudflare Universal SSL Full Strict. Zero ongoing cost target.
- Performance constraint: **No web-font fetches in v1.** System UI stack only. Save CWV budget for content + Mermaid.
- Privacy constraint: **Cloudflare Web Analytics only** (aggregate, no cookies, no PII, no consent banner) — wiring deferred to Phase 6 (TAD-04) but documented in CONTRIBUTING.md so contributors don't add GA.
- Component naming: **PascalCase Astro components**, kebab-case content collection slugs, snake_case JSON metadata fields. Locked here to prevent later inconsistency.
- Content-collection identifiers: `stages`, `regulations`, `vendor`, `glossary`, `stories` per FND-04 — exactly five, no more in Phase 1.

</specifics>

<deferred>
## Deferred Ideas

- **Snapshot compare picker** (FUT-01) — picking any two snapshots of a regulation and diffing them. Deferred to v1.1.
- **Per-persona read-time estimates** (FUT-05) — out of Phase 1 scope; v1.1.
- **GitHub Sponsors / co-maintainer recruitment surfaces** (FUT-08) — About page acknowledges co-maintainer need (FND-13), but funding surfaces are v1.1.
- **i18n** (FUT-07) — Starlight supports it; English-only in v1.
- **PR-classification routing** (TRK-09) and **PR scope structural constraints** (TRK-08) — Phase 3 scope (Tracking Pipeline); FND-07 sustainability mode wiring in Phase 1 only stubs the threshold env vars.
- **Wizard JSON authoring** (WIZ-01..07) — Phase 4 scope; no scaffolding here.
- **Embed pipeline + Vectorize wiring** (CHT-02) — Phase 5 scope; `packages/embed-cli` workspace declared but empty in Phase 1.

</deferred>
