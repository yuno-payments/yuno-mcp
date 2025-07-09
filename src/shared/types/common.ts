import { z } from "zod";
import { YunoClient } from "../../client";

export type Tool = {
  method: string;
  description: string;
  schema: z.ZodObject<any>;
  handler: (yunoClient: YunoClient, data: any, _extra?: any) => Promise<any>;
};

export interface YunoDocument {
  document_type: string;
  document_number: string;
}

export interface YunoPhone {
  number: string;
  country_code: string;
}

export interface YunoAddress {
  address_line_1?: string;
  address_line_2?: string;
  country?: string;
  state?: string;
  city?: string;
  zip_code?: string;
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

// Interfaces para tarjetas
export interface YunoCard {
  number: string;
  expiration_month: number;
  expiration_year: number;
  security_code?: string;
  holder_name?: string;
  type?: string | null;
  brand?: string;
}

export interface YunoCardData {
  holder_name: string;
  iin: string;
  lfd: string;
  number_length: number;
  security_code_length: number;
  brand: string;
  type: string;
  category: string;
  issuer_name: string;
  issuer_code?: string | null;
}

export interface YunoBrowserInfo {
  browser_time_difference: string;
  color_depth: string;
  java_enabled: boolean;
  screen_width: string;
  screen_height: string;
  user_agent: string;
  language: string;
  javascript_enabled: boolean;
  accept_browser: string;
  accept_content: string;
  accept_header: string;
}
