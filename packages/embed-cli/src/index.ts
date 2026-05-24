#!/usr/bin/env tsx
/**
 * @aigov/embed-cli — chunk site content + emit embedding payloads for upload to Vectorize.
 *
 * CHT-02 workflow:
 *   1. Walk apps/site/src/content/{docs,glossary,stories,regulations}
 *   2. Strip frontmatter, split body by H2/H3 (~500-token chunks)
 *   3. Emit chunks.jsonl with rich metadata: source_type, source_path, title, heading, url, snapshot_date, chunk_id
 *   4. (Phase 5 final): pipe chunks.jsonl into a Workers AI BGE-base call then upsert to Vectorize
 *
 * Phase 5 ships steps 1-3 (offline chunker). Step 4 wires when Cloudflare bindings land.
 *
 * Usage:
 *   pnpm --filter @aigov/embed-cli embed -- --out .planning/data/chunks.jsonl
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_ROOTS = [
  { type: "docs", root: "apps/site/src/content/docs", urlPrefix: "/" },
  { type: "glossary", root: "apps/site/src/content/glossary", urlPrefix: "/glossary/" },
  { type: "stories", root: "apps/site/src/content/stories", urlPrefix: "/stories/" },
  { type: "regulations", root: "apps/site/src/content/regulations", urlPrefix: "/regulations/" },
] as const;

type Chunk = {
  chunk_id: string;
  source_type: string;
  source_path: string;
  title: string;
  heading: string;
  url: string;
  snapshot_date?: string;
  text: string;
};

async function* walk(dir: string): AsyncGenerator<string> {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.name.startsWith("_")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile() && /\.(md|mdx)$/.test(e.name)) yield full;
  }
}

function splitByHeading(body: string): { heading: string; text: string }[] {
  const lines = body.split("\n");
  const out: { heading: string; text: string }[] = [];
  let current: { heading: string; text: string } = { heading: "(intro)", text: "" };
  for (const line of lines) {
    const m = /^(#{2,3})\s+(.*)$/.exec(line);
    if (m) {
      if (current.text.trim()) out.push(current);
      current = { heading: m[2]!, text: "" };
    } else {
      current.text += line + "\n";
    }
  }
  if (current.text.trim()) out.push(current);
  return out;
}

function urlForFile(srcType: string, urlPrefix: string, root: string, file: string): string {
  const rel = path.relative(root, file).replace(/\.(md|mdx)$/, "/");
  if (srcType === "docs") return "/" + rel.replace(/\/index\/$/, "/");
  return urlPrefix + rel.replace(/\/index\/$/, "");
}

async function main() {
  const outIdx = process.argv.indexOf("--out");
  const outPath = outIdx > 0 ? process.argv[outIdx + 1]! : ".planning/data/chunks.jsonl";
  await mkdir(path.dirname(outPath), { recursive: true });

  const chunks: Chunk[] = [];
  for (const { type, root, urlPrefix } of CONTENT_ROOTS) {
    for await (const file of walk(root)) {
      const raw = await readFile(file, "utf-8");
      const { data, content } = matter(raw);
      const title = (data.title as string) ?? (data.term as string) ?? (data.name as string) ?? path.basename(file, path.extname(file));
      const snapshot_date = (data.snapshotDate as string | undefined) ?? undefined;
      const url = urlForFile(type, urlPrefix, root, file);
      const sections = splitByHeading(content);
      for (let i = 0; i < sections.length; i++) {
        const s = sections[i]!;
        const text = s.text.trim();
        if (text.length < 80) continue;
        chunks.push({
          chunk_id: `${type}:${path.relative(root, file)}#${i}`,
          source_type: type,
          source_path: path.relative(process.cwd(), file),
          title,
          heading: s.heading,
          url,
          snapshot_date,
          text,
        });
      }
    }
  }

  const lines = chunks.map((c) => JSON.stringify(c)).join("\n") + "\n";
  await writeFile(outPath, lines, "utf-8");
  console.log(`wrote ${chunks.length} chunks -> ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
