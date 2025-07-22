import { z } from "zod";
import { documentationReadSchema } from "../../schemas/documentation";

export type DocumentationReadSchema = z.infer<typeof documentationReadSchema>;
