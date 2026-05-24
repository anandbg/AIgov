import { z } from "zod";

export const StoryFrontmatter = z.object({
  company: z.string(),
  slug: z.string(),
  jurisdiction: z.enum(["eu", "uk", "us", "us-state", "apac", "global"]),
  industry: z.string(),
  protagonist: z.object({
    name: z.string(),
    role: z.string(),
  }),
  description: z.string(),
  useCases: z.array(z.string()).default([]),
});

export type Story = z.infer<typeof StoryFrontmatter>;
