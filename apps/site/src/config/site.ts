/**
 * Central site configuration. Build-time constants only — no runtime API keys.
 *
 * Decisions encoded here (locked in .planning/phases/01-foundation-chrome/01-CONTEXT.md):
 * - Custom domain `ai-governance.tld` from Phase 1; SITE_DOMAIN is the placeholder constant.
 * - Sustainability mode dual-trigger: manual flag here OR open-PR backlog > threshold.
 * - Density threshold = 12 stages + ≥60 glossary terms + ≥30 regulation snapshots.
 * - Keepalive cadence: weekly Mon 06:00 UTC.
 */

export const SITE_DOMAIN = 'ai-governance.example' as const; // PLACEHOLDER — replace via SETUP.md "Domain Switch Procedure".

export const SITE_TITLE = 'AI Governance' as const;
export const SITE_DESCRIPTION = 'Plain-language AI governance, current weekly.' as const;
export const REPO_URL = 'https://github.com/PLACEHOLDER_ORG/AIgov' as const;
export const MAINTAINER_NAME = 'Anand' as const;
export const MAINTAINER_GITHUB_HANDLE = 'PLACEHOLDER_HANDLE' as const;

/**
 * Sustainability mode (FND-07).
 * When true: SustainabilityNotice renders site-wide; pipeline crons drop to bi-weekly (Phase 3 wiring).
 * Dual-trigger per CONTEXT.md: this manual flag OR auto-flip when open-PR backlog > SUSTAINABILITY_PR_THRESHOLD.
 * Phase 1 ship-state: false.
 */
export const sustainabilityMode = false as const;
export const sustainabilityLastReviewedAt = '2026-05-24' as const;

/**
 * Open-PR backlog threshold (CONTEXT.md operational cadence decision).
 * Phase 3 (TRK-10) load-alarm workflow flips sustainabilityMode when exceeded.
 */
export const SUSTAINABILITY_PR_THRESHOLD = 8 as const;

/**
 * Content-density threshold (FND-12, Pitfall 11).
 * Public launch (Phase 6) is gated on these minimums being met.
 */
export const DENSITY_THRESHOLD = {
  stages: 12,
  glossaryTerms: 60,
  regulationSnapshots: 30,
} as const;

/**
 * Heartbeat configuration (FND-09).
 * Each scheduled job writes .heartbeat/last-run-<source>.json.
 */
export const HEARTBEAT = {
  directory: '.heartbeat',
  staleAfterMultiplier: 2,
} as const;

/**
 * Keepalive (FND-08).
 */
export const KEEPALIVE_CRON = '0 6 * * 1' as const; // Mon 06:00 UTC

export type SiteConfig = {
  readonly SITE_DOMAIN: typeof SITE_DOMAIN;
  readonly SITE_TITLE: typeof SITE_TITLE;
  readonly sustainabilityMode: typeof sustainabilityMode;
  readonly DENSITY_THRESHOLD: typeof DENSITY_THRESHOLD;
  readonly HEARTBEAT: typeof HEARTBEAT;
};
