import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

// Schema source of truth: packages/shared/src/schemas/*.ts (consumed by the
// Phase 3 pipeline and Phase 5 worker, which use the standalone `zod` package).
//
// Astro 6 ships its own bundled Zod via `astro:content` that is type-incompatible
// with the standalone `zod` package — the two `z.ZodType<T>` shapes do not match
// even though the runtime API is identical. To keep `astro check` clean while
// preserving @aigov/shared as the canonical source, we re-state the schema shapes
// in this file using astro:content's `z`. Any change to a shape MUST be applied to
// BOTH packages/shared/src/schemas/*.ts AND this file. A future plan can collapse
// the duplication once the two Zod versions align. (#astro-zod-bridge)

// === stage / regulation reference (used by Starlight docs collection extend) ===
const stageRegulationRef = z.object({
  source: reference('regulations'),
  articles: z.array(z.string()),
  relevance: z.enum(['core', 'supporting', 'related']),
  note: z.string().optional(),
});

// === stages live inside Starlight's `docs` collection ===
const docs = defineCollection({
  loader: docsLoader(),
  schema: docsSchema({
    extend: z.object({
      stage: z.number().int().min(0).max(12).optional(),
      slug: z.string().optional(),
      subtitle: z.string().optional(),
      storyCharacter: z.string().optional(),
      personas: z.object({
        exec: z.boolean().default(true),
        engineer: z.boolean().default(true),
        compliance: z.boolean().default(true),
      }).optional(),
      regulations: z.array(stageRegulationRef).default([]),
      prerequisites: z.array(z.string()).default([]),
      lastMeaningfulChange: z.string().optional(),
      draft: z.boolean().default(false),
    }),
  }),
});

// === regulations ===
const regulations = defineCollection({
  loader: glob({ pattern: ['**/index.md', '!_*/**', '!**/_*'], base: './src/content/regulations' }),
  schema: z.object({
    source: z.string(),
    name: z.string(),
    kind: z.enum(['regulation', 'framework', 'standard', 'guideline']),
    jurisdiction: z.enum(['eu', 'uk', 'us', 'us-state', 'global', 'apac']),
    canonicalUrl: z.string().url(),
    firstTrackedAt: z.string(),
    currentSnapshotDate: z.string().optional(),
    description: z.string(),
  }),
});

// === snapshots (dated per-source captures) ===
const snapshots = defineCollection({
  loader: glob({ pattern: ['**/snapshots/*.md', '!_*/**', '!**/_*'], base: './src/content/regulations' }),
  schema: z.object({
    source: reference('regulations'),
    snapshotDate: z.string(),
    srcUrl: z.string().url(),
    fetchedAt: z.string(),
    fetcherVersion: z.string(),
    materialChange: z.boolean(),
    changeKind: z.enum(['editorial', 'clarification', 'amendment', 'new-section']),
    changeSummary: z.string(),
    relatedArticles: z.array(z.string()).default([]),
  }),
});

// === vendor policies ===
const vendor = defineCollection({
  loader: glob({ pattern: ['**/index.md', '!_*/**', '!**/_*'], base: './src/content/vendor' }),
  schema: z.object({
    vendor: z.string(),
    name: z.string(),
    kind: z.literal('vendor-policy'),
    policyType: z.enum(['usage-policy', 'terms', 'api-tos', 'acceptable-use']),
    canonicalUrl: z.string().url(),
    firstTrackedAt: z.string(),
    currentSnapshotDate: z.string().optional(),
    description: z.string(),
  }),
});

// === glossary ===
// `seeAlso` is kind-polymorphic (stage | regulation | vendor) and therefore
// cannot use Astro's single-collection `reference()`. The slug is validated
// as a string here; the URL builders in @aigov/shared resolve at render-time.
const glossary = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/_*'], base: './src/content/glossary' }),
  schema: z.object({
    term: z.string(),
    slug: z.string(),
    aliases: z.array(z.string()).default([]),
    definition: z.string().max(320),
    related: z.array(z.string()).default([]),
    seeAlso: z
      .array(
        z.object({
          kind: z.enum(['stage', 'regulation', 'vendor']),
          slug: z.string(),
        })
      )
      .default([]),
  }),
});

// === stories (fictional companies) ===
const stories = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/_*'], base: './src/content/stories' }),
  schema: z.object({
    company: z.string(),
    slug: z.string(),
    jurisdiction: z.enum(['eu', 'uk', 'us', 'us-state', 'apac', 'global']),
    industry: z.string(),
    protagonist: z.object({
      name: z.string(),
      role: z.string(),
    }),
    description: z.string(),
    useCases: z.array(z.string()).default([]),
  }),
});

export const collections = {
  docs,
  regulations,
  snapshots,
  vendor,
  glossary,
  stories,
};
