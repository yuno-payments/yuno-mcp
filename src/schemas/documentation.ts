import { z } from "zod";

const ALLOWED_DOCUMENTATION_HOST = "docs.y.uno";

const documentationUrlSchema = z
  .string()
  .url()
  .refine(
    (value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === "https:" && parsed.hostname === ALLOWED_DOCUMENTATION_HOST;
      } catch {
        return false;
      }
    },
    { message: `URL must be an https:// URL on ${ALLOWED_DOCUMENTATION_HOST}` },
  );

const documentationIndexSchema = z.object({});

const documentationReadSchema = z.object({
  url: documentationUrlSchema.describe(
    `The documentation URL to fetch. Must be an https:// URL on ${ALLOWED_DOCUMENTATION_HOST} (from the documentation index).`,
  ),
});

const documentationIndexOutputSchema = z
  .object({
    content: z.string().optional().describe("Raw llms.txt documentation index text"),
  })
  .passthrough();

const documentationReadOutputSchema = z
  .object({
    content: z.string().optional().describe("Raw documentation page text"),
  })
  .passthrough();

export {
  documentationIndexSchema,
  documentationReadSchema,
  documentationIndexOutputSchema,
  documentationReadOutputSchema,
  ALLOWED_DOCUMENTATION_HOST,
};
