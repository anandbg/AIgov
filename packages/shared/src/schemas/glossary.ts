import { z } from "zod";

export const GlossaryFrontmatter = z.object({
  term: z.string(),
  slug: z.string(),
  aliases: z.array(z.string()).default([]),
  definition: z.string().max(320),
  related: z.array(z.string()).default([]),
  seeAlso: z
    .array(
      z.object({
        kind: z.enum(["stage", "regulation", "vendor"]),
        slug: z.string(),
      })
    )
    .default([]),
});

export type Glossary = z.infer<typeof GlossaryFrontmatter>;
