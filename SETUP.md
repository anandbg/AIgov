# SETUP.md — Human-Action Checklist for AIgov

This file documents every step that **you (the human maintainer) must perform** to take this repository from its current state to a live, public-facing URL. Every action Claude can perform autonomously is listed in the "Automated" column at the bottom — those will be handled by the GSD execution pipeline.

> Convention: `▶ paste-into-shell` denotes commands you copy verbatim into a terminal at the repo root.

---

## Prerequisites

You need a recent Node 22 runtime and pnpm via corepack. The repo pins these via `.nvmrc` and `.npmrc`.

```bash
# Install/select Node 22 (LTS) via nvm
nvm install 22
nvm use

# Enable corepack (ships with Node) and pin pnpm
corepack enable
corepack prepare pnpm@latest --activate

# Verify
node --version   # → v22.x
pnpm --version   # → 10.x or later
```

If you do not use `nvm`, install Node 22 LTS from <https://nodejs.org/> and ensure `corepack` is on `$PATH`.

---

## Local Development

After plan 01-03 has landed the Astro scaffold (this happens automatically in Wave 2), you can run the site locally:

```bash
pnpm install
pnpm dev
# → http://localhost:4321
```

Until then, `pnpm install` will report "no workspace packages" — that is expected. Plan 01-02 introduces `pnpm-workspace.yaml`.

---

## GitHub Repository Setup

The project must live in a **private** repository until Phase 6 sign-off, then flip to public.

```bash
# From the repo root (must be a clean working tree)
gh repo create AIgov --private --source=. --remote=origin --description "Public AI Governance knowledge site"

# Push the initial branch
git push -u origin main
```

If you do not have `gh` installed: <https://cli.github.com/>. Alternatively, create the repository manually in GitHub's UI and then:

```bash
git remote add origin git@github.com:<your-user>/AIgov.git
git push -u origin main
```

The repo **stays private** until every Phase 6 checklist item passes (see `.planning/phases/06-polish-pre-launch/06-LAUNCH-CHECKLIST.md` when it lands).

---

## GitHub Pages Configuration

Plan 01-07 ships the `pages-deploy.yml` workflow which deploys on every push to `main`. Before that workflow can succeed you must enable Pages once in the repo settings.

1. In GitHub: **Settings → Pages**
2. **Source:** GitHub Actions (not "Deploy from a branch")
3. **Custom domain:** leave blank for now (we fill it in during the Domain Switch Procedure below)
4. Save.

After enabling, the first push to `main` will populate the deployment URL: `https://<your-user>.github.io/AIgov/`. Plan 01-03 ships a base-path-aware Astro config so links work both at that URL and at the eventual apex domain.

---

## Cloudflare Account & DNS

The site is fronted by Cloudflare's free CDN. **Bandwidth shielding only works in proxy mode.** Skipping this step is the most common Day-1 outage cause (see `.planning/research/PITFALLS.md#pitfall-9`).

1. Create a Cloudflare account at <https://dash.cloudflare.com/sign-up> (free tier is sufficient).
2. Add your final apex domain as a zone (the placeholder `SITE_DOMAIN` is recorded in `apps/site/src/config/site.ts` after plan 01-06 lands).
3. **DNS records:** point `CNAME @ <your-user>.github.io` and `CNAME www <your-user>.github.io`.
4. **Proxy mode (orange cloud) is REQUIRED.** Each DNS record above must have the orange-cloud icon on (proxied), not gray-cloud (DNS-only). Without this, Cloudflare cannot terminate TLS for you, cache, or shield bandwidth.
5. **Universal SSL:** set to **Full (strict)** in Cloudflare → SSL/TLS. GitHub Pages presents a valid Let's Encrypt cert, so Full (strict) works end-to-end.
6. **Cache Rules** (Cloudflare → Caching → Cache Rules — free plan supports the two rules we need):
   - **Rule 1 (hashed assets, year-long immutable cache):**
     - When: `URI Path` matches `/_astro/*`
     - Then: `Cache-Control: public, max-age=31536000, immutable`, Edge TTL: 1 year, Browser TTL: respect origin
   - **Rule 2 (HTML routes, short revalidation):**
     - When: `URI Path` ends with `/` OR matches `*.html`
     - Then: `Cache-Control: public, max-age=300, must-revalidate`, Edge TTL: 5 minutes
7. **Always Use HTTPS:** turn ON.
8. **Auto Minify:** leave OFF (Astro already minifies; double-minify can corrupt inline JSON).

---

## Required GitHub Secrets

Phase 1 needs exactly **one optional secret**. Add it via **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Required | Purpose | Phase |
|--------|----------|---------|-------|
| `HEARTBEAT_WEBHOOK_URL` | Optional | Slack/Discord/Pushover webhook for heartbeat-job failures and load-alarm trips (FND-09). If unset, heartbeat workflow logs to Actions output only. | 1 |

Cloudflare API tokens, Anthropic keys, and Turnstile secrets are **Phase 3 / Phase 5 scope** — do not create them in Phase 1.

---

## Domain Switch Procedure

When you acquire and assign the final `SITE_DOMAIN`:

1. Edit `apps/site/src/config/site.ts` (created by plan 01-06):
   ```ts
   export const SITE_DOMAIN = "your-real-domain.example"
   ```
2. Update the Cloudflare DNS records to point at GitHub Pages (CNAME apex + CNAME www).
3. In GitHub → Settings → Pages, set **Custom domain** to `your-real-domain.example`. GitHub will write a `CNAME` file into the deployment.
4. Wait ~10 minutes for the Let's Encrypt cert to provision under "Enforce HTTPS".
5. Verify with `curl -I https://your-real-domain.example/` — expect `200` + Cloudflare headers (`server: cloudflare`, `cf-cache-status: HIT` after a second request).

That is the only config flip required. Astro's base-path-aware build (plan 01-03) handles both URLs cleanly.

---

## What Phase 1 Ships vs Requires Human Action

| Automated (Claude does, via GSD execute-phase) | Manual (you must do) |
|---|---|
| Initialize standalone git repo + .gitignore + .gitattributes | Run `gh repo create AIgov --private --source=. --remote=origin` |
| Node 22 + pnpm runtime locks (`.nvmrc`, `.npmrc`, `.editorconfig`) | Install Node 22 via nvm + `corepack enable` |
| pnpm monorepo scaffold (`pnpm-workspace.yaml`, `apps/{site,chat-worker,pipeline}`, `packages/{shared,embed-cli}`) | Run `pnpm install` once after Wave 1 completes |
| Zod schemas in `packages/shared/src/schemas/` | — |
| Astro 6 + Starlight 0.39 + Tailwind v4 + Pagefind site scaffold | — |
| Five content collections (regulations, vendor-policies, sources, snapshots, glossary) wired to schemas | — |
| Shell components (sidebar, persona switch, density indicator, disclaimer footer, print stylesheet) | — |
| Site config (`site.ts`) + About + MAINTENANCE/SECURITY/CONTRIBUTING docs + density UI | — |
| GitHub Actions workflows: `pages-deploy.yml`, `keepalive.yml`, `heartbeat.yml` | Enable GitHub Pages → Source: GitHub Actions |
| CI quality gates: Lighthouse-CI, axe-core, page-weight budget | — |
| Cloudflare front-door documentation | Create Cloudflare account; set orange-cloud proxy; Full (strict) SSL; cache rules; HTTPS always; minify off |
| — | Set `HEARTBEAT_WEBHOOK_URL` secret (optional but recommended) |
| — | Acquire `SITE_DOMAIN` and run the Domain Switch Procedure when ready |
| — | Begin lawyer-review outreach (Phase 6 blocker — start now, takes weeks) |
| — | Begin 3-jurisdiction beta-reviewer outreach (EU + UK + APAC; Phase 6 blocker) |

If any "Automated" row above did NOT complete, run `/gsd-progress` to inspect plan state.
