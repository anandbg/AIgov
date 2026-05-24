import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

// Minimal collection wiring for Phase 1 — the five content collections
// (stages, regulations, vendor, glossary, stories) land in plan 01-04.
export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
