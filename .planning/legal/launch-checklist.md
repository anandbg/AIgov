# Launch Checklist — public-flip gate

This file is the **hard gate** for `gh repo edit --visibility public`. Every item below must be checked, dated, and signed before the public flip. Maintained as the canonical Phase 6 artefact (TAD-06).

## TAD-01 — Lawyer sign-off (BLOCKER)

- [ ] Lawyer engaged: ________________________ (name, firm, jurisdiction)  Date: __________
- [ ] Lawyer has reviewed and signed off in writing on:
  - [ ] Footer disclaimer copy (`apps/site/src/components/DisclaimerBanner.astro` variant=footer)
  - [ ] Per-regulation banner disclaimer
  - [ ] About page sustainability + density framing (`apps/site/src/content/docs/about/index.mdx`)
  - [ ] Wizard output framing ("topics to discuss with counsel") (`apps/site/src/pages/wizard.astro`)
  - [ ] Chat system prompt (lands when Phase 5 worker is fully wired)
  - [ ] Terms of use (drafted at Phase 6 — `apps/site/src/content/docs/terms.mdx`)
- [ ] Sign-off PDF / email committed to `.planning/legal/sign-off-YYYY-MM-DD.{pdf,eml}`

## TAD-02 — 3-jurisdiction beta review (BLOCKER)

- [ ] EU reviewer: ________________________ (name, role)  Date: __________
- [ ] UK reviewer: ________________________ (name, role)  Date: __________
- [ ] APAC reviewer: _____________________ (name, role)  Date: __________
- [ ] All review feedback filed as GitHub issues
- [ ] All blocking issues resolved or explicitly deferred to v1.1 with written reasoning

## TAD-03 — Edit on GitHub + analytics + OG cards

- [ ] `editLink.baseUrl` in `apps/site/astro.config.mjs` points at the real repo (currently `PLACEHOLDER_ORG`)
- [ ] `MAINTAINER_GITHUB_HANDLE` in `apps/site/src/config/site.ts` updated from placeholder
- [ ] `REPO_URL` constant updated
- [ ] Cloudflare Web Analytics enabled in Cloudflare dashboard (zero-cookie, aggregate, no PII)
- [ ] No GA / Plausible / any tracker script anywhere in the codebase (verify via `grep -r 'gtag\|googletagmanager\|plausible' apps/site/`)
- [ ] OG/Twitter cards generated at build time and verified on Twitter Card Validator + LinkedIn Post Inspector
- [ ] Favicon set replaces the Phase 1 placeholder

## TAD-04 — Cloudflare Web Analytics

- [ ] Account at `dash.cloudflare.com` linked to the zone
- [ ] Web Analytics → Add a site → enabled (cookieless)
- [ ] Token added to `apps/site/src/components/Head.astro` as a `<script defer src=".../beacon.min.js" data-cf-beacon='{"token":"..."}'></script>`
- [ ] Documented in MAINTENANCE.md cross-references

## TAD-05 — Final WCAG 2.2 AA + Core Web Vitals + density verification

- [ ] `pnpm axe` exits clean on all stage routes + about + wizard + whats-new (light + dark)
- [ ] `pnpm lighthouse` LCP < 2.5s, CLS < 0.1, INP < 200ms on landing + about + a representative stage
- [ ] Real-device manual mobile test on iOS Safari + Android Chrome — no horizontal scroll, theme toggle works, ⌘K Pagefind opens
- [ ] Manual keyboard nav: skip-link works, persona switch is keyboard-reachable, glossary tooltips dismissible
- [ ] Density gate:
  - [ ] 12 stages authored (CNT-01)
  - [ ] ≥60 glossary terms (CNT-07)
  - [ ] ≥30 regulation snapshots across all sources (TRK-04)
  - [ ] DensityStatus on `/about/#density` shows all three bars at 100%

## TAD-06 — Public flip

- [ ] All "Looks Done But Isn't" PITFALLS.md items checked here (see below)
- [ ] README updated to point at the live site URL
- [ ] `apps/site/src/content/docs/about/index.mdx` "Status:" footer updated
- [ ] Lawyer sign-off cross-referenced from MAINTENANCE.md
- [ ] Final dry-run via `wrangler deploy --dry-run` for chat worker
- [ ] Run `gh repo edit --visibility public`
- [ ] Post the launch on the maintainer's preferred channel (the project is no-marketing — a single LinkedIn post is sufficient)

## Pitfall sweep ("Looks Done But Isn't")

- [ ] Pitfall 1 (citation drift): every `<RegQuote>` cites a dated snapshot URL, not a rolling canonical
- [ ] Pitfall 2 (UPL framing): `pnpm voice-check` green; About page disclaimer renders; per-regulation banner active on regulation pages
- [ ] Pitfall 3 (PR review fatigue): scrape PRs include 5-line summary; verify-quotes CI active when multi-source
- [ ] Pitfall 4 (GitHub auto-disable): keepalive.yml fired at least once; verify in Actions tab
- [ ] Pitfall 5 (scraper brittleness): per-source RUNBOOK.md exists; diff-size circuit-breaker active
- [ ] Pitfall 6 (hallucinated quotes): voice-check enforces; RegQuote-only policy in CONTRIBUTING.md
- [ ] Pitfall 7 (solo-author): MAINTENANCE.md sustainability mode + graceful sunset plan in writing
- [ ] Pitfall 8 (lens rot): `pnpm persona-lens-check` green on every PR
- [ ] Pitfall 9 (Cloudflare proxy): orange-cloud on; verify via `curl -I https://SITE_DOMAIN | grep '^server: cloudflare'`
- [ ] Pitfall 10 (chat cost spiral): DAILY_BUDGET_USD set; KV counter active
- [ ] Pitfall 11 (sparse-corpus search): density threshold met (see TAD-05)
- [ ] Pitfall 12 (jurisdiction blind spots): all 4 fictional companies referenced; multi-jurisdiction wizard branches
- [ ] Pitfall M-1 (glossary first-occurrence): build-time wrapper active or explicit `<GlossaryTerm>` discipline documented
- [ ] Pitfall M-2 (mobile Mermaid): every MermaidJourney emits the `<details>` fallback
- [ ] Pitfall M-6 (Lighthouse regression): ci-quality.yml gates every PR

## Sign-off

Public-flip approved by: ________________________  Date: __________
