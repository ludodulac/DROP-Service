export type TelephonyCallOutcome = "PENDING" | "ANSWERED" | "MISSED" | "FAILED";

export type TelephonyCallReason =
  | "PENDING"
  | "COMPLETED"
  | "NO_ANSWER"
  | "BUSY"
  | "PROVIDER_FAILED"
  | "CANCELED"
  | "UNKNOWN";

export type TelephonySmsState =
  | "NOT_PREPARED"
  | "NOT_REQUIRED"
  | "PREPARED"
  | "SUPPRESSED"
  | "SENT"
  | "FAILED";

export type NormalizedDialResult = {
  outcome: Exclude<TelephonyCallOutcome, "PENDING">;
  reason: Exclude<TelephonyCallReason, "PENDING">;
  providerStatus: string;
};

export type WebhookParams = Record<string, string | string[]>;

export type DialResponseInput = {
  destination: string;
  actionUrl: string;
  timeoutSeconds: number;
};

export type SmsSendInput = {
  to: string;
  body: string;
};

export interface TelephonyProviderAdapter {
  readonly provider: string;
  validateWebhook(input: {
    authToken: string;
    signature: string;
    url: string;
    params: WebhookParams;
  }): boolean;
  buildDialResponse(input: DialResponseInput): string;
  normalizeDialStatus(rawStatus: string): NormalizedDialResult;
  sendSms(input: SmsSendInput): Promise<{ providerMessageId: string }>;
}
