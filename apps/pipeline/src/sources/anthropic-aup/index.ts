/**
 * Anthropic Acceptable Use Policy (AUP) adapter.
 *
 * Anthropic's AUP is the source-of-truth for what Claude can and can't
 * be used for. The page is stable HTML; vendor terms change with little
 * notice (twice in 2025), so this source moves to a daily cron in
 * scrape-vendors.yml — the diff filter still catches noise.
 */
import { load } from "cheerio";
import type { SourceAdapter } from "../../lib/source-adapter.js";
import { assertWordCountInBounds } from "../../lib/source-adapter.js";

const CANONICAL_URL = "https://www.anthropic.com/legal/aup";

const adapter: SourceAdapter = {
  source: "anthropic-aup",
  name: "Anthropic Acceptable Use Policy",

  async fetch() {
    const res = await fetch(CANONICAL_URL, {
      headers: {
        "User-Agent": "AIgov-pipeline/0.1 (https://github.com/anandbg/AIgov)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) {
      throw new Error(`Anthropic AUP fetch ${res.status} ${res.statusText}`);
    }
    const html = await res.text();
    const $ = load(html);

    let scope = $("main, article, .prose").first();
    if (scope.length === 0 || scope.text().trim().length < 200) {
      scope = $("body").first();
    }
    scope.find("script, style, noscript, header, footer, nav, aside, form, button").remove();

    const lines: string[] = [];
    scope.find("h1, h2, h3, h4, p, li").each((_, el) => {
      const tag = el.tagName.toLowerCase();
      const text = $(el).text().trim().replace(/\s+/g, " ");
      if (!text) return;
      if (tag === "h1") lines.push(`# ${text}`);
      else if (tag === "h2") lines.push(`## ${text}`);
      else if (tag === "h3") lines.push(`### ${text}`);
      else if (tag === "h4") lines.push(`#### ${text}`);
      else if (tag === "li") lines.push(`- ${text}`);
      else lines.push(text);
      lines.push("");
    });

    const body = lines.join("\n").trim() + "\n";
    const snapshotDate = new Date().toISOString().slice(0, 10);

    return {
      snapshotDate,
      body,
      frontmatter: {
        source: "anthropic-aup",
        snapshotDate,
        srcUrl: CANONICAL_URL,
        fetchedAt: new Date().toISOString(),
        fetcherVersion: "pipeline-anthropic-0.1.0",
        materialChange: false,
        changeKind: "editorial",
        changeSummary: "Scheduled Anthropic AUP capture.",
        relatedArticles: [],
      },
    };
  },

  sanityCheck(result) {
    assertWordCountInBounds(result.body, { min: 200, max: 20_000 });
    if (!/anthropic/i.test(result.body)) {
      throw new Error("must-contain phrase missing: 'Anthropic'");
    }
    if (!/(acceptable use|policy|prohibited)/i.test(result.body)) {
      throw new Error("must-contain phrase missing: 'acceptable use' / 'policy' / 'prohibited'");
    }
  },
};

export default adapter;
