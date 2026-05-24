#!/usr/bin/env node
/**
 * Walk a built dist/ directory and enforce two budgets:
 *   - PER_IMAGE_KB (per-image weight)
 *   - PER_PAGE_KB  (per-page total — HTML + every CSS/JS/image it references)
 *
 * Both constants are tunable at the top of this file.
 * Exits 0 on success, 1 on first budget breach.
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const PER_IMAGE_KB = 100;
const PER_PAGE_KB = 500;
const ROOT = path.resolve(process.argv[2] || 'apps/site/dist');

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

function isImage(file) {
  return /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(file);
}

function refsFromHtml(html, htmlDir) {
  const refs = new Set();
  const re = /\b(?:href|src)="([^"#?]+)(?:[#?][^"]*)?"/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const v = m[1];
    if (!v || /^(https?:|data:|mailto:|tel:|javascript:|#)/i.test(v)) continue;
    let target;
    if (v.startsWith('/')) target = path.join(ROOT, v);
    else target = path.resolve(htmlDir, v);
    if (target.startsWith(ROOT)) refs.add(target);
  }
  return [...refs];
}

async function safeStatSize(p) {
  try {
    const s = await stat(p);
    return s.size;
  } catch {
    return null;
  }
}

async function main() {
  console.log(`Weight budget — dist root: ${ROOT}`);
  console.log(`Budgets: per-image ${PER_IMAGE_KB} KB · per-page ${PER_PAGE_KB} KB\n`);

  const files = [];
  for await (const f of walk(ROOT)) files.push(f);

  let imageFailures = 0;
  for (const f of files) {
    if (!isImage(f)) continue;
    const size = await safeStatSize(f);
    if (size === null) continue;
    const kb = size / 1024;
    const rel = path.relative(ROOT, f);
    if (kb > PER_IMAGE_KB) {
      console.log(`x image: ${rel} -> ${kb.toFixed(1)} KB (over ${PER_IMAGE_KB} KB)`);
      imageFailures++;
    } else {
      console.log(`ok image: ${rel} -> ${kb.toFixed(1)} KB`);
    }
  }

  let pageFailures = 0;
  const htmls = files.filter((f) => f.endsWith('.html'));
  for (const html of htmls) {
    const content = await readFile(html, 'utf-8');
    let total = (await safeStatSize(html)) ?? 0;
    const refs = refsFromHtml(content, path.dirname(html));
    for (const r of refs) {
      const size = await safeStatSize(r);
      if (size !== null) total += size;
    }
    const kb = total / 1024;
    const rel = path.relative(ROOT, html);
    if (kb > PER_PAGE_KB) {
      console.log(`x page: ${rel} -> ${kb.toFixed(1)} KB (over ${PER_PAGE_KB} KB)`);
      pageFailures++;
    } else {
      console.log(`ok page: ${rel} -> ${kb.toFixed(1)} KB`);
    }
  }

  console.log(`\nResult: ${imageFailures} image overage(s), ${pageFailures} page overage(s)`);
  if (imageFailures + pageFailures > 0) {
    console.error('Weight budget exceeded');
    process.exit(1);
  } else {
    console.log('All budgets within limits');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
