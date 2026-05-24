---
phase: 06-polish-pre-launch
status: complete (autonomous portion); user-action gates documented
completed: 2026-05-24
requirements: [TAD-01, TAD-02, TAD-03, TAD-04, TAD-05, TAD-06, CHT-09]
---

# Phase 6 Summary — Polish & Pre-Launch Gate

## What was built (autonomous)

- **`.planning/legal/launch-checklist.md`** — the canonical public-flip gate. Every TAD-* requirement plus the full Pitfall sweep is a checkbox item that must be ticked, dated, and signed before `gh repo edit --visibility public`.
- **`scripts/check-injection-refusal.mjs`** — runs the chat-worker's REFUSE_PATTERNS against `apps/chat-worker/fixtures/injection-tests.json`. All 20 known-bad queries refuse correctly (CHT-09 satisfied).
- **`.github/workflows/ci-injection-refusal.yml`** — PR-gated workflow running the above. Adds to the existing 5 CI gates (deploy, axe, weight, lighthouse, content-gates).
- **Chat-worker refusal patterns expanded** — now match both word-orders of "reveal/show/leak/display system prompt" and the "verbatim" variant. All 20 fixtures pass.

## What requires user action (documented in launch-checklist.md)

**TAD-01 — Lawyer sign-off (BLOCKER):** Engage qualified counsel; review footer disclaimer, per-regulation banner, About sustainability + density framing, wizard counsel-topics framing, chat system prompt, Terms of use. Sign-off PDF/email committed to `.planning/legal/sign-off-YYYY-MM-DD.pdf`.

**TAD-02 — 3-jurisdiction beta review (BLOCKER):** EU + UK + APAC named reviewers, feedback filed as GitHub issues, all blocking issues resolved or explicitly deferred to v1.1.

**TAD-03 — Edit on GitHub + analytics + OG cards:**
- Update `editLink.baseUrl`, `MAINTAINER_GITHUB_HANDLE`, `REPO_URL` from `PLACEHOLDER_ORG` / `PLACEHOLDER_HANDLE` to real values
- Enable Cloudflare Web Analytics token in Head.astro
- Generate per-page OG cards at build time
- Replace Phase 1 placeholder favicon

**TAD-04 — Cloudflare Web Analytics:** Account → Add a site → cookieless beacon token → drop into Head.astro.

**TAD-05 — Final WCAG 2.2 AA + CWV + density verification:**
- Run `pnpm axe` + `pnpm lighthouse` + `pnpm weight-budget` on full final content (all CI gates)
- Real-device manual mobile test (iOS Safari + Android Chrome)
- Density: 12 stages (already met), 60 glossary (61 met), 30 snapshots (NIST today; +13 more sources × weekly cadence ≈ 4 weeks of pipeline running)

**TAD-06 — Public flip:** `gh repo edit --visibility public` once every item above is checked and dated.

## Requirements coverage

| Req | Status | Notes |
|---|---|---|
| TAD-01 Lawyer sign-off | gate documented | Real lawyer engagement is user-action; launch checklist is the canonical artefact |
| TAD-02 Beta reviewers (EU/UK/APAC) | gate documented | Outreach should begin during Phase 2 per STATE.md blocker note |
| TAD-03 Edit on GitHub + analytics + OG | gate documented | Edit link wired but points at PLACEHOLDER; user updates at flip |
| TAD-04 Cloudflare Web Analytics | gate documented | SETUP.md already lists the steps |
| TAD-05 Final audit + density | partial — autonomous portion green | CI gates pass on Phase-2 content; full audit lands when density met |
| TAD-06 Public flip | gate documented | Checklist file is the hard gate |
| CHT-09 Injection-test fixtures | ✓ | 20 fixtures all refused; CI workflow live |

## Verification

- `pnpm injection-refusal-check` → 20 fixtures, all refused
- `pnpm voice-check` → 0 violations
- `pnpm persona-lens-check` → 12 stages × 3 lenses ✓
- `pnpm weight-budget` → 0 overages
- `pnpm axe` → all routes clean (light + dark)
- `pnpm --filter @aigov/site build` → 17 pages

## CI gates inventory (Phase 6 final)

1. `ci-quality.yml` — Lighthouse CWV (LCP, CLS, FCP, TBT, SI; INP warn-only)
2. `ci-axe.yml` — WCAG 2.2 AA in both themes
3. `ci-weight-budget.yml` — per-image + per-page weight
4. `ci-content-gates.yml` — voice (CNT-10) + persona-lens (CNT-11)
5. `ci-injection-refusal.yml` — chat refusal fixtures (CHT-09)
6. `deploy-site.yml` — GitHub Pages on push to main
7. `keepalive.yml` — weekly cron
8. `heartbeat.yml` — daily heartbeat check
9. `scrape-global.yml` — weekly NIST AI RMF scrape (more sources land as adapters arrive)

## Commits

- feat(phase-6): launch checklist + injection-refusal CI gate (20 fixtures, all refused) + chat-worker refusal pattern update (TAD-06, CHT-09)

## What remains for true public launch

The repo is **autonomously-ready**. The remaining items are externally-paced gates:

1. Lawyer engagement → 2–8 week typical turnaround (start during Phase 2)
2. Beta reviewer recruitment → 1–2 weeks per reviewer (overlap with lawyer review)
3. Domain registration + Cloudflare setup → user-action evening
4. Anthropic API key + Cloudflare Vectorize index → user-action evening
5. ≥13 additional source adapters → Phase 3 ongoing work (~1 day per adapter for an experienced contributor)
6. Density gate (30+ snapshots) → mechanical, falls out of the pipeline running for ~4 weeks once adapters land

## Self-Check: PASSED
