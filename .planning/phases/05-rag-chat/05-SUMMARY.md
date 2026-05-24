---
phase: 05-rag-chat
status: complete (architecture + scaffold; live deploy gated on user actions)
completed: 2026-05-24
requirements: [CHT-01, CHT-02, CHT-03, CHT-04, CHT-05, CHT-06, CHT-07, CHT-08, CHT-09, CHT-10, CHT-11, CHT-12, CHT-13, SRC-03]
---

# Phase 5 Summary — RAG Chat (architecture + scaffold)

## What was built

- **`apps/chat-worker/`** — Hono application targeting Cloudflare Workers. Routes: `GET /healthz`, `POST /chat`, `POST /feedback`. CORS locked to `https://${SITE_DOMAIN}`. `X-Frame-Options: DENY` set. Refusal patterns matched before retrieval (CHT-08 / Pitfall 6). Returns deterministic stub when Anthropic/Vectorize bindings are absent so the UI works end-to-end during local dev.
- **`packages/embed-cli/`** — Walks `apps/site/src/content/{docs,glossary,stories,regulations}/`, splits markdown body by H2/H3, emits `.planning/data/chunks.jsonl` with `chunk_id`, `source_type`, `source_path`, `title`, `heading`, `url`, `snapshot_date`, `text` per the CHT-02 metadata contract. **Live: 105 chunks emitted** from current Phase-2/3 content.
- **`apps/chat-worker/wrangler.toml`** — declares all bindings the worker needs (Vectorize, Workers AI, KV, vars + secrets list) with sections commented out for the user to enable after creating the Cloudflare account.
- **`apps/chat-worker/fixtures/injection-tests.json`** — 20 known-bad queries with `expectRefusalReason` per CHT-09 (legal-advice asks, "you should/must" prescriptive directives, prompt-injection patterns, system-prompt leak attempts, guardrail-override patterns).
- **`apps/site/src/components/ChatWidget.astro`** — sticky bottom-right pill widget that POSTs to `/chat`. Hidden during print. Reads worker URL from `window.AIGOV_CHAT_URL` (settable per environment); defaults to `/chat`. Rate-limit 429s + transport errors degrade gracefully with system messages.

## Requirements coverage

| Req | Status | Notes |
|---|---|---|
| CHT-01 (Hono on Workers) | ✓ | apps/chat-worker/src/index.ts with /chat /feedback /healthz |
| CHT-02 (embed-cli pipeline) | ✓ | 105 chunks emitted; Vectorize upsert is the trailing step (needs binding) |
| CHT-03 (read/write token split) | ✓ | worker has `VECTORIZE` binding (read-only at deploy); embed-cli token write-only — documented in wrangler.toml + SETUP.md |
| CHT-04 (Vectorize + Workers AI + Citations API) | architecture in place | embedding + retrieval + Anthropic call wired to bindings; gated on secret |
| CHT-05 (dated snapshot URLs) | architecture in place | embed-cli emits `snapshot_date` per chunk; worker passes through |
| CHT-06 (CORS + X-Frame DENY + Turnstile) | ✓ for CORS + X-Frame; Turnstile env vars declared, validation TODO when key set |
| CHT-07 (rate limit per-IP) | env var declared (`MAX_REQUESTS_PER_HOUR_PER_IP=20`); KV-backed bucket lands when KV namespace ID set |
| CHT-08 (refusal patterns) | ✓ | REFUSE_PATTERNS array in worker |
| CHT-09 (20 injection-test fixtures + CI) | ✓ fixtures shipped; CI gate added in Phase 6 |
| CHT-10 (spending cap, graceful degrade) | architecture in place | `DAILY_BUDGET_USD` env var declared; KV counter wires when KV active |
| CHT-11 (semantic cache) | env var ready; lands as KV optimisation when chat traffic warrants |
| CHT-12 (search→chat handoff) | UI hook in ChatWidget; Pagefind empty-state wiring is a Phase 6 polish item |
| CHT-13 (vectors-deployed-at marker + index-updating banner) | KV marker + UI banner are 1-day follow-up after first real reindex |
| SRC-03 (search→chat) | tracked under CHT-12 |

## Verification

- `pnpm install` resolves all chat-worker + embed-cli deps with no peer warnings
- `pnpm --filter @aigov/site build` → 17 pages (unchanged — ChatWidget exists as a component, not yet wired into a Starlight slot)
- Live test: `node --experimental-strip-types packages/embed-cli/src/index.ts` → **105 chunks emitted** to `.planning/data/chunks.jsonl`

## What the user needs to do (SETUP.md additions, Phase 6 scope)

1. Create Cloudflare account; create Vectorize index `aigov-content` (768 dimensions, cosine metric)
2. Create KV namespace `aigov-rate-limit`; copy the ID into wrangler.toml
3. `wrangler secret put ANTHROPIC_API_KEY`
4. (Optional) `wrangler secret put TURNSTILE_SECRET_KEY` + set `TURNSTILE_SITE_KEY` env var
5. `wrangler deploy` — pushes the worker; URL becomes available
6. Set `AIGOV_CHAT_URL` on `window` via `apps/site/src/components/Head.astro` to point at the worker URL
7. Run `node --experimental-strip-types packages/embed-cli/src/index.ts` to regenerate `chunks.jsonl`, then a follow-up script pipes it into Workers AI BGE-base + Vectorize upsert

## Notable design decisions

1. **Stub-first worker.** Returns deterministic responses while bindings are absent so the entire UI/UX can be exercised offline. Removes "is the worker even reachable?" debugging step on first deploy.
2. **Refusal patterns matched BEFORE retrieval.** Saves the cost of an Anthropic call (and a Vectorize query) for the 20 known-bad query shapes.
3. **Embed-cli is fully offline.** Producing `chunks.jsonl` is a clean intermediate so users can inspect what is about to be indexed before the upsert step runs.

## Commits

- feat(phase-5): chat-worker scaffold (Hono on Cloudflare Workers) + embed-cli chunker (105 chunks emitted) + ChatWidget UI + 20 injection-test fixtures + wrangler.toml (CHT-01..09 architecture; live deploy gated on Cloudflare setup)

## Self-Check: PASSED
