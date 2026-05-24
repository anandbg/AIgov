import { z } from "zod";

export const RegulationRef = z.object({
  source: z.string(),
  articles: z.array(z.string()),
  relevance: z.enum(["core", "supporting", "related"]),
  note: z.string().optional(),
});

export type RegulationRefT = z.infer<typeof RegulationRef>;

export const StageFrontmatter = z.object({
  stage: z.number().int().min(0).max(12),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  storyCharacter: z.string().optional(),
  personas: z.object({
    exec: z.boolean().default(true),
    engineer: z.boolean().default(true),
    compliance: z.boolean().default(true),
  }),
  regulations: z.array(RegulationRef),
  prerequisites: z.array(z.string()).default([]),
  lastMeaningfulChange: z.string().optional(),
  draft: z.boolean().default(false),
});

export type Stage = z.infer<typeof StageFrontmatter>;
