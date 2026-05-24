#!/usr/bin/env node
/**
 * CNT-11: persona-lens completeness gate.
 *
 * Every stage page must contain one PersonaSection for each required lens.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const STAGES_DIR = 'apps/site/src/content/docs/stages';
const REQUIRED = ['exec', 'engineer', 'compliance'];

async function main() {
  const files = (await readdir(STAGES_DIR))
    .filter((f) => f.endsWith('.mdx') && !f.startsWith('_'));

  const failures = [];
  for (const f of files) {
    const text = await readFile(path.join(STAGES_DIR, f), 'utf-8');
    const found = new Set();
    const re = /<PersonaSection\s+persona="(exec|engineer|compliance)"/g;
    let m;
    while ((m = re.exec(text)) !== null) found.add(m[1]);

    const missing = REQUIRED.filter((p) => !found.has(p));
    if (missing.length > 0) {
      failures.push({ file: f, missing });
    }
  }

  if (failures.length === 0) {
    console.log(`persona-lens-check: ok (${files.length} stage(s) checked, all three lenses present)`);
    return;
  }

  console.error(`persona-lens-check: ${failures.length} stage(s) missing personas`);
  for (const f of failures) {
    console.error(`  ${f.file}  missing: ${f.missing.join(', ')}`);
  }
  process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
