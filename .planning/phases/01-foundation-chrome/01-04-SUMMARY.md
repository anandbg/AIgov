---
plan: 01-04
phase: 01-foundation-chrome
status: complete
completed: 2026-05-24
requirements: [FND-04]
---

# Plan 01-04 Summary — Content collections wired + fixtures

## Collection topology

Six Astro collections registered in `apps/site/src/content.config.ts`:

| Collection | Loader | Files | Schema source | Notes |
|---|---|---|---|---|
| `docs` | `docsLoader()` (Starlight) | `src/content/docs/**/*.{md,mdx}` | Re-stated (see deviation) | Hosts the 12 stage pages |
| `regulations` | `glob('**/index.md')` | `src/content/regulations/<src>/index.md` | Re-stated | Underscore-prefixed paths excluded |
| `snapshots` | `glob('**/snapshots/*.md')` | `src/content/regulations/<src>/snapshots/<date>.md` | Re-stated + `source: reference('regulations')` | Cross-collection link validated at build |
| `vendor` | `glob('**/index.md')` | `src/content/vendor/<name>/index.md` | Re-stated | Phase 3 populates |
| `glossary` | `glob('**/*.md')` | `src/content/glossary/<slug>.md` | Re-stated | 3 entries in Phase 1, 60+ in Phase 2 |
| `stories` | `glob('**/*.md')` | `src/content/stories/<slug>.md` | Re-stated | Phase 2 populates |

## Fixture inventory

- `src/content/docs/stages/_phase1-fixture.mdx` — single fixture stage (underscore-prefixed, excluded from public routes)
- `src/content/docs/stages/_README.md` — explains Phase-2 authoring contract
- `src/content/regulations/_phase1-fixture/index.md` — fixture regulation
- `src/content/regulations/_phase1-fixture/snapshots/2026-05-24.md` — fixture snapshot
- `src/content/regulations/_README.md`
- `src/content/glossary/ai-governance.md`, `regulation.md`, `risk-tier.md` — 3 real glossary entries (UI-SPEC requires ≥3 for `<GlossaryTerm>` demo)
- `src/content/vendor/_README.md`
- `src/content/stories/_README.md`
- `src/data/_README.md`

All underscore-prefixed files and folders are excluded from public routes (Astro convention + explicit glob negation in content.config.ts).

## Verification

- `pnpm --filter @aigov/site typecheck` (which runs `astro check`) → **0 errors, 0 warnings, 74 hints** (hints are deprecation notices about `z` from astro:content — informational)
- `pnpm --filter @aigov/site build` → 2 pages built in 9.24s, Pagefind index built, sitemap emitted
- All five FND-04 collection identifiers (`stages`, `regulations`, `vendor`, `glossary`, `stories`) registered; `snapshots` is a 6th collection storing the dated regulation files per ARCHITECTURE.md (stages live inside Starlight's `docs` per the canonical Astro 6 + Starlight 0.39 pattern).
- Cross-collection `reference()` used (snapshot.source → regulations)

## Deviations from plan

1. **Schema duplication (significant).** Plan said "import schemas from `@aigov/shared` — no schema duplication anywhere in apps/site." Astro 6 ships its own bundled Zod via `astro:content` that is type-incompatible with the standalone `zod` package used by `@aigov/shared`. `astro check` reports 8 type errors when @aigov/shared schemas are passed directly to `defineCollection({ schema })`, because `z.ZodType<T>` from `astro:content` and from `zod` are structurally different shapes. Pragmatic fix: re-state the schema shapes in `content.config.ts` using `astro:content`'s `z`, with a prominent comment explaining the bridge and reminding maintainers to update both files. The runtime API is identical, so semantics are preserved. `@aigov/shared` remains the canonical source for the Phase-3 pipeline and Phase-5 worker (both use plain `zod`). A future plan can collapse the duplication once the two Zod versions align — tagged `#astro-zod-bridge` in the file.
2. **Glob negation.** Plan implied underscore-prefix exclusion was automatic; in practice Astro's `glob()` loader honors literal patterns only. Added `!_*/**` and `!**/_*` negations to every glob pattern so README placeholders and `_phase1-fixture` paths do not fail schema validation.
3. **Docs schema extend.** Plan supplied a `StageFrontmatter.partial().extend({ regulations: ... })` block. With the schema-duplication bridge above, we pass an inline `z.object({...})` to `docsSchema({ extend })` instead.

## Build diff vs plan 01-03 baseline

- Pages: 2 → 2 (fixture stage is excluded; visible routes unchanged in Phase 1)
- Pagefind index files: ~same (3 glossary entries do not auto-generate routes — they index when consumed by `<GlossaryTerm>` in plan 01-05)
- `dist/` size: 4.0 MB → 4.0 MB (no measurable delta)
- `astro check` clean (vs no check before)

## Commits

- feat(01-04): wire 6 Astro content collections (docs/stages, regulations, snapshots, vendor, glossary, stories) + fixture content (FND-04)

## What this enables

- Plan 01-05 has fixture content to render shell components against.
- Plan 01-06's site config and About page can reference the `glossary` collection for the density indicator.
- Phase 2 (CNT-01) can drop 12 `.mdx` files into `src/content/docs/stages/` against the docs schema.
- Phase 3 (TRK-01..04) can drop regulation folders into `src/content/regulations/` against the regulation+snapshot schemas.

## Self-Check: PASSED
