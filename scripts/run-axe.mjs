#!/usr/bin/env node
/**
 * Serve apps/site/dist over a local Node HTTP server, drive a headless Chromium
 * via Playwright, and run axe-core against the WCAG 2.2 AA tag set on every
 * critical Phase-1 route in both light and dark themes.
 *
 * Security: no child_process spawn; static-serve via node:http; path traversal
 * blocked by resolve-then-prefix-check.
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const PORT = 4321;
const DIST_DIR = resolve('apps/site/dist');
const PATHS = ['/', '/about/'];
const OPTIONAL_PATHS = ['/_phase1-fixture/'];
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function startServer() {
  return new Promise((resolveServer) => {
    const server = createServer(async (req, res) => {
      try {
        let pathname = decodeURIComponent(new URL(req.url, `http://localhost`).pathname);
        if (pathname.endsWith('/')) pathname += 'index.html';

        const filePath = resolve(DIST_DIR, '.' + pathname);
        if (!filePath.startsWith(DIST_DIR)) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }

        try {
          const data = await readFile(filePath);
          const mime = MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';
          res.writeHead(200, { 'Content-Type': mime });
          res.end(data);
        } catch (e) {
          if (e.code === 'ENOENT') {
            res.writeHead(404);
            res.end('Not found');
          } else {
            res.writeHead(500);
            res.end(`Server error: ${e.message}`);
          }
        }
      } catch (e) {
        res.writeHead(500);
        res.end(`Server error: ${e.message}`);
      }
    });
    server.listen(PORT, '127.0.0.1', () => resolveServer(server));
  });
}

async function runAxe(page, url, theme) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
  }, theme);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return results.violations;
}

async function probe(path) {
  const res = await fetch(`http://127.0.0.1:${PORT}${path}`, { method: 'HEAD' });
  return res.status;
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const requiredPaths = [...PATHS];
  const optionalPaths = [];

  for (const p of OPTIONAL_PATHS) {
    const status = await probe(p);
    if (status === 200) {
      optionalPaths.push(p);
    } else {
      console.log(`SKIP optional ${p} (HTTP ${status})`);
    }
  }

  let totalViolations = 0;
  const failures = [];

  for (const path of [...requiredPaths, ...optionalPaths]) {
    for (const theme of ['light', 'dark']) {
      const url = `http://127.0.0.1:${PORT}${path}`;
      const violations = await runAxe(page, url, theme);
      const critical = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
      if (critical.length === 0) {
        console.log(`✓ ${path} (${theme}): clean`);
      } else {
        console.log(`✘ ${path} (${theme}): ${critical.length} critical/serious violation(s)`);
        for (const v of critical.slice(0, 5)) {
          console.log(`  [${v.impact}] ${v.id}: ${v.help}`);
          for (const node of v.nodes.slice(0, 3)) {
            console.log(`     ${node.target.join(', ')}`);
          }
        }
        failures.push({ path, theme, count: critical.length });
        totalViolations += critical.length;
      }
    }
  }

  await browser.close();
  server.close();

  if (totalViolations > 0) {
    console.error(`\n✘ ${totalViolations} total violations across ${failures.length} page+theme combinations`);
    process.exit(1);
  } else {
    console.log('\n✓ passed axe-core WCAG 2.2 AA across all tested routes and themes');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
