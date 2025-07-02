export interface YunoClientConfig {
  accountCode: string;
  publicApiKey: string;
  privateSecretKey: string;
}

export type ApiKeyPrefixToEnvironmentSuffix = {
  dev: "-dev";
  staging: "-staging";
  sandbox: "-sandbox";
  prod: "";
};
export type ApiKeyPrefix = keyof ApiKeyPrefixToEnvironmentSuffix;
export type EnvironmentSuffix = ApiKeyPrefixToEnvironmentSuffix[ApiKeyPrefix];