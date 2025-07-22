import { z } from "zod";

export const routingLoginSchema = z.object({
    username: z.string().describe("Email of the user"),
    password: z.string().describe("Password of the user"),
    remember_evice: z.boolean().describe("Remember this device for future logins").optional(),
});

export const routingCreateSchema = z.object({
    name: z.string().describe("Name of the routing workflow"),
    paymentMethod: z.string().describe("Payment method type (e.g., CARD)"),
    username: z.string().describe("Email/username for authentication"),
    password: z.string().describe("Password for authentication"),
});

export const routingLoginResponse  = z.object({
    access_token: z.string().describe("Access token for the user"),
    mfa_token: z.string().describe("Multi-factor authentication token for the user").optional(),
    next_step: z.string().describe("Next step in the login process, e.g., 'mfa' or 'error'").optional(),
    authenticator_type: z.string().describe("Type of authenticator used for MFA, e.g., 'totp'").nullable(),
    secret: z.string().describe("Secret key for the authenticator, if applicable").nullable(),
    barcode_uri: z.string().describe("URI for the barcode used in MFA, if applicable").nullable(),
});