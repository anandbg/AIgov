/**
 * Source adapter contract (TRK-02).
 *
 * Every per-source adapter under apps/pipeline/src/sources/<source>/ exports a
 * default object satisfying SourceAdapter. The shape is intentionally narrow:
 * the runner orchestrates fetching, diffing, classification, and PR creation.
 */
import { z } from "zod";
import type { SnapshotFrontmatter } from "@aigov/shared";

export type SourceFetchResult = {
  /** ISO date for the snapshot filename (`YYYY-MM-DD`). */
  snapshotDate: string;
  /** Cleaned markdown body. */
  body: string;
  /** Frontmatter to write into the .md file. */
  frontmatter: z.infer<typeof SnapshotFrontmatter>;
};

export type SourceAdapter = {
  /** Stable source identifier matching the regulations folder name. */
  source: string;
  /** Display name (used in commit messages). */
  name: string;
  /**
   * Fetch the current state of the source and produce a single snapshot result.
   * Adapters never decide whether the snapshot represents a meaningful change —
   * the runner calls `isMeaningful` separately.
   */
  fetch(): Promise<SourceFetchResult>;
  /**
   * Per-source sanity assertions (TRK-06). Throws if any assertion fails
   * (word-count bounds, must-contain phrases, content-fingerprint shape).
   * The runner catches and routes the failure into the diff-size circuit
   * breaker so the source is paused, not pushed-through-anyway.
   */
  sanityCheck(result: SourceFetchResult): void;
};

/**
 * Helper for adapters: standard word-count bounds.
 * Defaults are loose to avoid false positives during first integration —
 * tighten per-source after the first 30 days of historical scrapes
 * (TRK-05 calibration window).
 */
export function assertWordCountInBounds(body: string, opts: { min: number; max: number }): void {
  const words = body.split(/\s+/).filter(Boolean).length;
  if (words < opts.min) {
    throw new Error(`word count ${words} below min ${opts.min} — possible scrape failure`);
  }
  if (words > opts.max) {
    throw new Error(`word count ${words} above max ${opts.max} — possible scrape over-fetch`);
  }
}
