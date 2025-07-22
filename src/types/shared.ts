type YunoDocument = {
  document_type: string;
  document_number: string;
};

type YunoPhone = {
  number: string;
  country_code: string;
};

type YunoAddress = {
  address_line_1?: string;
  address_line_2?: string;
  country?: string;
  state?: string;
  city?: string;
  zip_code?: string;
  neighborhood?: string;
};

type YunoMetadata = {
  key: string;
  value: string;
};

type YunoAmount = {
  currency: string;
  value: number;
};

type YunoCard = {
  number: string;
  expiration_month: number;
  expiration_year: number;
  security_code?: string;
  holder_name?: string;
  type?: string | null;
  brand?: string;
};

type YunoCardData = {
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
};

type YunoBrowserInfo = {
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
};

type PublicApiKey = `staging_${string}` | `sandbox_${string}` | `dev_${string}` | `prod_${string}`;

export type { YunoDocument, YunoPhone, YunoAddress, YunoMetadata, YunoAmount, YunoCard, YunoCardData, YunoBrowserInfo, PublicApiKey };
