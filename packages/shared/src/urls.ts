/**
 * Canonical URL builders for the AI Governance site.
 *
 * Pure, deterministic, no side effects. Empty input is permitted but yields
 * malformed URLs — validate at the call site.
 */

/** Stage page: /stages/{slug}/ */
export const stageUrl = (slug: string): string => `/stages/${slug}/`;

/** Regulation index page: /regulations/{source}/ */
export const regulationUrl = (source: string): string => `/regulations/${source}/`;

/** Dated regulation snapshot: /regulations/{source}/{YYYY-MM-DD}/ */
export const snapshotUrl = (source: string, date: string): string =>
  `/regulations/${source}/${date}/`;

/** Vendor policy index page: /vendor/{vendor}/ */
export const vendorUrl = (vendor: string): string => `/vendor/${vendor}/`;

/** Glossary term page: /glossary/{slug}/ */
export const glossaryUrl = (slug: string): string => `/glossary/${slug}/`;

/** Fictional company story page: /stories/{slug}/ */
export const storyUrl = (slug: string): string => `/stories/${slug}/`;

/**
 * Kebab-case an article identifier and return a hash anchor.
 * Examples:
 *   articleAnchor("Art-11")     → "#art-11"
 *   articleAnchor("Annex IV")   → "#annex-iv"
 *   articleAnchor("Article 11") → "#article-11"
 */
export const articleAnchor = (article: string): string => {
  const kebab = article
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `#${kebab}`;
};
