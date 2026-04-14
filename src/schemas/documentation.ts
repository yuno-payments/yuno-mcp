import { z } from "zod";

const documentationIndexSchema = z.object({});

const documentationReadSchema = z.object({
  url: z
    .string()
    .url()
    .describe("The documentation URL to fetch (from the documentation index)"),
});

export { documentationIndexSchema, documentationReadSchema };
