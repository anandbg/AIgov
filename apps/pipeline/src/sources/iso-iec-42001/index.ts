/**
 * ISO/IEC 42001 — AI management systems standard.
 *
 * ISO standards' substantive text is copyrighted and behind a paywall;
 * we cannot redistribute clause text verbatim. This adapter captures
 * only the *public* metadata page on iso.org: title, edition, scope
 * paragraph, stage, status, and the list of related documents that
 * indicate amendments or corrigenda. That's all a tracker needs to
 * surface "ISO 42001 has changed" — readers click through to ISO for
 * the actual text.
 */
import { load } from "cheerio";
import type { SourceAdapter } from "../../lib/source-adapter.js";
import { assertWordCountInBounds } from "../../lib/source-adapter.js";

const CANONICAL_URL = "https://www.iso.org/standard/81230.html";

const adapter: SourceAdapter = {
  source: "iso-iec-42001",
  name: "ISO/IEC 42001 — AI management systems",

  async fetch() {
    const res = await fetch(CANONICAL_URL, {
      headers: {
        "User-Agent": "AIgov-pipeline/0.1 (https://github.com/anandbg/AIgov)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) {
      throw new Error(`ISO 42001 fetch ${res.status} ${res.statusText}`);
    }
    const html = await res.text();
    const $ = load(html);

    // ISO's standard page wraps the metadata in `<section class="ld-content">`
    // around #abstract, #lifecycle and #relations panels. Capture the visible
    // metadata blocks only — never the (paywalled) clause text.
    let scope = $("#content, main, .ld-content").first();
    if (scope.length === 0 || scope.text().trim().length < 200) {
      scope = $("body").first();
    }
    scope.find("script, style, noscript, header, footer, nav, aside, form, button").remove();

    const lines: string[] = [];
    // Pull the page title (standard number + name), abstract, stage table,
    // related documents. ISO uses h2/h3 for these sections.
    scope.find("h1, h2, h3, h4, p, li, dt, dd, td").each((_, el) => {
      const tag = el.tagName.toLowerCase();
      const text = $(el).text().trim().replace(/\s+/g, " ");
      if (!text) return;
      if (tag === "h1") lines.push(`# ${text}`);
      else if (tag === "h2") lines.push(`## ${text}`);
      else if (tag === "h3") lines.push(`### ${text}`);
      else if (tag === "h4") lines.push(`#### ${text}`);
      else if (tag === "li") lines.push(`- ${text}`);
      else if (tag === "dt") lines.push(`**${text}**`);
      else lines.push(text);
      lines.push("");
    });

    const body = lines.join("\n").trim() + "\n";
    const snapshotDate = new Date().toISOString().slice(0, 10);

    return {
      snapshotDate,
      body,
      frontmatter: {
        source: "iso-iec-42001",
        snapshotDate,
        srcUrl: CANONICAL_URL,
        fetchedAt: new Date().toISOString(),
        fetcherVersion: "pipeline-iso42001-0.1.0",
        materialChange: false,
        changeKind: "editorial",
        changeSummary: "Scheduled ISO/IEC 42001 metadata capture.",
        relatedArticles: [],
      },
    };
  },

  sanityCheck(result) {
    // ISO standard pages are short — tight bounds.
    assertWordCountInBounds(result.body, { min: 100, max: 10_000 });
    if (!/42001/.test(result.body)) {
      throw new Error("must-contain phrase missing: '42001'");
    }
    if (!/(artificial intelligence|management system)/i.test(result.body)) {
      throw new Error("must-contain phrase missing: 'artificial intelligence' or 'management system'");
    }
  },
};

export default adapter;
