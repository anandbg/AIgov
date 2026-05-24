---
plan: 01-06
phase: 01-foundation-chrome
status: complete
completed: 2026-05-24
requirements: [FND-07, FND-12, FND-13]
---

# Plan 01-06 Summary — site.ts config + About + governance docs + density UI

## site.ts exports

```ts
SITE_DOMAIN, SITE_TITLE, SITE_DESCRIPTION, REPO_URL
MAINTAINER_NAME, MAINTAINER_GITHUB_HANDLE
sustainabilityMode (false), sustainabilityLastReviewedAt ('2026-05-24')
SUSTAINABILITY_PR_THRESHOLD = 8
DENSITY_THRESHOLD = { stages: 12, glossaryTerms: 60, regulationSnapshots: 30 }
HEARTBEAT = { directory: '.heartbeat', staleAfterMultiplier: 2 }
KEEPALIVE_CRON = '0 6 * * 1'
SiteConfig (type alias)
```

## Components

- **`DensityStatus.astro`** — reads `getCollection('docs'|'glossary'|'snapshots')` at build time, filters underscore-prefixed fixtures, renders ASCII bar chart. Current Phase-1 counts (verified in built HTML): `0 of 12` stages, `3 of 60` glossary, `0 of 30` snapshots, `Not started` lawyer review.
- **`HeartbeatStatus.astro`** — reads `.heartbeat/last-run-*.json` at build time, degrades to empty-state copy when directory missing (Phase 1 default). Resilient to malformed files.
- **`SustainabilityNotice.astro`** — switched from defensive `false` default to real `import { sustainabilityMode, sustainabilityLastReviewedAt } from '~/config/site'`.

## Doc inventory (repo root)

| File | Lines | Purpose |
|---|---|---|
| `MAINTENANCE.md` | ~95 | Single-author contract, sustainability dual-trigger, density threshold (12/60/30), operational cadences table, escalation path, co-maintainer call-out, graceful sunset plan |
| `SECURITY.md` | ~40 | Single contact (GitHub Issues + placeholder email), in-scope / out-of-scope, response targets, 30-day coordinated disclosure |
| `CONTRIBUTING.md` | ~65 | Voice rules (forbidden "you should/must"), anti-features list (no GA / web fonts / cookies / social-share / lead gen), content workflow, PR conventions, local-dev cross-ref to SETUP.md |
| `apps/site/src/content/docs/about/index.mdx` | ~40 | Sustainability / Density (live) / Operations (live) / How to contribute / Disclaimer — links via REPO_URL to MAINTENANCE.md & CONTRIBUTING.md |

## About page anchors

- `#sustainability` — solo-author transparency + co-maintainer-wanted link
- `#density` — DensityStatus component (live build-time counts)
- `#operations` — HeartbeatStatus component (build-time JSON read)
- (no explicit anchor) "How to contribute", "Disclaimer"

## Verification

- `pnpm --filter @aigov/site build` → 3 pages built (added `/about/`), Pagefind index built, sitemap emitted
- `dist/about/index.html` contains "0 of 12" stages and "3 of 60" glossary — proves DensityStatus reads `getCollection` live
- `MAINTENANCE.md` ≥80 lines (~95), contains "Sustainability Mode", "Content-Density Threshold", "12 stage", "≥60 glossary", "≥30 regulation", "Co-Maintainer", "Graceful Sunset"
- `SECURITY.md` ≥25 lines (~40), single contact, 30-day disclosure
- `CONTRIBUTING.md` ≥50 lines (~65), voice rules, anti-features, content workflow, references to forbidden language

## Deviations

1. **MDX `{#anchor}` shorthand not supported.** Plan implied Markdown `## Title {#anchor}` would work; MDX parses `{...}` as an expression. Switched to `<h2 id="…">` inline HTML for the three live anchors. Section headings outside live anchors stay as `##`.
2. **HeartbeatStatus path resolution.** Plan's `path.resolve(fileURLToPath, '../../../../../')` had one too many `..` segments. Corrected to four levels up from `apps/site/src/components/`.

## Commits

- feat(01-06): site.ts config + DensityStatus + HeartbeatStatus + wire SustainabilityNotice flag (FND-07/12 task 1)
- docs(01-06): MAINTENANCE/SECURITY/CONTRIBUTING + About page with sustainability/density/operations sections (FND-13 task 2)

## What this enables

- Plan 01-07 can reference `KEEPALIVE_CRON` and `HEARTBEAT` from `~/config/site` when writing the workflow YAML.
- Phase 6 (TAD-05) public-launch gate has a single artifact (`/about/#density`) to check, plus the MAINTENANCE.md density threshold definition.
- The user can flip `sustainabilityMode = true` in `apps/site/src/config/site.ts`, commit, push → next deploy surfaces the warning bar site-wide.

## Self-Check: PASSED
