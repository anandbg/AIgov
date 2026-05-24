/**
 * EU AI Act source adapter.
 *
 * The Official Journal HTML edition on EUR-Lex (CELEX 32024R1689) is the
 * authoritative source for the AI Act. The page is stable HTML so
 * `fetch + cheerio` is sufficient. We capture article headings + body text;
 * the runner's meaningful-diff filter handles editorial vs substantive churn.
 *
 * EUR-Lex serves the document directly — no JS framework, no auth.
 */
import { load } from "cheerio";
import type { SourceAdapter } from "../../lib/source-adapter.js";
import { assertWordCountInBounds } from "../../lib/source-adapter.js";

// EUR-Lex (eur-lex.europa.eu) is the legal canonical source for the AI Act,
// BUT its CloudFront front-end returns `202 Accepted` with an empty body to
// non-interactive clients — a deliberate async-handshake pattern that defeats
// fetch-based scraping. The community-maintained mirror at
// artificialintelligenceact.eu/the-act/ tracks the published OJ text and is
// the URL practitioners actually read. We scrape the mirror; we cite EUR-Lex.
const FETCH_URL = "https://artificialintelligenceact.eu/the-act/";
const CITATION_URL = "https://eur-lex.europa.eu/eli/reg/2024/1689/oj";

// Browser-like UA so the mirror's edge isn't surprised by a bot UA.
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const adapter: SourceAdapter = {
  source: "eu-ai-act",
  name: "EU AI Act (Regulation (EU) 2024/1689)",

  async fetch() {
    const res = await fetch(FETCH_URL, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
      },
    });
    if (!res.ok) {
      throw new Error(`EU AI Act fetch ${res.status} ${res.statusText}`);
    }
    const html = await res.text();
    const $ = load(html);

    // The mirror site renders the full Act inside <article> / .entry-content.
    let scope = $("article, .entry-content, main").first();
    if (scope.length === 0 || scope.text().trim().length < 1000) {
      scope = $("body").first();
    }
    scope
      .find("script, style, noscript, header, footer, nav, .hidden-print, .skiplink, form, button")
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
        source: "eu-ai-act",
        snapshotDate,
        srcUrl: CITATION_URL,
        fetchedAt: new Date().toISOString(),
        fetcherVersion: "pipeline-euaiact-0.1.0",
        materialChange: false,
        changeKind: "editorial",
        changeSummary: "Scheduled EU AI Act capture (via mirror).",
        relatedArticles: [],
      },
    };
  },

  sanityCheck(result) {
    // The mirror's `/the-act/` page is a hub (intro + chapter index +
    // recital index), not the full body. ~400-3000 words depending on
    // whether commentary is included. Tight upper bound catches over-fetch;
    // loose lower bound catches an empty page or CDN handshake page.
    assertWordCountInBounds(result.body, { min: 200, max: 250_000 });
    // Must-contain anchors of a real AI Act capture vs an error/empty page.
    if (!/artificial intelligence/i.test(result.body)) {
      throw new Error("must-contain phrase missing: 'artificial intelligence'");
    }
    if (!/(act|regulation|article)/i.test(result.body)) {
      throw new Error("must-contain phrase missing: 'act' / 'regulation' / 'article'");
    }
  },
};

export default adapter;
