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
  .loose()
  .nullish();

const metadataSchema = z.array(z.object({ key: z.string(), value: z.string() })).nullish();

const phoneSchema = z
  .object({
    number: z.string(),
    country_code: z.string(),
  })
  .loose()
  .nullish();

const documentSchema = z
  .object({
    document_type: z.string(),
    document_number: z.string(),
  })
  .loose()
  .nullish();

/**
 * Mirrors public-api's card_year validator (validations/validations.go:244-259):
 * a 2-digit year (1-99) or a 4-digit one (1000-9999), never 100-999.
 *
 * checkoutSessionCreateOtt used to override this with YY-only while paymentCreate
 * took anything up to 9999, so a model that learned the format from one tool was
 * rejected by the other. Every card input now shares this one definition.
 */
const cardExpirationYearSchema = z
  .number()
  .int()
  .min(1)
  .max(9999)
  .refine((year) => year <= 99 || year >= 1000, { message: "Expiration year must be 2 digits (29) or 4 digits (2029)" })
  .describe("Card expiration year, as YY (29) or YYYY (2029)");

const cardDataSchema = z
  .object({
    number: z.string().min(8).max(19),
    expiration_month: z.number().min(1).max(12),
    expiration_year: cardExpirationYearSchema,
    security_code: z.string().min(3).max(4).nullish(),
    holder_name: z.string().min(3).max(26).nullish(),
    type: z.string().nullish(),
    brand: z.string().nullish(),
  })
  .loose();

// Responses carry masked card data — no PAN, no expiry. Requests still require both.
const cardDataResponseSchema = cardDataSchema.extend({
  number: z.string().nullish(),
  expiration_month: z.number().nullish(),
  expiration_year: z.number().nullish(),
});

// Responses return currency "" when the amount does not apply (e.g. no trial period).
const amountResponseSchema = z
  .object({
    currency: z.string().describe("Currency (ISO 4217), or empty when not applicable"),
    value: z.number().nullish().describe("The amount"),
  })
  .loose();

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
  .loose();

const amountSchema = z
  .object({
    currency: z.string().min(3).max(3).describe("The currency used to make the payment (ISO 4217)"),
    value: z.number().min(0).describe("The payment amount"),
  })
  .loose();

const orderItemSchema = z
  .object({
    id: z.string().describe("Item identifier"),
    name: z.string().describe("Item name"),
    quantity: z.number().describe("Item quantity"),
    unit_amount: z.number().describe("Unit amount"),
    category: z.string().nullish().describe("Item category (e.g., art, baby, beauty_&_personal_care, books, donations, others, ...)"),
    brand: z.string().nullish(),
    sku_code: z.string().nullish(),
    manufacture_part_number: z.string().nullish(),
    url: z.string().nullish(),
  })
  .loose();

const orderTaxSchema = z
  .object({
    type: z
      .enum(["VAT", "AIRPORT_TAX", "CONSUMPTION_TAX", "VAT_LAW_17934", "VAT_LAW_19210", "VAT_EXEMPTION", "ISV"])
      .nullish(),
    tax_base: z.number().nullish(),
    value: z.number().nullish(),
    percentage: z.number().nullish(),
  })
  .loose();

const orderShippingSchema = z
  .object({
    type: z.string().nullish().describe("Shipping type (CUSTOM, EXPRESS, STANDARD, SAME_DAY, ...)"),
    description: z.string().nullish(),
    carrier: z.string().nullish().describe("Carrier code (UPS, USPS, FEDEX, DHL, ...)"),
    deliver_at: z.string().nullish().describe("Delivery date (ISO 8601)"),
  })
  .loose();

const accountFundingPartySchema = z
  .object({
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
    legal_name: z.string().nullish(),
    national_entity: z.enum(["INDIVIDUAL", "ENTITY"]).nullish(),
    email: z.string().nullish(),
    country: z.string().nullish().describe("Country (ISO 3166-1)"),
    date_of_birth: z.string().nullish(),
    document: documentSchema,
    phone: phoneSchema,
    address: addressSchema,
  })
  .loose();

const airlineLegSchema = z
  .object({
    passenger_id: z.string().nullish(),
    departure_airport: z.string().nullish(),
    departure_datetime: z.string().nullish(),
    departure_airport_country: z.string().nullish(),
    departure_airport_city: z.string().nullish(),
    departure_airport_timezone: z.string().nullish(),
    arrival_airport: z.string().nullish(),
    arrival_datetime: z.string().nullish(),
    arrival_airport_country: z.string().nullish(),
    arrival_airport_city: z.string().nullish(),
    arrival_airport_timezone: z.string().nullish(),
    carrier_code: z.string().nullish(),
    flight_number: z.string().nullish(),
    fare_basis_code: z.string().nullish(),
    fare_class_code: z.string().nullish(),
    base_fare: z.number().nullish(),
    base_fare_currency: z.string().nullish(),
    stopover_code: z.string().nullish(),
    route_order: z.number().nullish(),
    order: z.number().nullish(),
  })
  .loose();

const airlinePassengerSchema = z
  .object({
    id: z.string().nullish(),
    first_name: z.string().nullish(),
    middle_name: z.string().nullish(),
    last_name: z.string().nullish(),
    date_of_birth: z.string().nullish(),
    nationality: z.string().nullish(),
    email: z.string().nullish(),
    phone: phoneSchema,
    document: documentSchema,
    loyalty_number: z.string().nullish(),
    loyalty_tier: z.string().nullish(),
  })
  .loose();

const airlineTicketSchema = z
  .object({
    ticket_number: z.string().nullish(),
    passenger_id: z.string().nullish(),
    e_ticket: z.boolean().nullish(),
    restricted: z.boolean().nullish(),
    total_fare_amount: z.number().nullish(),
    total_fee_amount: z.number().nullish(),
    total_tax_amount: z.number().nullish(),
    issue: z
      .object({
        carrier_prefix_code: z.string().nullish(),
        travel_agent_code: z.string().nullish(),
        travel_agent_name: z.string().nullish(),
        booking_system_code: z.string().nullish(),
        booking_system_name: z.string().nullish(),
        date: z.string().nullish(),
        address: z.string().nullish(),
        city: z.string().nullish(),
        country: z.string().nullish(),
      })
      .loose()
      .nullish(),
  })
  .loose();

const airlineSchema = z
  .object({
    pnr: z.string().describe("Passenger Name Record"),
    type: z.enum(["ONE_WAY", "ROUNDTRIP", "MULTIPLE_DESTINATIONS"]).nullish(),
    legs: z.array(airlineLegSchema).nullish(),
    passengers: z.array(airlinePassengerSchema).nullish(),
    tickets: z.array(airlineTicketSchema).nullish(),
  })
  .loose();

const sellerDetailsSchema = z
  .object({
    name: z.string().nullish(),
    email: z.string().nullish(),
    reference: z.string().nullish(),
    website: z.string().nullish(),
    industry: z.string().nullish().describe("Industry code (e.g., ADVERTISING, ART, ...)"),
    merchant_category_code: z.string().nullish(),
    country: z.string().nullish().describe("Country (ISO 3166-1)"),
    document: documentSchema,
    phone: phoneSchema,
    address: addressSchema,
  })
  .loose();

const paymentAdditionalDataSchema = z
  .object({
    order: z
      .object({
        shipping_amount: z.number().nullish(),
        fee_amount: z.number().nullish(),
        tip_amount: z.string().nullish(),
        taxes: z.array(orderTaxSchema).nullish(),
        items: z.array(orderItemSchema).nullish(),
        shipping: orderShippingSchema.nullish(),
        tickets: z
          .array(
            z
              .object({
                id: z.string().nullish(),
                name: z.string().nullish(),
                description: z.string().nullish(),
                type: z.string().nullish(),
                amount: amountSchema.nullish(),
                event: z
                  .object({
                    id: z.string().nullish(),
                    name: z.string().nullish(),
                    description: z.string().nullish(),
                    type: z.string().nullish(),
                    date: z.string().nullish(),
                    address: addressSchema,
                  })
                  .loose()
                  .nullish(),
              })
              .loose(),
          )
          .nullish(),
        account_funding: z
          .object({
            sender: accountFundingPartySchema.nullish(),
            beneficiary: accountFundingPartySchema.nullish(),
          })
          .loose()
          .nullish(),
        discounts: z
          .array(
            z
              .object({
                id: z.string().nullish(),
                name: z.string().nullish(),
                unit_amount: z.number().nullish(),
              })
              .loose(),
          )
          .nullish(),
        sales_channel: z.string().nullish(),
      })
      .loose()
      .nullish(),
    airline: airlineSchema.nullish(),
    transportations: z
      .array(
        z
          .object({
            id: z.string().nullish(),
            description: z.string().nullish(),
            type: z.enum(["ONE_WAY", "ROUNDTRIP", "MULTIPLE_DESTINATIONS"]).nullish(),
            legs: z.array(airlineLegSchema).nullish(),
            passengers: z.array(airlinePassengerSchema).nullish(),
            tickets: z.array(airlineTicketSchema).nullish(),
          })
          .loose(),
      )
      .nullish(),
    seller_details: sellerDetailsSchema.nullish(),
  })
  .loose();

const subscriptionAdditionalDataSchema = z
  .object({
    order: z
      .object({
        items: z.array(orderItemSchema).nullish(),
      })
      .loose()
      .nullish(),
  })
  .loose();

const fraudScreeningRequestSchema = z
  .object({
    stand_alone: z
      .boolean()
      .nullish()
      .describe("If true, fraud screening runs without executing the payment afterward"),
  })
  .loose();

const splitMarketplaceRequestSchema = z.array(
  z
    .object({
      recipient_id: z.string().nullish().describe("Yuno-generated recipient id (mutually exclusive with provider_recipient_id)"),
      provider_recipient_id: z.string().nullish(),
      description: z.string().nullish(),
      type: z.enum(["PURCHASE", "PAYMENTFEE", "VAT", "COMMISSION", "MARKETPLACE", "SHIPPING"]).describe("Split type"),
      merchant_reference: z.string().nullish(),
      recipient_type: z.enum(["MEAL", "FOOD", "MULTI_BENEFITS", "FLEET"]).nullish(),
      amount: amountSchema.nullish(),
      liability: z
        .object({
          processing_fee: z.enum(["MERCHANT", "RECIPIENT", "SHARED"]).nullish(),
          chargebacks: z.boolean().nullish(),
        })
        .loose()
        .nullish(),
    })
    .loose(),
);

const deviceFingerprintsSchema = z
  .array(
    z
      .object({
        provider_id: z.string().nullish().describe("Fraud screening provider id"),
        id: z.string().nullish().describe("Device fingerprint associated to the provider"),
      })
      .loose(),
  )
  .describe("Device fingerprints from fraud screening providers");

export {
  addressSchema,
  metadataSchema,
  phoneSchema,
  documentSchema,
  cardDataSchema,
  cardDataResponseSchema,
  browserInfoSchema,
  amountSchema,
  amountResponseSchema,
  paymentAdditionalDataSchema,
  subscriptionAdditionalDataSchema,
  fraudScreeningRequestSchema,
  splitMarketplaceRequestSchema,
  deviceFingerprintsSchema,
};
