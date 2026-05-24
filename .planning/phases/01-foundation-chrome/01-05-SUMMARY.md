---
plan: 01-05
phase: 01-foundation-chrome
status: complete
completed: 2026-05-24
requirements: [FND-05, FND-06, FND-11, FND-14]
---

# Plan 01-05 Summary — Shell components + global.css theme + disclaimer surface + print stylesheet

## What was built

**Content-side shell components (7 — FND-05):**
- `PersonaSection.astro` — wraps persona-tagged blocks, renders `<section data-for-persona>` for CSS visibility swap
- `RegQuote.astro` — citation primitive (Pitfall-6 comment marks it as the ONLY way to embed quoted regulation text); uses `snapshotUrl + articleAnchor` from `@aigov/shared`
- `JurisdictionLens.astro` — `<aside data-for-jurisdiction>` with corner pill
- `DiffViewer.astro` — `<details>`-based shell with `--diff-red`/`--diff-green` tokens for light + dark, no-JS fallback
- `ChangeLog.astro` — empty-state copy ("No changes tracked yet — pipeline ships in Phase 3") + populated ordered-list rendering
- `GlossaryTerm.astro` — `<dfn role="tooltip">` with `:hover`/`:focus-within` pure-CSS popover; lookups via `getEntry('glossary', slug)`
- `MermaidJourney.astro` — `flowchart LR` listing all 12 stages verbatim from CNT-01 + `<details>` fallback list with stage links

**Chrome / layout components (6):**
- `PersonaSwitch.astro` — `<div role="tablist" data-persona-tablist>` with three `<button role="tab" data-persona-value>` pills + Lucide icons (users / code-2 / scale) + "Reset to all lenses" link
- `DisclaimerBanner.astro` — `variant='footer'` (always-visible 14px muted under SiteFooter) and `variant='banner'` (sticky per-regulation with `Not legal advice` pill, regulation name, last-scraped, dismiss button persisting in `sessionStorage[aigov:reg-disclaimer-dismissed]`)
- `SustainabilityNotice.astro` — renders only when `siteConfig.sustainabilityMode === true` (currently false; plan 01-06 wires the flag); warning-tinted bar with `lucide:clock-alert`
- `SkipLink.astro` — `<a class="skip-link" href="#main-content">` (CSS already in `global.css` from plan 01-03)
- `Head.astro` — extends Starlight's default Head with `meta name="theme-color"` (light + dark) and persona script preload
- `SiteFooter.astro` — composes `<DisclaimerBanner variant="footer" />` plus "View source" (GitHub) and "Subscribe via RSS" links

**Client script:**
- `persona.client.ts` — ≤1KB module: reads `?lens=`, falls back to `localStorage['aigov:persona']`, defaults to `all`. Mutates `<html data-persona>` and `[role="tab"] aria-selected`. Click + Arrow/Home/End keyboard nav. No `fetch`, no `document.cookie`, no eval, no third-party imports (verified via grep in the verify gate).

**Wiring:**
- `astro.config.mjs` registers Starlight overrides: `Head`, `Footer`, `Banner` (Sustainability slot). Header override deliberately NOT used — replacing the whole header would lose search + theme toggle; PersonaSwitch is rendered on the fixture page directly. Phase 2 introduces a `HeaderActions` companion slot for site-wide PersonaSwitch.
- `_phase1-fixture.mdx` updated to import + render all 7 content components + PersonaSwitch + per-regulation DisclaimerBanner.

## Verification

- `pnpm --filter @aigov/site build` → exit 0; 2 pages emitted, Pagefind index built, sitemap emitted
- `dist/index.html` contains the footer disclaimer copy "Consult qualified counsel before acting on any content."
- All 13 component files exist
- `persona.client.ts` contains no `fetch(`, no `document.cookie`, no `XMLHttpRequest` (verified)
- PersonaSwitch has `role="tablist"` and `data-persona-value` attributes
- DisclaimerBanner footer copy matches UI-SPEC line 316 placeholder verbatim
- SustainabilityNotice contains "Maintained at low cadence" string
- SkipLink emits "Skip to main content"

## Notable design decisions

1. **Header override avoided.** Starlight's `Header` slot replaces the entire header (search bar + theme toggle would be lost). Documented in `astro.config.mjs` comment and SUMMARY. PersonaSwitch ships in chrome via Phase 2's `HeaderActions` slot.
2. **SustainabilityNotice defensive default.** Component imports a local `const sustainabilityMode = false` with a `TODO` comment pointing to plan 01-06. The flag flips when `~/config/site.ts` lands.
3. **GlossaryTerm CSS-only popover.** UI-SPEC permits ≤1KB inline JS; pure CSS `:hover`/`:focus-within` is even leaner and avoids any JS for tooltips.
4. **MermaidJourney fallback.** Per Pitfall M-2 (mobile Mermaid render), every MermaidJourney emits a parallel `<details>` with a plain `<ol>` of the 12 stages and links. Fallback hides via CSS when Mermaid renders.
5. **Disclaimer compounding (Pitfall 2).** Footer disclaimer is always present + per-regulation sticky banner stacks above content + session-store dismiss key resets between different regulations.

## Manual sanity checks (dev mode)

Documented expectations for when the user runs `pnpm dev`:
- Open `http://localhost:4321/` → see footer disclaimer copy at page bottom.
- Print preview (`Cmd+P`) → chrome (sidebar, nav, theme toggle) hidden; persona sections expanded with `[exec] [engineer] [compliance]` brackets; footer disclaimer prints; inline links show URLs in parens.
- `Cmd+K` / `Ctrl+K` → Starlight Pagefind modal opens.
- Theme toggle (Starlight header) → cycles auto/light/dark; CSS variables bridge into Tailwind tokens correctly.
- `?lens=exec` query → only exec sections visible after page load (persona.client.ts mutates `data-persona`).

## Commits

- feat(01-05): 13 shell components + persona.client.ts + fixture demo (FND-05/06/11/14)

## Deviations from plan

1. **Header override skipped (intentional).** Plan listed `Header: './src/components/PersonaSwitch.astro'`. That replaces the whole Starlight nav. Removed and noted in `astro.config.mjs`; PersonaSwitch lives on the fixture page in Phase 1 and gets a proper `HeaderActions` slot in Phase 2.
2. **`Head.astro` extends Starlight's default.** Plan said "Used as a Starlight Head override"; the cleanest pattern is `import Default from '@astrojs/starlight/components/Head.astro'` and append our `<meta theme-color>` + script.
3. **Persona client imported via Astro `<script>` tag** in `PersonaSwitch.astro` and `Head.astro` — Astro bundles, hoists, and de-dupes.

## What this enables

- Plan 01-06 lands `site.ts` config + About page + density-threshold UI, all using the shell components already in place.
- Plan 01-07 deploys to GitHub Pages with the full chrome.
- Plan 01-08 runs Lighthouse + axe-core against the working site.

## Self-Check: PASSED
