# docs/STYLE.md — editorial style guide

The site's voice is **plain, calm, and factual**. The rules below are enforced by CI; PRs containing forbidden language are rejected automatically.

## Forbidden phrases (CI grep gate)

The following phrases must not appear in merged content under `apps/site/src/content/docs/**`, `apps/site/src/content/glossary/**`, `apps/site/src/content/stories/**`:

| Phrase | Why forbidden |
|---|---|
| `you should` | Pitfall 2 — UPL (unauthorised practice of law) framing |
| `you must` | Same |
| `you are required to` | Same |
| `this means you have to` | Same |
| `you need to` | Same — prescriptive personal address |

**Acceptable rewrites:**

- "you must register the system" → "providers must register the system"
- "you should map your data" → "the data lineage should be mapped"
- "you are required to perform a DPIA" → "a DPIA is required"

The legal substance is identical; the framing is descriptive, not prescriptive-to-the-reader.

## Acceptable second-person uses

- `<PersonaSection>` blocks may address a named persona (executive / engineer / compliance) directly — these are scoped, opt-in audiences and the framing is operational coaching within a defined role, not legal advice to an unidentified reader.
- README, MAINTENANCE, CONTRIBUTING, SECURITY, and SETUP files may use second person — these are project-internal docs for contributors, not public content.

The CI grep gate excludes `apps/site/src/content/docs/_*` (drafts/fixtures) and PersonaSection content scoped by attribute.

## Other rules

- **Sentence case** for buttons, headings, and tags. No Title Case For Marketing.
- **No emojis** in chrome copy. Inline narrative emoji is acceptable in PersonaSection coaching but used sparingly.
- **Quoted regulation text** must use the `<RegQuote>` component (Pitfall 6 — the only citation primitive). Free-text quoted regulation language is rejected.
- **Glossary tooltips** wrap the first occurrence of a defined term on a page (Phase 2 build-time wrapper).
- **Each stage page** must contain exactly three `<PersonaSection>` blocks — one per persona (`exec` / `engineer` / `compliance`). The persona-lens completeness CI gate enforces this.

## Enforcement

- `scripts/check-content-voice.mjs` runs in `.github/workflows/ci-content-voice.yml` and `.github/workflows/ci-persona-lens.yml` on every PR touching `apps/site/src/content/**`.
- Reproduce locally: `pnpm voice-check && pnpm persona-lens-check`.
