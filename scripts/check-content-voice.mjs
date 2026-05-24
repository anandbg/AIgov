#!/usr/bin/env node
/**
 * CNT-10: voice/style gate.
 *
 * Greps merged content for forbidden prescriptive-personal-address phrases
 * (Pitfall 2 — UPL framing).
 *
 * Exits 1 if any violation found.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const ROOTS = [
  'apps/site/src/content/docs',
  'apps/site/src/content/glossary',
  'apps/site/src/content/stories',
];

const FORBIDDEN = [
  /\byou should\b/i,
  /\byou must\b/i,
  /\byou are required to\b/i,
  /\bthis means you have to\b/i,
  /\byou need to\b/i,
];

async function* walk(dir) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    if (entry.name.startsWith('_')) continue; // skip drafts + fixtures
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
      yield full;
    }
  }
}

/**
 * Strip blocks exempt from the voice-check:
 * - PersonaSection bodies (scoped persona coaching is allowed second-person framing)
 * - RegQuote bodies (verbatim regulator language must not be paraphrased)
 * See docs/STYLE.md for the rationale.
 */
function stripExemptBlocks(text) {
  return text
    .replace(/<PersonaSection[\s\S]*?<\/PersonaSection>/g, '')
    .replace(/<RegQuote[\s\S]*?<\/RegQuote>/g, '');
}

async function main() {
  const violations = [];
  for (const root of ROOTS) {
    for await (const file of walk(root)) {
      const raw = await readFile(file, 'utf-8');
      const body = stripExemptBlocks(raw);
      const lines = body.split('\n');
      for (let i = 0; i < lines.length; i++) {
        for (const re of FORBIDDEN) {
          if (re.test(lines[i])) {
            violations.push({ file, line: i + 1, text: lines[i].trim(), match: re });
          }
        }
      }
    }
  }
  if (violations.length === 0) {
    console.log('voice-check: ok (0 violations across content)');
    return;
  }
  console.error(`voice-check: ${violations.length} violation(s)`);
  for (const v of violations.slice(0, 50)) {
    console.error(`  ${v.file}:${v.line}  pattern ${v.match}`);
    console.error(`    > ${v.text}`);
  }
  process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
