# MAINTENANCE.md — operational contract

This site is built and maintained as a single-author public knowledge resource. The contract below documents how the site stays current, what to do when it doesn't, and the explicit gates that govern public-release readiness.

## Maintenance Model

This project has **one maintainer (Anand)**. The honest weekly capacity:

- ~4 hours reviewing AI-drafted scrape PRs (Phase 3 onward)
- ~4 hours authoring or editing stage content (Phase 2 onward)

If the review queue grows faster than capacity, the pipeline cadence auto-throttles (see `## Sustainability Mode` below). Single-maintainer fragility is acknowledged in `apps/site/src/content/docs/about/index.mdx` so readers can calibrate trust accordingly (Pitfall 7).

## Sustainability Mode

**Dual-trigger** per `.planning/phases/01-foundation-chrome/01-CONTEXT.md`:

1. **Manual toggle** — flip `sustainabilityMode = true` in `apps/site/src/config/site.ts`, commit, push. Next deploy surfaces the "Maintained at low cadence" notice site-wide.
2. **Automatic toggle** — Phase 3 (TRK-10) ships a `load-alarm.yml` workflow that flips the flag when the open AI-draft PR backlog exceeds **`SUSTAINABILITY_PR_THRESHOLD = 8`** (constant lives in `site.ts`).

When sustainability mode is active:

- Site-wide warning banner renders (`SustainabilityNotice` component).
- Scrape crons drop from daily/weekly to bi-weekly (Phase 3 workflow logic reads the flag).
- Maintainer response-time target is 1 week instead of 72h.

## Content-Density Threshold (FND-12)

Public launch (Phase 6 TAD-05) is gated on **all three** thresholds being met:

| Bucket | Threshold | Source of truth |
|---|---|---|
| Stage explainers | **12** | `apps/site/src/content/docs/stages/*.mdx` (CNT-01) |
| Glossary terms | **≥60** | `apps/site/src/content/glossary/*.md` (CNT-07) |
| Regulation snapshots | **≥30** | `apps/site/src/content/regulations/*/snapshots/*.md` (TRK-04) |

Current status is rendered live on `/about/#density` by the `DensityStatus` component (reads `getCollection` at build time). The repo stays private until the threshold is met. Pitfall 11 — sparse-corpus search trust loss.

## CI Gates

Every pull request runs the following gates. Local-equivalent commands let you reproduce a failure before pushing.

| Gate | Workflow | Local command | Tuning |
|---|---|---|---|
| Lighthouse (CWV) | `.github/workflows/ci-quality.yml` | `pnpm lighthouse` | Edit `.lighthouserc.cjs` (LCP/CLS thresholds, asserted audits) |
| axe-core WCAG 2.2 AA | `.github/workflows/ci-axe.yml` | `pnpm axe` | Edit `scripts/run-axe.mjs` (`WCAG_TAGS`, `PATHS`, themes) |
| Weight budgets | `.github/workflows/ci-weight-budget.yml` | `pnpm weight-budget` | Edit constants at top of `scripts/check-weight-budget.mjs` (`PER_IMAGE_KB = 100`, `PER_PAGE_KB = 500`) |

**Phase 1 baseline (May 2026):**

- Largest page: `/about/` ≈ 120 KB total (HTML + referenced CSS + JS + favicon)
- Largest image: `favicon.svg` 0.6 KB
- Lighthouse LCP/CLS: under thresholds on all tested routes
- axe-core: 0 critical/serious violations across `/` and `/about/` in both light and dark

Add new gates by following the same pattern: scoped path filter, `permissions: contents: read` only, root-level `pnpm`-script wrapper.

## Operational Cadences

| Job | Workflow | Cadence | Phase |
|---|---|---|---|
| Site deploy | `pages-deploy.yml` | on push to `main` | 1 (FND-03) |
| Keepalive (anti-stall) | `keepalive.yml` | weekly, Mon 06:00 UTC | 1 (FND-08) |
| Heartbeat freshness | `heartbeat.yml` | daily 12:00 UTC | 1 (FND-09) |
| Lighthouse + axe + weight | `quality-gates.yml` | per PR | 1 (FND-10) |
| EU/UK scrape | `scrape-eu-uk.yml` | daily 02:00 UTC | 3 (TRK-01) |
| US-state scrape | `scrape-us-state.yml` | daily 04:00 UTC | 3 |
| Global scrape | `scrape-global.yml` | weekly Sun 03:00 UTC | 3 |
| Vendor policy scrape | `scrape-vendor.yml` | weekly Wed 05:00 UTC | 3 |
| Load-alarm auto-throttle | `load-alarm.yml` | hourly | 3 (TRK-10) |
| Vector reindex | `reindex-vectors.yml` | on content-merge path filter | 5 (CHT-02) |

The exact cron strings live in `apps/site/src/config/site.ts` (`KEEPALIVE_CRON`) and per-workflow YAML.

## Escalation Path

| Tier | Channel | Target response |
|---|---|---|
| 1 | GitHub Issues, label `urgent` | 72h normal, 1 week in sustainability mode |
| 2 | Maintainer email (PLACEHOLDER until Phase 6) | 5 business days |
| 3 | Co-maintainer (vacancy — see below) | n/a |

Security disclosures: see `SECURITY.md` (single contact, 30-day coordinated-disclosure policy).

## Co-Maintainer Recruitment

**Co-maintainer wanted.** If you read this domain weekly and have AI governance practitioner experience, open an issue with label `co-maintainer-interest`. The review workflow is:

1. Per-source AI-draft PR opens with a 5-line summary + reviewer checklist + machine-verified `<RegQuote>` citations.
2. Verifier CI re-fetches each cited snapshot and fails on mismatch (Pitfall 3 mitigation).
3. Reviewer reads the 5-line summary, spot-checks one quote, merges or requests changes.

The whole loop targets <15 minutes per PR to keep the maintenance budget realistic.

## Graceful Sunset Plan

Per Pitfall 7 recovery:

- If active maintenance pauses for **>2 weeks**, the README is updated to say so.
- If the project is **abandoned**, this site (and the README) directs readers to authoritative primary sources:
  - [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
  - [UK ICO AI and data protection guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/)
  - [ISO/IEC 42001:2023 AI Management System](https://www.iso.org/standard/81230.html)
- Public-launch flip (Phase 6 TAD-05) explicitly verifies the sunset plan is in place.

## Cross-references

- [SETUP.md](./SETUP.md) — human-action checklist (gh repo, Cloudflare, secrets)
- [SECURITY.md](./SECURITY.md) — security disclosure policy
- [CONTRIBUTING.md](./CONTRIBUTING.md) — content workflow + voice rules + anti-features
- `apps/site/src/config/site.ts` — feature flags, density thresholds, operational constants

Maintainer attribution lives in `apps/site/src/config/site.ts` (`MAINTAINER_NAME`, `MAINTAINER_GITHUB_HANDLE`) so a single config flip updates every surface that references it.
