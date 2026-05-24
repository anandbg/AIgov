# MAINTENANCE.md — operational contract

This site is built and maintained as a single-author public knowledge resource. The contract below documents how the site stays current, what to do when it doesn't, and the explicit gates that govern public-release readiness.

## Maintenance Model

This project has **one maintainer (Anand)**. The honest weekly capacity:

- ~4 hours reviewing AI-drafted scrape PRs (Phase 3 onward)
- ~4 hours authoring or editing stage content (Phase 2 onward)

If the review queue grows faster than capacity, the pipeline cadence auto-throttles (see `## Sustainability Mode` below). Single-maintainer fragility is acknowledged in `apps/site/src/content/docs/about/index.mdx` so readers can calibrate trust accordingly (Pitfall 7).

## Sustainability Mode

**Dual-trigger** safety valve so a busy week doesn't silently rot the site:

1. **Manual toggle** — flip `sustainabilityMode = true` in `apps/site/src/config/site.ts`, commit, push. Next deploy surfaces the "Maintained at low cadence" notice site-wide.
2. **Automatic toggle** *(future TRK-10 work)* — a `load-alarm.yml` workflow will flip the flag when the open AI-draft PR backlog exceeds `SUSTAINABILITY_PR_THRESHOLD = 8`.

When sustainability mode is active:

- Site-wide warning banner renders (`SustainabilityNotice` component).
- Maintainer response-time target is 1 week instead of 72h.
- Optional: pause the daily vendor scrape workflow from the Actions UI if PR review is genuinely backed up.

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

These are the live, wired-up workflows. Cron expressions are in UTC.

| Job | Workflow | Cadence | Notes |
|---|---|---|---|
| Site deploy | `.github/workflows/deploy-site.yml` | on push to `main` | Rebuilds Astro and publishes to GitHub Pages (~90 s) |
| Keepalive (anti-stall) | `.github/workflows/keepalive.yml` | weekly, Mon 06:00 | Prevents GitHub auto-disabling scheduled crons on a quiet repo |
| Heartbeat freshness | `.github/workflows/heartbeat.yml` | daily 12:00 | Writes `.heartbeat/last-run-*.json`; surfaced by `<HeartbeatStatus>` on `/about/` |
| Global scrape (regulations) | `.github/workflows/scrape-global.yml` | weekly Sun 03:00 | Runs the `global` source group: NIST, EU AI Act, UK ICO, ISO 42001 |
| Vendor scrape (policies) | `.github/workflows/scrape-vendors.yml` | daily 09:00 | Runs the `vendors` source group: OpenAI, Anthropic, Google |
| Lighthouse / axe / weight / content gates | `.github/workflows/ci-*.yml` | per PR | Blocks merge on regression |

The source groups themselves are defined in `apps/pipeline/src/cli/index.ts` (`SOURCE_GROUPS`). To run any group manually: `pnpm --filter @aigov/pipeline run-group global` (or `vendors`). To run a single source: `pnpm --filter @aigov/pipeline run-source eu-ai-act`.

## What you actually do each week

The pipeline opens a PR for you. Your job is to skim it and merge. Concretely:

1. **Sunday morning** — Open the repo. There may be one or two open PRs labelled `scrape`:
   - `data(global): weekly scrape YYYY-MM-DD` (from `scrape-global.yml`)
   - `data(vendors): daily scrape YYYY-MM-DD` (one most days — only if a vendor policy moved)
2. **Skim the diff.** The meaningful-diff filter has already discarded whitespace and trivial edits. Anything you see is a real change. Look for:
   - New paragraphs, deleted paragraphs, reworded prohibitions.
   - URL or filename changes that suggest the regulator restructured the page (sanity-check failures often follow these).
   - Vendor AUP additions — Anthropic and OpenAI have both expanded their prohibited-use lists with little notice.
3. **Merge** if it looks right. Deploy fires automatically; the new snapshot appears on `/whats-new/` and `/regulations/{source}/{date}/` within ~90 seconds.
4. **Close without merging** if something looks off (e.g., a regulator served a stub page during scrape and the diff is wholesale gibberish). Re-trigger the workflow from the Actions tab to fetch fresh.

Total weekly effort is realistically **15–30 minutes**.

## Adding a new source

Each adapter is a single TypeScript file. The runner handles fetching, diffing, snapshot persistence, and PR opening — adapters only fetch + parse + sanity-check.

1. Pick a stable `source` slug (kebab-case, ≤30 chars). It becomes:
   - the folder under `apps/site/src/content/regulations/{slug}/`
   - the URL path `/regulations/{slug}/`
   - the snapshot-file path `apps/site/src/content/regulations/{slug}/snapshots/{date}.md`
2. Create `apps/pipeline/src/sources/{slug}/index.ts` exporting a default `SourceAdapter`. Use any existing source as a template (`nist-ai-rmf` is the cleanest). The adapter must:
   - Define `CANONICAL_URL` (cited) and (if different) a `FETCH_URL` (scraped).
   - Implement `fetch()` returning `{ snapshotDate, body, frontmatter }`.
   - Implement `sanityCheck(result)` with word-count bounds + must-contain phrases.
3. Register the adapter in `apps/pipeline/src/cli/index.ts`:
   - Import at the top.
   - Add to the `SOURCES` map.
   - Add the slug to the right `SOURCE_GROUPS` entry (`global` or `vendors`).
4. Create the regulation index file `apps/site/src/content/regulations/{slug}/index.md` with the canonical `source`, `name`, `kind`, `jurisdiction`, `canonicalUrl`, `firstTrackedAt`, `description` frontmatter.
5. Test locally:
   ```
   pnpm --filter @aigov/pipeline run-source {slug}
   ```
   Expect either "wrote snapshot..." or "no write — diff below noise floor".
6. Commit, push. The next scheduled run picks it up.

## When a sanity-check fails

The most common failure mode is a regulator restructuring their page (a new CDN, a redesign, an A/B test). Symptoms in the workflow log:

```
[source] FAILED: word count 42 below min 200 — possible scrape failure
```

Recovery:

1. **Don't panic** — the group runner continues past a single-source failure. The other sources still scraped. You'll see this in the workflow summary: `group "global" — 3/4 sources captured`.
2. **Open the source URL in a browser.** Has the page moved? Is it now JS-rendered? Is it gated behind a cookie banner that the adapter can't dismiss?
3. **Pick a fix** depending on the cause:
   - URL moved → update `FETCH_URL` in the adapter, re-run.
   - Selector changed → update the cheerio selector in the adapter's `fetch()`.
   - Gated content → switch to a mirror or a parallel official source.
   - Bot-detected → add a real browser `User-Agent` header (and `Sec-Ch-Ua` for Cloudflare).
4. **Test locally** before pushing:
   ```
   pnpm --filter @aigov/pipeline run-source {slug}
   ```
5. **Commit the adapter fix** with a `fix(pipeline)` commit message. The next scheduled run picks it up.

If a source is *permanently* broken (e.g., a regulator paywalls everything), remove it from `SOURCE_GROUPS` in `apps/pipeline/src/cli/index.ts` and leave a comment explaining why. The historical snapshots stay on the site.

## Bot-detection cookbook

A real-world note from the first integration round: not all sources accept the default Node `fetch` UA.

| Source class | What works | What fails |
|---|---|---|
| Government / standards (NIST, UK ICO, ISO) | Default UA accepted | n/a |
| EUR-Lex (EU AI Act) | Returns `202 Accepted` with empty body to non-interactive clients; **use the community mirror** at `artificialintelligenceact.eu/the-act/` and cite the OJ URL | Direct CELEX query URLs |
| Cloudflare-fronted sites (OpenAI, plus others over time) | A real Chrome `User-Agent` + `Sec-Ch-Ua*` + `Sec-Fetch-*` headers passes through | Default Node UA → 403 |
| Bot-friendly mirrors (Anthropic, Google AI) | Default UA accepted | n/a |

Pattern: copy the headers from `apps/pipeline/src/sources/openai-usage-policy/index.ts` if you need to bypass a Cloudflare challenge for a new source.

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
