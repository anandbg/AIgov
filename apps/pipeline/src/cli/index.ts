#!/usr/bin/env tsx
/**
 * Pipeline CLI. Phase 3 entry point.
 *
 *   aigov-pipeline run <source>     — fetch + sanity + diff + write snapshot if meaningful
 *   aigov-pipeline list              — list registered sources
 *
 * Phase 3.0 ships the runner + one source adapter (nist-ai-rmf). Each
 * additional source per TRK-03 plugs in by exporting a SourceAdapter
 * from apps/pipeline/src/sources/<source>/index.ts and registering below.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stringify as yamlStringify } from "yaml";
import type { SourceAdapter } from "../lib/source-adapter.js";
import { isMeaningful } from "../lib/meaningful.js";

import nist from "../sources/nist-ai-rmf/index.js";
import euAiAct from "../sources/eu-ai-act/index.js";
import ukIco from "../sources/uk-ico/index.js";
import isoIec42001 from "../sources/iso-iec-42001/index.js";
import openaiPolicy from "../sources/openai-usage-policy/index.js";
import anthropicAup from "../sources/anthropic-aup/index.js";
import googlePrinciples from "../sources/google-ai-principles/index.js";

// Resolve the repo root from this file's location so the CLI works regardless of cwd.
// apps/pipeline/src/cli/index.ts → ../../../../ is the repo root.
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

const SOURCES: Record<string, SourceAdapter> = {
  // === regulations & frameworks (weekly cadence) ===
  "nist-ai-rmf": nist,
  "eu-ai-act": euAiAct,
  "uk-ico": ukIco,
  "iso-iec-42001": isoIec42001,
  // === vendor policies (daily cadence — terms change without notice) ===
  "openai-usage-policy": openaiPolicy,
  "anthropic-aup": anthropicAup,
  "google-ai-principles": googlePrinciples,
};

/** Source groups for the workflow runners. */
export const SOURCE_GROUPS = {
  global: ["nist-ai-rmf", "eu-ai-act", "uk-ico", "iso-iec-42001"],
  vendors: ["openai-usage-policy", "anthropic-aup", "google-ai-principles"],
};

const SITE_REGULATIONS_DIR = path.join(REPO_ROOT, "apps/site/src/content/regulations");

async function run(sourceId: string) {
  const adapter = SOURCES[sourceId];
  if (!adapter) {
    console.error(`unknown source "${sourceId}". Available: ${Object.keys(SOURCES).join(", ")}`);
    process.exit(1);
  }

  console.log(`[${sourceId}] fetching ${adapter.name}...`);
  const result = await adapter.fetch();

  console.log(`[${sourceId}] sanity-checking (${result.body.length} chars)...`);
  adapter.sanityCheck(result);

  const dir = path.join(SITE_REGULATIONS_DIR, sourceId, "snapshots");
  await mkdir(dir, { recursive: true });
  const filename = `${result.snapshotDate}.md`;
  const filepath = path.join(dir, filename);

  // Read previous snapshot for meaningful-diff check.
  let prev: string | null = null;
  try {
    const existing = await readFile(filepath, "utf-8");
    prev = existing.split(/^---\n[\s\S]*?\n---\n/)[1] ?? existing;
  } catch {
    /* no previous snapshot for this date — fine */
  }

  const m = isMeaningful(prev, result.body);
  console.log(`[${sourceId}] meaningful: ${m.meaningful} (${m.reason})`);

  if (!m.meaningful) {
    console.log(`[${sourceId}] no write — diff below noise floor`);
    return;
  }

  // Force materialChange based on meaningful result + downgrade classification:
  result.frontmatter.materialChange = true;

  // defaultStringType: "QUOTE_DOUBLE" forces date-looking strings to be quoted
  // so YAML on the read side doesn't reparse them into Date objects.
  const fm = "---\n" + yamlStringify(result.frontmatter, { defaultStringType: "QUOTE_DOUBLE", defaultKeyType: "PLAIN" }) + "---\n\n";
  await writeFile(filepath, fm + result.body, "utf-8");
  console.log(`[${sourceId}] wrote ${path.relative(process.cwd(), filepath)}`);
}

async function list() {
  for (const id of Object.keys(SOURCES)) {
    console.log(`${id}\t${SOURCES[id]!.name}`);
  }
}

/**
 * Run every source in a named group and return a non-zero exit code only if
 * *all* sources fail. Per-source errors are logged but do not block the rest
 * of the group — the goal is to keep the weekly job moving even when one
 * regulator changes its URL.
 */
async function runGroup(groupName: keyof typeof SOURCE_GROUPS) {
  const group = SOURCE_GROUPS[groupName];
  if (!group) {
    console.error(`unknown group "${groupName}". Available: ${Object.keys(SOURCE_GROUPS).join(", ")}`);
    process.exit(1);
  }
  let failures = 0;
  for (const sourceId of group) {
    try {
      await run(sourceId);
    } catch (err) {
      failures++;
      console.error(`[${sourceId}] FAILED: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  console.log(`group "${groupName}" — ${group.length - failures}/${group.length} sources captured`);
  if (failures === group.length) process.exit(1);
}

const [, , cmd, arg] = process.argv;
if (cmd === "run" && arg) await run(arg);
else if (cmd === "run-group" && arg) await runGroup(arg as keyof typeof SOURCE_GROUPS);
else if (cmd === "list") await list();
else {
  console.error("usage: aigov-pipeline <run <source>|run-group <global|vendors>|list>");
  process.exit(1);
}
