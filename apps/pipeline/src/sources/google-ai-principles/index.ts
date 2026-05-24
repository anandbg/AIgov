/**
 * Google AI Principles adapter.
 *
 * Google publishes its AI Principles as a stable HTML page. These are
 * Google's public commitments on AI development and the use-cases it will
 * not pursue. Lower-volatility than vendor AUPs but still useful weekly
 * tracking.
 */
import { load } from "cheerio";
import type { SourceAdapter } from "../../lib/source-adapter.js";
import { assertWordCountInBounds } from "../../lib/source-adapter.js";

const CANONICAL_URL = "https://ai.google/responsibility/principles/";

const adapter: SourceAdapter = {
  source: "google-ai-principles",
  name: "Google AI Principles",

  async fetch() {
    const res = await fetch(CANONICAL_URL, {
      headers: {
        "User-Agent": "AIgov-pipeline/0.1 (https://github.com/anandbg/AIgov)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) {
      throw new Error(`Google AI Principles fetch ${res.status} ${res.statusText}`);
    }
    const html = await res.text();
    const $ = load(html);

    let scope = $("main, article, #content").first();
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
        source: "google-ai-principles",
        snapshotDate,
        srcUrl: CANONICAL_URL,
        fetchedAt: new Date().toISOString(),
        fetcherVersion: "pipeline-google-0.1.0",
        materialChange: false,
        changeKind: "editorial",
        changeSummary: "Scheduled Google AI Principles capture.",
        relatedArticles: [],
      },
    };
  },

  sanityCheck(result) {
    assertWordCountInBounds(result.body, { min: 150, max: 15_000 });
    if (!/google/i.test(result.body)) {
      throw new Error("must-contain phrase missing: 'Google'");
    }
    if (!/(principle|ai|artificial intelligence|responsibility)/i.test(result.body)) {
      throw new Error("must-contain phrase missing: 'principle' / 'AI' / 'responsibility'");
    }
  },
};

export default adapter;
