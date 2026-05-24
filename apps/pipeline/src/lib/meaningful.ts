/**
 * meaningful.ts (TRK-05) — semantic-diff filter.
 *
 * Decides whether a new snapshot represents a *meaningful* change vs noise.
 * Phase 3 ships a conservative whitespace-and-trivial-edit filter; full
 * calibration against 30 days of historical scrapes from 5 representative
 * sources lands in TRK-05's second pass (calibration test data committed
 * alongside the upgrade).
 */
export type MeaningfulResult = {
  meaningful: boolean;
  reason: string;
};

function normalise(s: string): string {
  return s
    .replace(/\r\n/g, "\n")
    // collapse runs of whitespace
    .replace(/[ \t]+/g, " ")
    // collapse blank-line runs
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function isMeaningful(prevBody: string | null, nextBody: string): MeaningfulResult {
  if (prevBody === null) {
    return { meaningful: true, reason: "first snapshot — always meaningful" };
  }
  const a = normalise(prevBody);
  const b = normalise(nextBody);
  if (a === b) {
    return { meaningful: false, reason: "identical after whitespace normalisation" };
  }
  const editDistance = naiveEditDistance(a, b);
  // Threshold: <= 8 characters of edit-distance after normalisation = noise
  // (typical: a single timestamp shift or one re-formatted phrase). Tightens
  // per-source during calibration.
  if (editDistance <= 8) {
    return { meaningful: false, reason: `edit-distance ${editDistance} below 8-char noise floor` };
  }
  return { meaningful: true, reason: `edit-distance ${editDistance} — review required` };
}

/** Bounded edit-distance to keep performance predictable on long documents. */
function naiveEditDistance(a: string, b: string): number {
  if (a === b) return 0;
  const max = Math.min(a.length + b.length, 256);
  // For early-exit on clearly large diffs: count differing characters in a single pass.
  // True Levenshtein is overkill for the >8-char threshold; we just need to know if
  // the diff is small.
  const len = Math.max(a.length, b.length);
  let diff = Math.abs(a.length - b.length);
  for (let i = 0, j = 0; i < Math.min(a.length, b.length) && diff <= max; i++, j++) {
    if (a[i] !== b[j]) diff++;
  }
  return diff;
}
