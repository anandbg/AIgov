---
phase: 04-deterministic-wizard
status: complete
completed: 2026-05-24
requirements: [WIZ-01, WIZ-02, WIZ-03, WIZ-04, WIZ-05, WIZ-06]
---

# Phase 4 Summary — Deterministic Wizard

## What was built

- `apps/site/src/data/wizard.json` — Zod-shaped decision tree: 5 questions (role / jurisdiction / risk-tier / agentic / sensitive-data) and 17 governance topics each with `applies` predicates against the answers
- `apps/site/src/pages/wizard.astro` — pure Astro page with a small bundled client script (no React/Solid island)
- URL-hash state with `v=1` schema version field; shareable + forward-compatible
- "Topics to discuss with counsel" framing throughout — never "your tailored compliance checklist"
- Per-jurisdiction disclaimer banner that surfaces the right framing for EU / UK / US / US-state / APAC / global
- Output: client-side-checkable list with stage-page links + regulation-page citations
- Copy-as-Markdown button + Print/save-as-PDF button + shareable-URL action
- Print stylesheet inherits the Phase 1 chrome rules — wizard output prints cleanly
- All UI strings sentence-case, no emoji in chrome, no PII collection (no email/name capture)

## Requirements coverage

| Req | Status | Notes |
|---|---|---|
| WIZ-01 (JSON tree + rendered) | ✓ | wizard.json + wizard.astro |
| WIZ-02 (5 branches) | ✓ | role / jurisdiction / risk-tier / agentic / sensitive |
| WIZ-03 (checklist + cite + stage link) | ✓ | Each topic has stage link + citations to regulation pages |
| WIZ-04 (counsel framing + jurisdiction disclaimer) | ✓ | Hard-coded copy + JURISDICTION_NOTES table |
| WIZ-05 (URL hash state, v=1) | ✓ | `URLSearchParams`-encoded hash with version gate |
| WIZ-06 (Save PDF + Markdown + share) | ✓ | window.print + clipboard.writeText for both |
| WIZ-07 (matrix.json cross-link) | deferred | matrix.json generator lands with Phase 3 multi-source maturity |

## Verification

- `pnpm --filter @aigov/site build` → 17 pages (adds `/wizard/`)
- Page contains the "topics to discuss with counsel" + "not legal advice" framing
- URL hash round-trip works: e.g. `#v=1&role=provider&jurisdiction=eu&tier=high-risk&agentic=predictive&sensitive=yes-personal` reproduces the same 13 topics

## Notable design decisions

1. **No React island.** The wizard is plain Astro + a single `<script>` block bundled by Astro (importing `wizard.json` for type safety). Smaller payload, no hydration cost, easier to audit.
2. **URL hash, not query string.** Hash never reaches the server; satisfies the zero-PII commitment by construction.
3. **`applies` predicate language** is intentionally narrow — `always`, or `{ key: [allowed values] }`. No deep boolean combinators; new topics that need richer logic can be added by splitting into multiple `applies` rules.

## Commits

- feat(phase-4): deterministic wizard — 5-question decision tree + 17 governance topics + URL-hash state + copy-as-markdown + per-jurisdiction disclaimer (WIZ-01..06)

## Self-Check: PASSED
