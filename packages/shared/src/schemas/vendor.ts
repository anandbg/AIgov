import { z } from "zod";

export const VendorFrontmatter = z.object({
  vendor: z.string(),
  name: z.string(),
  kind: z.literal("vendor-policy"),
  policyType: z.enum(["usage-policy", "terms", "api-tos", "acceptable-use"]),
  canonicalUrl: z.string().url(),
  firstTrackedAt: z.string(),
  currentSnapshotDate: z.string().optional(),
  description: z.string(),
});

export type Vendor = z.infer<typeof VendorFrontmatter>;
