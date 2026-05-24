/**
 * NIST AI Risk Management Framework source adapter.
 *
 * The NIST AI RMF page is a stable, JS-light HTML document — `fetch + cheerio`
 * is sufficient. Returns the main framework body as cleaned markdown.
 */
import { load } from "cheerio";
import type { SourceAdapter } from "../../lib/source-adapter.js";
import { assertWordCountInBounds } from "../../lib/source-adapter.js";

const CANONICAL_URL = "https://www.nist.gov/itl/ai-risk-management-framework";

const adapter: SourceAdapter = {
  source: "nist-ai-rmf",
  name: "NIST AI Risk Management Framework",

  async fetch() {
    const res = await fetch(CANONICAL_URL, {
      headers: {
        "User-Agent": "AIgov-pipeline/0.1 (https://github.com/PLACEHOLDER_ORG/AIgov)",
      },
    });
    if (!res.ok) {
      throw new Error(`NIST AI RMF fetch ${res.status} ${res.statusText}`);
    }
    const html = await res.text();
    const $ = load(html);

    // Prefer <main>; fall back to <body> on pages that do not use the landmark.
    let scope = $("main").first();
    if (scope.length === 0 || scope.text().trim().length < 200) {
      scope = $("body").first();
    }
    scope.find("script, style, noscript, header, footer, nav, aside, .skip-link, form, button").remove();

    // Convert headings + paragraphs into plain markdown.
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
        source: "nist-ai-rmf",
        snapshotDate,
        srcUrl: CANONICAL_URL,
        fetchedAt: new Date().toISOString(),
        fetcherVersion: "pipeline-nist-0.1.0",
        materialChange: false, // computed by runner
        changeKind: "editorial",
        changeSummary: "Scheduled NIST AI RMF capture.",
        relatedArticles: [],
      },
    };
  },

  sanityCheck(result) {
    assertWordCountInBounds(result.body, { min: 300, max: 50_000 });
    if (!/risk management framework/i.test(result.body)) {
      throw new Error("must-contain phrase missing: 'Risk Management Framework'");
    }
  },
};

export default adapter;
