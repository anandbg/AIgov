import { z } from "zod";

export const SnapshotFrontmatter = z.object({
  source: z.string(),
  snapshotDate: z.string(),
  srcUrl: z.string().url(),
  fetchedAt: z.string(),
  fetcherVersion: z.string(),
  materialChange: z.boolean(),
  changeKind: z.enum(["editorial", "clarification", "amendment", "new-section"]),
  changeSummary: z.string(),
  relatedArticles: z.array(z.string()).default([]),
});

export type Snapshot = z.infer<typeof SnapshotFrontmatter>;
