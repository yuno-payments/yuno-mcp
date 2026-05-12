import z from "zod";

const addressSchema = z
  .object({
    address_line_1: z.string(),
    address_line_2: z.string().nullish(),
    building_number_1: z.string().nullish(),
    building_number_2: z.string().nullish(),
    country: z.string().min(2).max(2).nullish().describe("Country (ISO 3166-1)"),
    state: z.string().nullish(),
    city: z.string(),
    zip_code: z.string().nullish(),
    neighborhood: z.string().nullish(),
  })
  .passthrough()
  .nullish();

const metadataSchema = z.array(z.object({ key: z.string(), value: z.string() })).nullish();

const phoneSchema = z
  .object({
    number: z.string(),
    country_code: z.string(),
  })
  .passthrough()
  .nullish();

const documentSchema = z
  .object({
    document_type: z.string(),
    document_number: z.string(),
  })
  .passthrough()
  .nullish();

const cardDataSchema = z
  .object({
    number: z.string().min(8).max(19),
    expiration_month: z.number().min(1).max(12),
    expiration_year: z.number().min(1).max(9999),
    security_code: z.string().min(3).max(4).nullish(),
    holder_name: z.string().min(3).max(26).nullish(),
    type: z.string().nullish(),
    brand: z.string().nullish(),
  })
  .passthrough();

const browserInfoSchema = z
  .object({
    browser_time_difference: z.string().describe("Browser time difference"),
    color_depth: z.string().describe("Screen color depth"),
    java_enabled: z.boolean().describe("Whether Java is enabled"),
    screen_width: z.string().describe("Screen width"),
    screen_height: z.string().describe("Screen height"),
    user_agent: z.string().describe("Browser user agent"),
    language: z.string().describe("Browser language"),
    javascript_enabled: z.boolean().describe("Whether JavaScript is enabled"),
    accept_browser: z.string().describe("Browser accept header"),
    accept_content: z.string().describe("Content accept header"),
    accept_header: z.string().describe("Accept header"),
  })
  .passthrough();

const amountSchema = z
  .object({
    currency: z.string().min(3).max(3).describe("The currency used to make the payment (ISO 4217)"),
    value: z.number().min(0).describe("The payment amount"),
  })
  .passthrough();

export { addressSchema, metadataSchema, phoneSchema, documentSchema, cardDataSchema, browserInfoSchema, amountSchema };
