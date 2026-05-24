# AI Governance — plain language, current weekly

A maintained, public knowledge site that explains AI governance in plain English and tracks the world's authoritative AI regulations and vendor frameworks. The site is structured as a 12-stage **AI Governance Journey**.

🟢 **Live site:** https://anandbg.github.io/AIgov/

## What's on the site

- **12 stage explainers** — Policy → Risk Tiering → Risk Check → Compliance → Third-party Risk → Data Controls → Red-teaming → Documentation → Accountability → Agentic Oversight → Incident Response → Monitoring. Each opens with an "In plain English" section using everyday analogies.
- **Three lenses per page** — Executive, Engineer, Compliance.
- **A wizard** that turns five questions into a personalised checklist of governance topics to take to your lawyer. No personal data leaves the browser.
- **A glossary** — ~60 plain-language definitions, hover-tooltips on every stage page.
- **A "What's new" page** — dated snapshots of every tracked regulation and vendor policy, with diffs against the previous version.

## How the site stays current

Automated GitHub Actions workflows scrape authoritative sources on a schedule, run a meaningful-diff filter, and open a PR for human review when something changes.

| Source group | Schedule | Sources |
|---|---|---|
| Global regulations | Sun 03:00 UTC weekly | NIST AI RMF, EU AI Act, UK ICO, ISO/IEC 42001 |
| Vendor policies | Daily 09:00 UTC | OpenAI Usage Policies, Anthropic AUP, Google AI Principles |

Each scrape opens a PR labelled `scrape`. The maintainer skims the diff (~15 min) and merges. The site redeploys automatically on merge.

Full operational details: see [MAINTENANCE.md](./MAINTENANCE.md).

## Stack

- **[Astro 6](https://astro.build) + [Starlight](https://starlight.astro.build)** — static site, Markdown content, accessibility-first
- **TypeScript** end-to-end
- **GitHub Pages** for hosting (free, fast, custom-domain-ready)
- **GitHub Actions** for the scrape pipeline (free for public repos)
- **pnpm workspaces** — `apps/site` (the docs site), `apps/pipeline` (the scrape pipeline), `apps/chat-worker` (Phase 5 chat — Cloudflare Worker), `packages/shared` (shared schemas + URL helpers)

## Local development

```bash
pnpm install
pnpm --filter @aigov/site dev        # local dev server at http://localhost:4321
pnpm --filter @aigov/site build      # full static build → apps/site/dist
pnpm --filter @aigov/pipeline list   # list registered scrape sources
pnpm --filter @aigov/pipeline run-source nist-ai-rmf   # run a single source
pnpm --filter @aigov/pipeline run-group global         # run a whole group
```

## Documentation

- [`MAINTENANCE.md`](./MAINTENANCE.md) — weekly workflow, scrape cadence, how to add a source, recovery from sanity-check failures.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — content style rules, anti-features, contribution workflow.
- [`SECURITY.md`](./SECURITY.md) — security disclosure policy.
- [`SETUP.md`](./SETUP.md) — first-time human setup (GitHub, secrets, etc.).
- [`docs/STYLE.md`](./docs/STYLE.md) — content voice and style guide.

## Disclaimer

This site explains AI governance in plain language. It is **not legal advice**. Talk to qualified counsel before acting on anything you read.

## License

The site **content** (stage explainers, glossary, narrative) is released under CC BY 4.0.
The **code** (Astro components, pipeline, scripts) is MIT licensed.
