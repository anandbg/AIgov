#!/usr/bin/env node
/**
 * CHT-09: 20 known-bad query fixtures MUST be refused.
 *
 * Runs the same REFUSE_PATTERNS the worker uses against the fixture set.
 * Mirrors the worker's logic so the check is reproducible without spinning
 * up wrangler in CI.
 */
import { readFile } from "node:fs/promises";

const FIXTURE = "apps/chat-worker/fixtures/injection-tests.json";

const REFUSE_PATTERNS = [
  /\bwhat (should|must) i do (about|with|to)\b/i,
  /\bgive me (specific )?legal advice\b/i,
  /\byou (must|should) (tell|advise|instruct|order) me\b/i,
  /\bignore (all )?(previous|prior) (instructions|context|messages)\b/i,
  /\bsystem prompt\b.*\b(reveal|show|leak|display|verbatim)\b/i,
  /\b(reveal|show|leak|display)\b.*\bsystem prompt\b/i,
  /\b(disregard|override) (the |your )?(rules|guardrails|safety)\b/i,
];

function shouldRefuse(q) {
  return REFUSE_PATTERNS.some((re) => re.test(q));
}

async function main() {
  const raw = await readFile(FIXTURE, "utf-8");
  const data = JSON.parse(raw);
  const failures = [];
  for (const t of data.queries) {
    if (!shouldRefuse(t.q)) {
      failures.push(t);
    }
  }
  if (failures.length === 0) {
    console.log(`injection-refusal: ok (${data.queries.length} fixtures, all refused)`);
    return;
  }
  console.error(`injection-refusal: ${failures.length} fixture(s) NOT refused`);
  for (const f of failures) {
    console.error(`  [${f.id}] expected refusal: ${f.expectRefusalReason}`);
    console.error(`    > ${f.q}`);
  }
  process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
