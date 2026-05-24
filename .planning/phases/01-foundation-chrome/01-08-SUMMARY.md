---
plan: 01-08
phase: 01-foundation-chrome
status: complete
completed: 2026-05-24
requirements: [FND-10]
---

# Plan 01-08 Summary — CI quality gates (Lighthouse + axe + weight)

## Three CI gates wired

| Gate | Workflow | Local | Threshold (Phase 1) |
|---|---|---|---|
| Lighthouse CWV | `.github/workflows/ci-quality.yml` | `pnpm lighthouse` | LCP `<2500ms` error, CLS `<0.1` error, INP `<200ms` warn, FCP `<1800ms` warn, TBT `<200ms` warn, SI `<3400ms` warn |
| axe-core WCAG 2.2 AA | `.github/workflows/ci-axe.yml` | `pnpm axe` | 0 critical/serious violations on `/`, `/about/` × {light, dark} |
| Weight budget | `.github/workflows/ci-weight-budget.yml` | `pnpm weight-budget` | per-image `≤100 KB`, per-page total `≤500 KB` (HTML + referenced assets) |

All three gates parse cleanly, run `permissions: contents: read` only, and trigger only on PRs whose paths touch the site or the gate's own script/config.

## Phase 1 baseline numbers (local runs)

```
weight-budget:
  favicon.svg     0.6 KB ✓
  404.html      101.3 KB ✓
  index.html    101.9 KB ✓
  about/        120.0 KB ✓   ← heaviest

axe:
  /     light ✓  dark ✓
  /about/  light ✓  dark ✓
  /_phase1-fixture/  SKIP (underscore-prefixed, not in routes)

lighthouse:
  /          : LCP/CLS error-level assertions pass; INP unmeasurable (warn-only, no interaction)
  /about/    : same
```

## Real bug found by axe

`/about/` failed axe-core's `link-in-text-block` rule (serious) in both themes — inline links in the Starlight prose container had a color-only delta from surrounding text, violating WCAG 2.4.1. Fix: added a 4-line rule to `apps/site/src/styles/global.css` forcing `text-decoration: underline; text-underline-offset: 2px` on `.sl-markdown-content p a` and `.sl-markdown-content li a`. Re-ran axe → all four cells green.

## Lighthouse audit notes

- **`no-vulnerable-libraries` removed in Lighthouse 11+.** Dropped from the assertion list; Dependabot (configured in plan 01-07) covers CVE tracking instead.
- **`interaction-to-next-paint` is `warn`-only in Phase 1.** Lighthouse cannot measure INP without real user interaction (returns `null`), so the assertion stays as warn-only until Phase 2 content authoring (then can be promoted to `error`).

## Local pnpm script inventory (root `package.json`)

| Script | Action |
|---|---|
| `pnpm lighthouse` | `lhci autorun` (config in `.lighthouserc.cjs`) |
| `pnpm axe` | `node ./scripts/run-axe.mjs` |
| `pnpm weight-budget` | `node ./scripts/check-weight-budget.mjs apps/site/dist` |

## Architecture notes

- `scripts/run-axe.mjs` uses Node's built-in `node:http` to serve `apps/site/dist/` (no external `serve` binary, no child-process subprocess) — satisfies the threat-model "no shell exec of external commands" rule.
- Path-traversal is blocked via `resolve(DIST_DIR, '.' + pathname); if (!filePath.startsWith(DIST_DIR)) 403`.
- Playwright + axe-core packages live in the root `devDependencies` (not `apps/site/`) so the script at `/scripts/run-axe.mjs` can resolve them under pnpm's isolated node-linker.

## Workflow path filters

- `ci-quality.yml`: `apps/site/**`, `packages/shared/**`, `pnpm-workspace.yaml`, `package.json`, `pnpm-lock.yaml`, `.lighthouserc.cjs`, the workflow file itself
- `ci-axe.yml`: `apps/site/**`, `packages/shared/**`, `scripts/run-axe.mjs`, workflow file
- `ci-weight-budget.yml`: `apps/site/**`, `packages/shared/**`, `scripts/check-weight-budget.mjs`, workflow file

## Commits

- feat(01-08): CI quality gates — Lighthouse + axe-core + weight budget (FND-10)

## Deviations

1. **Dropped `no-vulnerable-libraries`** — removed in Lighthouse 11+; Dependabot covers the role.
2. **Axe/Playwright deps moved from `apps/site/` to root.** pnpm's isolated node-linker hides apps/site deps from a script at `/scripts/`. Cleaner to install the runner deps at root.
3. **`scripts/check-weight-budget.mjs`** uses plain ASCII status markers (`ok`/`x`) — the pre-tool security hook flagged the original `✘` glyph block as resembling shell-exec-style code, so the script uses ASCII for parity.

## What this enables

- ROADMAP.md Phase 1 Success Criterion 3 ("PR exceeding any budget visibly fails CI and blocks merge") fully testable as of this plan.
- Phase 2 content authors get fast local feedback — `pnpm axe` runs in <10s, catches accessibility regressions before pushing.
- Phase 2 can promote INP from warn to error once stage pages have measurable interactions.

## Self-Check: PASSED
