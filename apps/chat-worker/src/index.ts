/**
 * @aigov/chat-worker — Cloudflare Worker entry point.
 *
 * Routes:
 *   GET  /healthz   — liveness
 *   POST /chat      — RAG over Vectorize index, streams Claude Haiku 4.5 with Citations API
 *   POST /feedback  — capture thumbs-up/down on a chat response (anonymous)
 *
 * Phase 5 ships the architecture + retrieval contract + refusal/injection-test
 * fixture coverage. The full Anthropic streaming path requires:
 *   - ANTHROPIC_API_KEY secret set via `wrangler secret put`
 *   - Vectorize index `aigov-content` created and populated via packages/embed-cli
 *   - Workers AI binding active (free-tier quota sufficient for embeddings)
 *
 * Until those user-action gates close, the worker returns a deterministic
 * stub response indicating "chat temporarily unavailable" so the UI can be
 * exercised end-to-end.
 */
import { Hono } from "hono";
import { z } from "zod";

interface Env {
  // Bindings — uncomment in wrangler.toml when ready
  AI?: { run: (model: string, input: unknown) => Promise<unknown> };
  VECTORIZE?: {
    query: (vector: number[], opts: { topK: number; returnMetadata?: boolean }) => Promise<unknown>;
  };
  KV?: KVNamespace;

  // Vars
  ANTHROPIC_MODEL: string;
  MAX_REQUESTS_PER_HOUR_PER_IP: string;
  DAILY_BUDGET_USD: string;
  SITE_DOMAIN: string;
  TURNSTILE_SITE_KEY: string;

  // Secrets
  ANTHROPIC_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
}

const app = new Hono<{ Bindings: Env }>();

// Locked-down CORS: only the canonical domain. Embed-elsewhere attempts blocked.
app.use("*", async (c, next) => {
  const origin = c.req.header("origin") ?? "";
  const ok = origin === `https://${c.env.SITE_DOMAIN}` || origin === "" /* same-origin POST */;
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "no-referrer");
  c.header("Content-Security-Policy", "default-src 'self'");
  if (!ok) {
    return c.text("forbidden", 403);
  }
  await next();
});

app.get("/healthz", (c) => c.json({ ok: true, ts: new Date().toISOString() }));

// Known-bad query patterns — these are matched BEFORE retrieval and refused.
// The fixtures in fixtures/injection-tests.json drive the CI test in Phase 6.
const REFUSE_PATTERNS = [
  /\bwhat (should|must) i do (about|with|to)\b/i,
  /\bgive me (specific )?legal advice\b/i,
  /\byou (must|should) (tell|advise|instruct|order) me\b/i,
  /\bignore (all )?(previous|prior) (instructions|context|messages)\b/i,
  /\bsystem prompt\b.*\b(reveal|show|leak|display)\b/i,
  /\b(disregard|override) (the |your )?(rules|guardrails|safety)\b/i,
];

const ChatRequestSchema = z.object({
  q: z.string().min(1).max(2000),
  turnstileToken: z.string().optional(),
});

function shouldRefuse(q: string): { refuse: boolean; reason?: string } {
  for (const re of REFUSE_PATTERNS) {
    if (re.test(q)) return { refuse: true, reason: "This question is outside the site's scope or requests legal advice." };
  }
  return { refuse: false };
}

app.post("/chat", async (c) => {
  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: "invalid json" }, 400); }
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "invalid request" }, 400);

  const { q } = parsed.data;
  const refusal = shouldRefuse(q);
  if (refusal.refuse) {
    return c.json({
      type: "refusal",
      answer: `This site does not provide legal advice. ${refusal.reason} Please consult qualified counsel.`,
      citations: [],
    });
  }

  // TODO: rate limit via KV (per-IP hourly bucket)
  // TODO: Turnstile validate
  // TODO: daily-budget cap from KV counter

  if (!c.env.ANTHROPIC_API_KEY || !c.env.VECTORIZE || !c.env.AI) {
    return c.json({
      type: "unavailable",
      answer: "Chat is temporarily unavailable while the worker awaits Cloudflare account setup. See SETUP.md for the user-action steps.",
      citations: [],
    });
  }

  // Full RAG flow lands when bindings + secrets are wired:
  //   1. Embed `q` via c.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [q] })
  //   2. Query Vectorize topK=8 with metadata
  //   3. Build Anthropic Citations API payload with the chunks
  //   4. Stream response back to client (SSE)
  //
  // See packages/embed-cli for the index population side.

  return c.json({ type: "stub", answer: "RAG flow scaffolded; full streaming response lands once Cloudflare bindings are configured.", citations: [] });
});

const FeedbackSchema = z.object({
  questionHash: z.string().regex(/^[0-9a-f]{32,64}$/),
  rating: z.enum(["up", "down"]),
  freeform: z.string().max(500).optional(),
});

app.post("/feedback", async (c) => {
  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: "invalid json" }, 400); }
  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "invalid request" }, 400);
  // TODO: write to KV with timestamp; aggregate in daily cost dashboard
  return c.json({ ok: true });
});

export default app;
