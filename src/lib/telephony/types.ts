export type TelephonyCallStatus =
  | "PENDING"
  | "ANSWERED"
  | "MISSED"
  | "FAILED"
  | "CANCELED";

export type TelephonyCallReason =
  | "PENDING"
  | "COMPLETED"
  | "NO_ANSWER"
  | "BUSY"
  | "PROVIDER_FAILED"
  | "CANCELED"
  | "UNKNOWN";

export type TelephonySmsStatus =
  | "NOT_PREPARED"
  | "NOT_REQUIRED"
  | "PREPARED"
  | "SUPPRESSED"
  | "SENDING"
  | "SENT"
  | "FAILED";

export type NormalizedDialResult = {
  status: Exclude<TelephonyCallStatus, "PENDING">;
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
