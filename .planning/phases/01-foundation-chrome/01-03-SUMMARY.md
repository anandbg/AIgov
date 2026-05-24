---
plan: 01-03
phase: 01-foundation-chrome
status: complete
completed: 2026-05-24
requirements: [FND-02, SRC-01, SRC-02]
---

# Plan 01-03 Summary — Astro 6 + Starlight + Tailwind v4 + Pagefind scaffold

## What was built

- `apps/site` Astro 6 site that builds (`pnpm --filter @aigov/site build` → exit 0), produces `dist/index.html`, indexes Pagefind into `dist/pagefind/`, and emits a sitemap.
- Starlight 0.39.2 configuration with the **12-stage AI Governance Journey** sidebar (placeholder badges "Phase 2"), plus About, What's new, Wizard top-level items.
- Tailwind v4 wired via the new `@tailwindcss/vite` plugin (not the legacy PostCSS plugin) — no `tailwind.config.js`.
- `global.css` (168 lines) with the verbatim UI-SPEC `@theme` block: slate-indigo accent palette (`--color-accent-600: #4f46e5`), cool-gray neutrals, system-font stacks (no web fonts), motion tokens, Starlight CSS-variable bridging for light + dark, reduced-motion default, persona/jurisdiction visibility CSS, focus ring, skip-link styles, 44px touch-target floor, full print stylesheet.
- Astro integrations registered in the correct order (mermaid → icon → starlight → mdx, because Starlight's bundled `astro-expressive-code` must precede mdx).
- `src/content.config.ts` — minimal Starlight `docs` collection declaration (the five project collections land in plan 01-04).
- `public/.nojekyll` so GitHub Pages skips Jekyll over `_astro/` assets.
- `public/favicon.svg` — hand-authored 12-segment ring in the slate-indigo accent (mirrors the 12-stage journey), 0.6 KB.

## Pinned versions

| Package | Version | Notes |
|---|---|---|
| astro | 6.3.7 | Astro 6 stable line |
| @astrojs/starlight | 0.39.2 | First Astro 6 compatible version |
| @astrojs/starlight-tailwind | 5.0.0 | **Deviation:** plan said "4.0.x" — 5.0.0 is the Starlight 0.39 compatible release |
| @astrojs/mdx | 5.0.6 | **Deviation:** plan said "4.0.x" — 5.0.6 is the Astro 6 compatible release |
| tailwindcss | 4.3.0 | Tailwind v4 |
| @tailwindcss/vite | 4.3.0 | Required (NOT PostCSS plugin) |
| astro-mermaid | 2.0.1 | Mermaid integration with `autoTheme` |
| mermaid | 11.15.0 | **Added:** astro-mermaid does not declare it, needed as a peer for client-side rendering |
| astro-icon | 1.1.5 | Lucide icon set |
| @iconify-json/lucide | 1.2.109 | Icon source |
| sharp | 0.34.5 | Astro image optimization (requires pnpm `onlyBuiltDependencies` allowlist) |
| @astrojs/check | 0.9.9 | Astro check CLI |

## 12-stage sidebar labels (matches CNT-01 verbatim)

1. AI Policy · 2. Risk Tiering · 3. Risk Check · 4. Compliance · 5. Third-party AI Risk · 6. Data Controls · 7. Continuous Red-teaming · 8. Documentation · 9. Accountability · 10. Agentic AI Oversight · 11. Incident Response · 12. Monitoring

## Verification

- `pnpm install` succeeds (workspace symlinks `@aigov/shared` into `@aigov/site`)
- `pnpm --filter @aigov/site build` exits 0 → 2 pages, Pagefind index built in 1.66s, 11.53s total
- `dist/index.html` contains "AI Governance" + Phase 1 placeholder copy + 12 sidebar items
- `dist/_astro/*.css` contains `color-accent-600: #4f46e5` (Tailwind v4 picked up @theme block)
- `dist/pagefind/` directory exists with the search index
- `dist/sitemap-index.xml` exists
- Build output size baseline: **4.0 MB** total (this is the FND-10 baseline; budget tuning in plan 01-08)

## Deviations from plan

1. **Versions:** `@astrojs/starlight-tailwind` is 5.0.0 (plan suggested 4.0.x) and `@astrojs/mdx` is 5.0.6 (plan suggested 4.0.x). Plan acknowledged these may need adjustment for Astro 6 / Starlight 0.39 compatibility — used the actually compatible releases.
2. **Added `mermaid` runtime dep:** `astro-mermaid` does not declare it; the build complains "Failed to resolve mermaid from astro:scripts/page.js". Pinned `mermaid: 11.15.0`.
3. **Integration order:** Plan listed `mermaid, icon, mdx, starlight`. Starlight 0.39 internally registers `astro-expressive-code` which insists on running before mdx — final order is `mermaid, icon, starlight, mdx`.
4. **`src/content.config.ts`:** Plan did not list this file. Starlight 0.39 errors on build without a collection-config import. Stub created here with just the Starlight `docs` collection; plan 01-04 will add the 5 project collections.
5. **`pnpm.onlyBuiltDependencies`:** Added `["esbuild", "sharp"]` to the root `package.json` so pnpm 10 runs their install scripts (otherwise sharp's binary download is skipped and Astro image fails at build time).

## Commits

- feat(01-03): Astro 6 + Starlight 0.39 + Tailwind v4 + Mermaid + Icon scaffold with 12-stage sidebar (FND-02, SRC-01, SRC-02 task 1)
- feat(01-03): global.css — Tailwind v4 @theme + slate-indigo accent + system fonts + reduced-motion + persona/jurisdiction visibility + focus ring + print stylesheet (FND-02 task 2)

## What this enables

- Plan 01-04 can wire the five content collections against `@aigov/shared` schemas.
- Plan 01-05 can drop in shell components (PersonaSwitch, DisclaimerBanner, SustainabilityNotice, MermaidJourney) with CSS hooks already in place.
- Plan 01-06 can populate `apps/site/src/config/site.ts` and the About page.
- Plan 01-07/01-08 can deploy and gate the build on Lighthouse/axe.

## Self-Check: PASSED
