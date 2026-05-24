/**
 * Lighthouse-CI config — Phase 1 baseline budgets per
 * .planning/phases/01-foundation-chrome/01-CONTEXT.md "Claude's Discretion".
 *
 * Tune downward after Phase 2 content lands. Pages tested in Phase 1: landing + /about/.
 * (The fixture stage page is underscore-prefixed and excluded from routes — covered by axe instead.)
 */
module.exports = {
  ci: {
    collect: {
      staticDistDir: './apps/site/dist',
      url: [
        'http://localhost/index.html',
        'http://localhost/about/index.html',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        // Core Web Vitals — hard errors
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],

        // INP needs real interaction; warn-only in Phase 1, error in Phase 2
        'interaction-to-next-paint': ['warn', { maxNumericValue: 200 }],

        // Supporting metrics — warn
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
        'speed-index': ['warn', { maxNumericValue: 3400 }],

        // Best-practice hard errors
        // Note: 'no-vulnerable-libraries' was removed in Lighthouse 11+;
        // Dependabot (.github/dependabot.yml) covers CVE tracking instead.
        // 'interaction-to-next-paint' has no value without real interaction —
        // warn-only here and gated to error in Phase 2 when content lands.
        'errors-in-console': 'error',
        'no-document-write': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',

        // Soft warnings
        'meta-description': 'warn',

        // Disabled (static-dist served via http://localhost — TLS gates not applicable)
        'uses-https': 'off',
        'is-on-https': 'off',
        'redirects-http': 'off',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
