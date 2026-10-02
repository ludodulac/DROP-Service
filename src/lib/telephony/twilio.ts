import "server-only";

import twilio from "twilio";
import { normalizeTwilioDialStatus } from "./status";
import type {
  DialResponseInput,
  SmsSendInput,
  TelephonyProviderAdapter,
} from "./types";

export class TwilioTelephonyAdapter implements TelephonyProviderAdapter {
  readonly provider = "twilio";

  constructor(
    private readonly accountSid: string | null,
    private readonly authToken: string | null,
    private readonly fromNumber: string | null,
  ) {}

  validateWebhook(
    input: Parameters<TelephonyProviderAdapter["validateWebhook"]>[0],
  ) {
    return twilio.validateRequest(
      input.authToken,
      input.signature,
      input.url,
      input.params,
    );
  }

  buildDialResponse(input: DialResponseInput) {
    const response = new twilio.twiml.VoiceResponse();
    const dial = response.dial({
      action: input.actionUrl,
      method: "POST",
      answerOnBridge: true,
      timeout: input.timeoutSeconds,
    });
    dial.number(input.destination);
    return response.toString();
  }

  normalizeDialStatus(rawStatus: string) {
    return normalizeTwilioDialStatus(rawStatus);
  }

  async sendSms(input: SmsSendInput) {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      throw new Error("twilio_sms_not_configured");
    }

    const client = twilio(this.accountSid, this.authToken);
    const message = await client.messages.create({
      to: input.to,
      from: this.fromNumber,
      body: input.body,
    });

    if (!message.sid) {
      throw new Error("twilio_sms_response_invalid");
    }

    return { providerMessageId: message.sid };
  }
}
