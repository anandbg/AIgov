import { z } from "zod";

export const RegulationFrontmatter = z.object({
  source: z.string(),
  name: z.string(),
  kind: z.enum(["regulation", "framework", "standard", "guideline"]),
  jurisdiction: z.enum(["eu", "uk", "us", "us-state", "global", "apac"]),
  canonicalUrl: z.string().url(),
  firstTrackedAt: z.string(),
  currentSnapshotDate: z.string().optional(),
  description: z.string(),
});

export type Regulation = z.infer<typeof RegulationFrontmatter>;
