---
plan: 01-02
phase: 01-foundation-chrome
status: complete
completed: 2026-05-24
requirements: [FND-01]
---

# Plan 01-02 Summary — pnpm monorepo + @aigov/shared Zod schemas

## What was built

- pnpm workspace skeleton with five workspaces declared in `pnpm-workspace.yaml`: `apps/site`, `apps/chat-worker`, `apps/pipeline`, `packages/shared`, `packages/embed-cli`.
- Root `package.json`: `packageManager: pnpm@10.11.1`, `engines.node: >=22.0.0 <23.0.0`, scripts (`build`, `dev`, `typecheck`, `lint`, `test`, `clean`), dev deps pinned (TS 5.6.3, prettier 3.4.2, @types/node 22.10.1) — all exact versions per `.npmrc save-exact=true`.
- `tsconfig.base.json` with strict mode, `noUncheckedIndexedAccess`, `noImplicitOverride`, `verbatimModuleSyntax`, ES2022 target, NodeNext module resolution, and `@aigov/shared`/`@aigov/shared/*` path aliases.
- Workspace stubs for `apps/chat-worker`, `apps/pipeline`, `packages/embed-cli` (placeholder packages with echo build scripts — real code lands in their respective phases).
- `@aigov/shared` package: 6 Zod schemas exported as the single source of truth for content collections — `StageFrontmatter` + `RegulationRef`, `RegulationFrontmatter`, `SnapshotFrontmatter`, `VendorFrontmatter`, `GlossaryFrontmatter`, `StoryFrontmatter`. Each schema exports the parser plus an inferred TS type (`Stage`, `Regulation`, etc.).
- URL builders in `packages/shared/src/urls.ts`: `stageUrl`, `regulationUrl`, `snapshotUrl`, `vendorUrl`, `glossaryUrl`, `storyUrl`, `articleAnchor` (kebab-cases article IDs into hash anchors).
- Barrel files: `src/schemas/index.ts`, `src/types.ts`, `src/index.ts`.
- `zod` pinned to `3.23.8` (only runtime dep in `packages/shared`).
- `pnpm-lock.yaml` committed.

## Pinned versions

| Package | Version | Why |
|---|---|---|
| pnpm | 10.11.1 | Current LTS-ish; `packageManager` field locks it across machines |
| node | >=22.0.0 <23.0.0 | Engine-strict; pinned in `.nvmrc` |
| typescript | 5.6.3 | Stable 5.6 line; Astro 6 requires >=5.5 |
| @types/node | 22.10.1 | Matches Node 22 runtime |
| prettier | 3.4.2 | Latest 3.4.x |
| zod | 3.23.8 | Stack pin; downstream Astro content collections also use Zod via `astro/zod` |

## Schema inventory

```
packages/shared/src/schemas/
├── stage.ts        — StageFrontmatter, RegulationRef (12-stage spine)
├── regulation.ts   — RegulationFrontmatter (per-source index.md)
├── snapshot.ts     — SnapshotFrontmatter (dated per-source captures)
├── vendor.ts       — VendorFrontmatter (vendor policy index.md)
├── glossary.ts     — GlossaryFrontmatter (one term per file)
├── story.ts        — StoryFrontmatter (fictional company narratives)
└── index.ts        — barrel
```

## URL builder API surface

```ts
stageUrl("risk-tiering")                    → "/stages/risk-tiering/"
regulationUrl("eu-ai-act")                  → "/regulations/eu-ai-act/"
snapshotUrl("eu-ai-act", "2026-05-22")      → "/regulations/eu-ai-act/2026-05-22/"
vendorUrl("openai")                         → "/vendor/openai/"
glossaryUrl("model-card")                   → "/glossary/model-card/"
storyUrl("sigma-health")                    → "/stories/sigma-health/"
articleAnchor("Art-11")                     → "#art-11"
articleAnchor("Annex IV")                   → "#annex-iv"
```

## Verification

- `pnpm install` succeeds (5 workspace projects resolved, lockfile created)
- `pnpm --filter @aigov/shared typecheck` exits 0
- Smoke test via `tsx`: all URL builders return documented paths; `StageFrontmatter.parse({ stage: 1, slug: 'test', title: 'T', personas: {}, regulations: [] })` applies defaults (`personas.exec=true`, `draft=false`)
- Workspace symlink works (verified `pnpm install` linked `@aigov/shared` across workspaces)

## Commits

- chore(01-02): pnpm monorepo scaffold + tsconfig.base + workspace stubs (FND-01 task 1)
- feat(01-02): @aigov/shared — 6 Zod schemas + URL builders + types barrel (FND-01 task 2)

## Deviations

- pnpm 10.11.1 was already installed (plan suggested "9.x"). Used the installed version, which is forward-compatible. Engines pin updated to `pnpm: ">=10.0.0"`.
- Added `build` script to `packages/shared/package.json` (echo only) so `pnpm -r run build` does not fail with "missing script".

## What this enables

- Wave 2 plans (01-03, 01-04, 01-05, 01-06) can now import `@aigov/shared` for their schemas and URL builders without copy-pasting.
- Astro content collections (plan 01-04) will use these schemas directly as the validation source.
- Pipeline (Phase 3) and chat-worker (Phase 5) inherit the same workspace topology.

## Self-Check: PASSED
