---
plan: 01-07
phase: 01-foundation-chrome
status: complete
completed: 2026-05-24
requirements: [FND-03, FND-08, FND-09]
---

# Plan 01-07 Summary — Pages deploy + keepalive + heartbeat + dependabot

## Workflow inventory

| File | Trigger | Permissions | Purpose |
|---|---|---|---|
| `.github/workflows/deploy-site.yml` | push to `main` (path-filtered) + `workflow_dispatch` | `contents:read`, `pages:write`, `id-token:write` | Build `apps/site` and deploy to GitHub Pages via `actions/deploy-pages@v4` |
| `.github/workflows/keepalive.yml` | `cron '0 6 * * 1'` + `workflow_dispatch` | `contents:write` | Weekly commit to `.heartbeat/last-run-keepalive.json` (`--allow-empty` fallback) — defeats GitHub's 60-day workflow auto-disable (Pitfall 4) |
| `.github/workflows/heartbeat.yml` | `cron '0 12 * * *'` + `workflow_dispatch` | `contents:read`, `issues:write` | Reads `.heartbeat/last-run-*.json`, opens `heartbeat-failure`-labeled issue when any source is >2× its declared cadence, posts to `HEARTBEAT_WEBHOOK_URL` if set |
| `.github/dependabot.yml` | weekly | n/a | npm + github-actions ecosystems; groups astro+starlight, tailwind, dev-tools; cap 5 open PRs; no auto-merge |

## Seed heartbeat file

`.heartbeat/last-run-keepalive.json`:
```json
{
  "source": "keepalive",
  "lastRun": "2026-05-24T00:00:00Z",
  "ok": true,
  "expectedCadence": "weekly (Mon 06:00 UTC)"
}
```
The fixture lets `HeartbeatStatus` on `/about/` render one row immediately on Phase-1 ship-state instead of the empty-state copy. The first keepalive run on GitHub overwrites this with a real timestamp.

## SETUP.md additions

- `### Cloudflare Cache Rules (exact configuration)` — paste-and-run dashboard steps
- `### GitHub Pages "Custom domain" field` — warning about Enforce HTTPS ordering vs Cloudflare Full (strict)
- `### Verifying the deploy` — five-step post-first-push checklist

## Dependabot grouping strategy

- `astro-and-starlight` — `astro`, `@astrojs/*` (minor/patch only — major upgrades stay separate for blast-radius review)
- `tailwind` — `tailwindcss`, `@tailwindcss/*`
- `dev-tools` — `typescript`, `@types/*`, `prettier`
- Ungrouped: zod, mermaid, sharp, pagefind, hono (Phase 5), etc. — each bumps independently

Open-PR cap is 5; auto-merge is OFF.

## Manual failure-trigger verification (user, post-deploy)

To complete ROADMAP.md Phase 1 Success Criterion 4 (which Phase 1 cannot self-test):

1. After running `gh repo create AIgov --private --source=. --remote=origin --description "Public AI Governance knowledge site"` and pushing, manually trigger keepalive: `gh workflow run keepalive.yml` → confirm an empty commit lands on `main`.
2. Trip the heartbeat: edit `.heartbeat/last-run-keepalive.json` and set `lastRun` to a timestamp 21 days old; commit; `gh workflow run heartbeat.yml`.
3. Confirm a new issue opens with label `heartbeat-failure` titled `Heartbeat failure — 1 stale source(s) (YYYY-MM-DD)`.
4. (Optional) If `HEARTBEAT_WEBHOOK_URL` is set, confirm a POST lands at the webhook destination.
5. Revert the stale timestamp: re-run keepalive (or hand-edit) to restore the current ISO date.

## Verification

- All four YAML/JSON files parse cleanly (validated via `node + js-yaml`)
- `pnpm --filter @aigov/site build` → 3 pages, About page renders the keepalive heartbeat row (grep confirmed `1` occurrence of `keepalive` in `dist/about/index.html`)
- All workflows use least-privilege `permissions:` blocks
- `keepalive.yml` uses `--allow-empty` fallback so it never fails to register Action activity
- `heartbeat.yml` `Notify webhook` step is gated on `failure() && env.HEARTBEAT_WEBHOOK_URL != ''` — graceful degrade when secret absent

## Commits

- feat(01-07): deploy-site/keepalive/heartbeat workflows + dependabot + .heartbeat seed + Cloudflare cache rules docs (FND-03/08/09)

## Deviations

- Plan suggested `deploy-site.yml` filename; matches that exactly. Earlier ROADMAP fragments referenced `pages-deploy.yml` — using the plan's name to be consistent.
- No `actionlint` available in environment; substituted `node + js-yaml` round-trip parse as the validation method.
- `python3` lacks `yaml` module on this host; used Node-based validation.

## What this enables

- Phase 1 plan 01-08 can add CI quality gates (Lighthouse, axe, weight budget) that hang off PRs.
- After user-action gates (gh repo create, GitHub Pages enable, Cloudflare account) per SETUP.md, the first push to `main` produces a live site URL.
- Phase 3 pipeline workflows model their structure on these three (path filter, concurrency, permissions, heartbeat write).

## Self-Check: PASSED
