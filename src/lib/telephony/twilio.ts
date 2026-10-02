import "server-only";

import { normalizeTwilioDialStatus } from "./status";
import { validateTwilioSignature } from "./twilio-signature";
import type { DialResponseInput, SmsSendInput, TelephonyProviderAdapter } from "./types";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export class TwilioTelephonyAdapter implements TelephonyProviderAdapter {
  readonly provider = "twilio";

  constructor(
    private readonly accountSid: string | null,
    private readonly authToken: string | null,
    private readonly fromNumber: string | null,
  ) {}

  validateWebhook(input: Parameters<TelephonyProviderAdapter["validateWebhook"]>[0]) {
    return validateTwilioSignature(input.authToken, input.signature, input.url, input.params);
  }

  buildDialResponse(input: DialResponseInput) {
    const destination = escapeXml(input.destination);
    const actionUrl = escapeXml(input.actionUrl);
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      "<Response>",
      `<Dial action="${actionUrl}" method="POST" answerOnBridge="true" timeout="${input.timeoutSeconds}">`,
      `<Number>${destination}</Number>`,
      "</Dial>",
      "</Response>",
    ].join("");
  }

  normalizeDialStatus(rawStatus: string) {
    return normalizeTwilioDialStatus(rawStatus);
  }

  async sendSms(input: SmsSendInput) {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      throw new Error("twilio_sms_not_configured");
    }

    const body = new URLSearchParams({ To: input.to, From: this.fromNumber, Body: input.body });
    const authorization = Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(this.accountSid)}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authorization}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
        cache: "no-store",
      },
    );

    if (!response.ok) throw new Error(`twilio_sms_failed_${response.status}`);

    const payload: unknown = await response.json();
    if (
      typeof payload !== "object" ||
      payload === null ||
      !("sid" in payload) ||
      typeof (payload as { sid?: unknown }).sid !== "string"
    ) {
      throw new Error("twilio_sms_response_invalid");
    }

    return { providerMessageId: (payload as { sid: string }).sid };
  }
}
