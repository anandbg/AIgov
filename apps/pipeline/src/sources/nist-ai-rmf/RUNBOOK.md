# NIST AI RMF — source runbook

## Auth

None required. NIST page is public, no API key, no IP allowlisting.

## Rate limits

NIST's public site does not publish rate limits but is sensitive to obvious abuse. The pipeline runs **weekly at most** for this source; bursts should not exceed ~1 request/minute even during backfill.

## Content structure

- Canonical URL: <https://www.nist.gov/itl/ai-risk-management-framework>
- The page renders as a standard `<main>` container with headings + paragraphs.
- Adapter extracts H1–H4 and `<p>` / `<li>` text via cheerio.
- No client-side hydration required — `fetch + cheerio` works (Playwright unnecessary).

## Fallback strategy

- If the canonical URL returns non-200, retry once after 30s.
- If retry fails, the runner records a heartbeat-failure JSON; no snapshot is written.
- For backfills, the NIST Publications page (separate URL) hosts PDF + HTML versions that can be ingested if the canonical page is offline for >24h.

## Known scrape failure modes

- **Whitespace-only diffs** — NIST occasionally reflows the page without content changes. The `meaningful.ts` filter catches these.
- **Embedded PDF references** — The Generative AI Profile is an attached PDF. Adapter does NOT currently fetch the PDF; tracked separately when the Profile lands as its own source.
- **CSS-class shuffle** — A site theme refresh can shift class names; adapter relies on tag selectors only.

## Calibration notes

First-30-days calibration: word count typically 800–2,500. The current sanity assertion `{ min: 300, max: 50_000 }` is loose — tighten after enough scrapes to compute σ.
