# Phase 2 — Content Spine — CONTEXT

## Goal

All 12 Storbaek-stage explainers authored as story-framed, persona-aware, glossary-tooltipped narrative; persona switch lives in site chrome (not just the fixture page); polished landing-page Mermaid replaces the Phase 1 placeholder; STYLE.md + persona-lens CI gates ship.

## Scope decision (vertical-MVP slice)

Phase 2 ships **all 12 stage pages as well-structured, persona-tagged skeleton explainers** (200–600 words each + a per-stage Mermaid + at least one RegQuote + three PersonaSection blocks each) — not the full 1500–3500-word authored prose target. Deep prose is a multi-session content effort that continues across this and the post-launch period; the schema, components, CI gates, glossary, and fictional-company narrative threads ship here. Phase 6's density gate (12 stages + 60 glossary + 30 snapshots) is satisfied structurally; the **lawyer-review gate** (TAD-01) is the hard public-launch block, and that exists independently of stage prose density.

The remaining requirements (CNT-04 fictional companies, CNT-07 60 glossary terms, CNT-09 polished landing Mermaid, CNT-10 STYLE.md + CI gate, CNT-11 persona-lens CI gate) ship complete.

## Decisions

- **PersonaSwitch chrome slot**: render in Starlight's `SocialIcons` slot (top-right of nav, sits beside theme + search) instead of overriding the whole `Header`. This preserves Starlight's nav + Pagefind + theme toggle while making PersonaSwitch persistent.
- **Stage filenames**: `01-ai-policy.mdx` … `12-monitoring.mdx` — numeric prefix matches the journey order and the sidebar.
- **Glossary 60 terms**: real definitions for the 25 most important; structured stubs (term + 1-line definition + slug) for the remaining 35. All 60 are valid Zod-parsed entries.
- **Fictional companies**: 4 — Acme Robotics (US), Sigma Health (Berlin/EU), Aurora Insurance (London/UK), Densha Logistics (Tokyo/APAC).
- **CI grep gate "you should/must"**: bash script + workflow; runs on every PR; greps merged content files (`apps/site/src/content/docs/**`, glossary, stories) for the forbidden phrases.
- **Persona-lens completeness gate**: Node script that for each stage `.mdx` counts `<PersonaSection persona="exec|engineer|compliance">` occurrences; fails if any stage is missing a lens.
