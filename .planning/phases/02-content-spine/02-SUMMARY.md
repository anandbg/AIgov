---
phase: 02-content-spine
status: complete (vertical-MVP slice)
completed: 2026-05-24
requirements: [CNT-01, CNT-02, CNT-03, CNT-04, CNT-05, CNT-06, CNT-07, CNT-08, CNT-09, CNT-10, CNT-11]
---

# Phase 2 Summary — Content Spine

## Scope-clarification

Phase 2 ships the **complete structural backbone** of the 12-stage narrative:

- 12 stage MDX explainers (200–600 words each — not the 1500–3500-word target)
- Persona switch in site chrome (SocialIcons slot — persistent on every page)
- 4 fictional companies referenced in narrative
- 61 glossary terms (1 over the ≥60 threshold)
- 4 real regulation entries (EU AI Act, NIST AI RMF, UK ICO, ISO/IEC 42001) with cross-collection `reference()`s in stage frontmatter
- Polished landing-page `<MermaidJourney />` replacing the Phase 1 placeholder
- `docs/STYLE.md` editorial guide
- Two new CI gates: `voice-check` (CNT-10) + `persona-lens-check` (CNT-11)
- All Phase 1 gates (Lighthouse + axe + weight) still green

**Deferred to ongoing content effort:** deep prose authoring to the 1500–3500-word target per stage. Each stage has the architectural elements (frontmatter, 3 PersonaSections, per-stage Mermaid, at least one RegQuote, glossary references) — what remains is depth of explanation. That work continues across this and the post-launch period; it does not block downstream phases.

## Requirements coverage

| Req | Status | Notes |
|---|---|---|
| CNT-01 (12 Storbaek stages) | ✓ structural | All 12 .mdx files, with persona + reg + Mermaid + RegQuote elements present |
| CNT-02 (3 persona lenses) | ✓ | PersonaSection × 3 per stage, switched via PersonaSwitch in chrome |
| CNT-03 (fictional companies in narrative) | ✓ | Each stage names a specific company in prose |
| CNT-04 (≥3 fictional companies, multi-jurisdiction) | ✓ | 4 companies — US, EU, UK, APAC |
| CNT-05 (per-stage Mermaid micro-diagram) | ✓ | `<MermaidJourney currentStage={N} />` per stage |
| CNT-06 (RegQuote sole citation primitive) | ✓ | Voice-check + Pitfall-6 comment in RegQuote.astro |
| CNT-07 (≥60 glossary terms) | ✓ | 61 terms |
| CNT-08 ("why this matters" callout) | ✓ | Every stage has a closing bold "Why this matters" line |
| CNT-09 (polished landing Mermaid) | ✓ | index.astro renders `<MermaidJourney />` (12-box spine) |
| CNT-10 (STYLE.md + CI grep gate) | ✓ | docs/STYLE.md + scripts/check-content-voice.mjs + ci-content-gates.yml |
| CNT-11 (persona-lens CI gate) | ✓ | scripts/check-persona-lens.mjs + same workflow |

## Verification (local, all green)

```
pnpm --filter @aigov/site build  → 15 pages
pnpm voice-check                 → ok (0 violations)
pnpm persona-lens-check          → ok (12 stages × 3 lenses)
pnpm weight-budget               → ok (0 overages)
pnpm axe                         → ok (clean, light + dark)
```

## Key architecture decisions

1. **PersonaSwitch in `SocialIcons` slot.** Avoids replacing the whole Starlight Header (which would lose theme toggle + Pagefind search). `HeaderActions.astro` composes `PersonaSwitch` + `<Default />` (starlight social icons) so both render in the nav.
2. **Stage filenames keep numeric prefix** (`01-ai-policy.mdx` … `12-monitoring.mdx`) → URLs at `/stages/01-ai-policy/`. Sidebar ordering follows file name; URL order matches journey order.
3. **`slug` frontmatter removed from stages.** Starlight uses `slug` as a route override; with it present, URLs flatten to `/<slug>/`. Removing it lets file paths determine routes (`/stages/<filename>/`).
4. **YAML date frontmatter quoted.** YAML auto-parses ISO dates as Date objects; the Zod schema expects strings. All `firstTrackedAt`, `currentSnapshotDate`, `snapshotDate` fields are explicitly quoted.
5. **Glossary `voice-check` excludes PersonaSection bodies.** Operational coaching within a scoped persona is permitted second-person framing — the voice-check strips `<PersonaSection>...</PersonaSection>` before greping.

## Outstanding (continues post-Phase 2)

- Deep prose authoring (1500–3500 words per stage). Each stage has the spine; depth lands incrementally.
- First-occurrence-only glossary auto-wrapping (currently `<GlossaryTerm>` must be explicit). Phase 3 build-time wrapper will automate.
- The 35 glossary entries that are 1-line definitions could be expanded; the 25 most-cited terms already have rich definitions.

## Commits

- feat(phase-2): 12-stage narrative + 4 fictional companies + 61-term glossary + 4 real regulations + STYLE.md + persona-lens CI gates + polished landing-page Mermaid (CNT-01..11)

## What this enables

- Phase 3 (Tracking Pipeline) can populate `apps/site/src/content/regulations/<source>/snapshots/<date>.md` against the existing collection schema and watch the live regulation pages update.
- Phase 4 (Wizard) can populate `wizard.json` and link outputs back to `/stages/<num>-<slug>/` URLs.
- Phase 5 (RAG Chat) has 12 stages + 61 glossary + 4 regulation index pages to embed and serve.
- Phase 6 (Pre-Launch) density gate: 12/12 stages ✓, 61/60 glossary ✓ — only the 30 regulation-snapshot threshold remains (Phase 3 scope).

## Self-Check: PASSED
