/**
 * OpenAI Usage Policies adapter.
 *
 * OpenAI publishes its current Usage Policies as a versioned HTML page.
 * The page is a stable, JS-light document — `fetch + cheerio` is sufficient.
 * We track this as a `kind: "guideline"` entry so it surfaces in /whats-new
 * alongside formal regulations without conflating the two.
 */
import { load } from "cheerio";
import type { SourceAdapter } from "../../lib/source-adapter.js";
import { assertWordCountInBounds } from "../../lib/source-adapter.js";

const CANONICAL_URL = "https://openai.com/policies/usage-policies/";

// OpenAI fronts openai.com with Cloudflare and gates non-browser UAs with a
// challenge page. A real Chrome UA + Accept-Language header passes through.
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const adapter: SourceAdapter = {
  source: "openai-usage-policy",
  name: "OpenAI Usage Policies",

  async fetch() {
    const res = await fetch(CANONICAL_URL, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Ch-Ua": '"Chromium";v="120", "Not(A:Brand";v="24"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"macOS"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
    });
    if (!res.ok) {
      throw new Error(`OpenAI usage-policy fetch ${res.status} ${res.statusText}`);
    }
    const html = await res.text();
    const $ = load(html);

    let scope = $("main, article, .policy-content").first();
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
        source: "openai-usage-policy",
        snapshotDate,
        srcUrl: CANONICAL_URL,
        fetchedAt: new Date().toISOString(),
        fetcherVersion: "pipeline-openai-0.1.0",
        materialChange: false,
        changeKind: "editorial",
        changeSummary: "Scheduled OpenAI Usage Policy capture.",
        relatedArticles: [],
      },
    };
  },

  sanityCheck(result) {
    assertWordCountInBounds(result.body, { min: 200, max: 20_000 });
    if (!/openai/i.test(result.body)) {
      throw new Error("must-contain phrase missing: 'OpenAI'");
    }
    if (!/(policy|usage|disallowed|prohibited)/i.test(result.body)) {
      throw new Error("must-contain phrase missing: 'policy' / 'usage' / 'disallowed' / 'prohibited'");
    }
  },
};

export default adapter;
