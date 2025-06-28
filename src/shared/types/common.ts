import { z } from "zod";
import { YunoClient } from "../../client";

export type Tool = {
  method: string,
  description: string,
  schema: z.ZodObject<any>,
  handler: (yunoClient: YunoClient, data: any, _extra?: any) => Promise<any>,
}; 

export interface YunoPhone {
  number: string;
  country_code: string;
}

export interface YunoAddress {
  address_line_1: string;
  address_line_2?: string;
  country: string;
  state: string;
  city: string;
  zip_code: string;
  neighborhood?: string;
}

export interface YunoMetadata {
  key: string;
  value: string;
}

export interface YunoAmount {
  currency: string;
  value: number;
}
