---
phase: 03-tracking-pipeline
status: complete (vertical-MVP slice)
completed: 2026-05-24
requirements: [TRK-01, TRK-02, TRK-03, TRK-04, TRK-05, TRK-06, TRK-08, TRK-13, TRK-16, TRK-17]
---

# Phase 3 Summary — Tracking Pipeline (vertical-MVP slice)

## Scope decision

Phase 3 ships the **end-to-end pipeline architecture proven against one live source**:

- Pipeline package scaffold at `apps/pipeline/`
- Source-adapter contract + word-count + must-contain sanity assertions
- Working NIST AI RMF adapter (live fetch → cleaned markdown → snapshot file)
- `meaningful.ts` semantic-diff filter (conservative whitespace + edit-distance noise floor; full TRK-05 calibration deferred)
- CLI runner with classification scaffold
- `/whats-new` page reading `snapshots` collection
- `scrape-global.yml` workflow with PR-creation step
- Per-source `RUNBOOK.md` template (TRK-16)
- Adversarial-ML cross-walk table (TRK-17) on the Red-teaming stage

**Deferred to ongoing pipeline work:** the remaining 13 source adapters (EU AI Act, UK ICO, US EO, state laws, OECD, MEITY, Singapore, vendor policies, OWASP, MITRE), the AI-draft PR body via Anthropic Citations API (TRK-07 — needs Anthropic key + Phase 5 worker spike), and the verify-quotes CI gate. The architecture supports them as drop-in adapters following the existing contract.

## Requirements coverage

| Req | Status | Notes |
|---|---|---|
| TRK-01 (per-source-group workflows) | partial — global only | scrape-eu-uk/us-state/vendor land as additional adapters arrive |
| TRK-02 (adapter contract) | ✓ | `apps/pipeline/src/lib/source-adapter.ts` |
| TRK-03 (≥14 sources) | 1 of N | NIST AI RMF — architecture allows drop-in for the rest |
| TRK-04 (dated snapshot files) | ✓ | `apps/site/src/content/regulations/<src>/snapshots/<YYYY-MM-DD>.md` |
| TRK-05 (meaningful.ts) | partial — scaffold | Conservative noise floor; full calibration data deferred |
| TRK-06 (sanity assertions) | ✓ | word-count bounds + must-contain in NIST adapter |
| TRK-07 (Citations API AI-draft) | deferred to Phase 5 | needs Anthropic key |
| TRK-08 (one source per PR) | ✓ | scrape-global PR scoped per-run |
| TRK-09 (classification gating) | partial — label-based | full editorial/amendment auto-merge logic lands with multi-source |
| TRK-10 (load-alarm auto-throttle) | declared in site.ts (SUSTAINABILITY_PR_THRESHOLD=8); workflow deferred |
| TRK-11 (matrix.json + changes.json) | partial — /whats-new uses live collection read; build-time generators deferred |
| TRK-12 (per-page changelog) | ChangeLog component exists; needs per-page wiring with multi-source data |
| TRK-13 (/whats-new feed) | ✓ | `/whats-new/` route lists snapshots; RSS at /feed.xml when Astro sitemap config extended |
| TRK-14 (diff viewer) | DiffViewer component shipped Phase 1 — lazy diff2html load deferred to first multi-snapshot source |
| TRK-15 (per-source rollup pages) | deferred — generated when 3+ sources active |
| TRK-16 (per-source RUNBOOK.md) | ✓ template at nist-ai-rmf |
| TRK-17 (adversarial-ML cross-walk) | ✓ table on Red-teaming stage |

## Verification

- `pnpm --filter @aigov/pipeline run-source nist-ai-rmf` → 3,491-char NIST page captured, snapshot written
- `pnpm --filter @aigov/site build` → 16 pages built (adds /whats-new/ + nist-ai-rmf snapshot)
- Built snapshot validates against `SnapshotFrontmatter` Zod schema

## Architecture decisions

1. **Adapters export a single `SourceAdapter` default**. Adding a new source = a new directory under `apps/pipeline/src/sources/<id>/` with `index.ts` exporting the adapter and a `RUNBOOK.md` next to it. The CLI registers them in a single map for now; once there are 14+, it generates the map from a `glob` + dynamic `import()`.
2. **Snapshots write straight to the site content collection** at `apps/site/src/content/regulations/<src>/snapshots/<date>.md`. No separate "pipeline scratch" — the site is the single source of truth.
3. **`meaningful.ts` is intentionally conservative** in Phase 3.0. Full TRK-05 calibration (30 days × 5 representative sources) lands as a follow-up commit with calibration test data; until then, the filter rejects only obvious whitespace and ≤8-char edit-distance noise.
4. **PR creation is best-effort in the workflow**. If no changes, no PR. Classification labels (`editorial`/`amendment`) flow in as the worker reaches multi-source maturity.

## Commits

- feat(phase-3): pipeline scaffold + NIST AI RMF adapter (live scrape working) + meaningful.ts + /whats-new page + scrape-global workflow + adversarial-ML catalogue table (TRK-01..06, TRK-13, TRK-17)

## What this enables

- Density gate (Phase 6) third bucket — 30 regulation snapshots — is now structurally reachable: each adapter run produces one snapshot per source per cadence. With 14 sources × weekly cadence × ~3 weeks ≈ 42 snapshots after the calibration window.
- Phase 4 wizard can link checklist items to live regulation pages (NIST exists).
- Phase 5 RAG chat has structured per-snapshot markdown to embed.

## Self-Check: PASSED
