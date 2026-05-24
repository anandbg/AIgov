/**
 * UK ICO (Information Commissioner's Office) — AI and data protection guidance.
 *
 * The ICO publishes its AI guidance as a hub page linking to detailed
 * sub-pages. For Phase 3 we capture the hub page (a stable URL that
 * summarises the ICO's current position and links out). Future passes can
 * follow the in-page links for deeper sub-page snapshots.
 */
import { load } from "cheerio";
import type { SourceAdapter } from "../../lib/source-adapter.js";
import { assertWordCountInBounds } from "../../lib/source-adapter.js";

const CANONICAL_URL =
  "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/";

const adapter: SourceAdapter = {
  source: "uk-ico",
  name: "UK Information Commissioner's Office — AI guidance",

  async fetch() {
    const res = await fetch(CANONICAL_URL, {
      headers: {
        "User-Agent": "AIgov-pipeline/0.1 (https://github.com/anandbg/AIgov)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) {
      throw new Error(`UK ICO fetch ${res.status} ${res.statusText}`);
    }
    const html = await res.text();
    const $ = load(html);

    let scope = $("main, #main-content, article").first();
    if (scope.length === 0 || scope.text().trim().length < 300) {
      scope = $("body").first();
    }
    scope
      .find("script, style, noscript, header, footer, nav, aside, .skip-link, form, button, .cookie-banner")
      .remove();

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
        source: "uk-ico",
        snapshotDate,
        srcUrl: CANONICAL_URL,
        fetchedAt: new Date().toISOString(),
        fetcherVersion: "pipeline-ukico-0.1.0",
        materialChange: false,
        changeKind: "editorial",
        changeSummary: "Scheduled UK ICO AI-guidance capture.",
        relatedArticles: [],
      },
    };
  },

  sanityCheck(result) {
    assertWordCountInBounds(result.body, { min: 200, max: 30_000 });
    if (!/(artificial intelligence|\bAI\b)/i.test(result.body)) {
      throw new Error("must-contain phrase missing: 'AI' or 'artificial intelligence'");
    }
    if (!/(ico|information commissioner|data protection)/i.test(result.body)) {
      throw new Error("must-contain phrase missing: 'ICO' or 'Information Commissioner' or 'data protection'");
    }
  },
};

export default adapter;
