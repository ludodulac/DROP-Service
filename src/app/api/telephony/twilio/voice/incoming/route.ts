import { NextRequest, NextResponse } from "next/server";
import { getPublicAppUrl } from "@/lib/public-app-url";
import { getMissedCallRequestUrl } from "@/lib/telephony/links";
import { normalizePhoneForDial } from "@/lib/telephony/phone";
import { getTelephonyProvider } from "@/lib/telephony/provider";
import {
  recordTelephonyError,
  registerIncomingCall,
} from "@/lib/telephony/state-server";
import {
  formDataToWebhookParams,
  getWebhookParam,
  isTwilioCallSid,
} from "@/lib/telephony/twilio-webhook";

export const dynamic = "force-dynamic";

const INCOMING_PATH = "/api/telephony/twilio/voice/incoming";
const RESULT_PATH = "/api/telephony/twilio/voice/result";

function xml(body: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}

export async function POST(request: NextRequest) {
  const { adapter, config } = getTelephonyProvider();

  if (
    !config.twilioAuthToken ||
    !config.twilioPhoneNumber ||
    !config.artisanSlug
  ) {
    return new NextResponse("Telephony not configured", { status: 503 });
  }

  const formData = await request.formData();
  const params = formDataToWebhookParams(formData);
  const signature = request.headers.get("x-twilio-signature") ?? "";
  const webhookUrl = getPublicAppUrl(INCOMING_PATH);

  if (
    !adapter.validateWebhook({
      authToken: config.twilioAuthToken,
      signature,
      url: webhookUrl,
      params,
    })
  ) {
    return new NextResponse("Invalid Twilio signature", { status: 403 });
  }

  const providerCallId = getWebhookParam(params, "CallSid");
  const rawCallerPhone = getWebhookParam(params, "From");
  const rawCalledPhone = getWebhookParam(params, "To");

  if (!isTwilioCallSid(providerCallId) || !rawCalledPhone) {
    return new NextResponse("Invalid Twilio call payload", { status: 400 });
  }

  const calledPhone = normalizePhoneForDial(
    rawCalledPhone,
    config.defaultCountryCode,
  );
  const configuredTwilioNumber = normalizePhoneForDial(
    config.twilioPhoneNumber,
    config.defaultCountryCode,
  );

  if (
    !calledPhone ||
    !configuredTwilioNumber ||
    calledPhone !== configuredTwilioNumber
  ) {
    return new NextResponse("Unknown telephony route", { status: 404 });
  }

  const callerPhone = normalizePhoneForDial(
    rawCallerPhone,
    config.defaultCountryCode,
  );
  const smsLink = getMissedCallRequestUrl(config.artisanSlug);

  try {
    const state = await registerIncomingCall({
      provider: adapter.provider,
      providerCallId,
      artisanSlug: config.artisanSlug,
      callerPhone,
      calledPhone,
      smsLink,
    });

    const destination = normalizePhoneForDial(
      state.destinationPhone,
      config.defaultCountryCode,
    );

    if (!destination) {
      await recordTelephonyError({
        provider: adapter.provider,
        providerCallId,
        errorMessage: "artisan_destination_phone_invalid",
      });
      return xml("<Response></Response>", 422);
    }

    return xml(
      adapter.buildDialResponse({
        destination,
        actionUrl: getPublicAppUrl(RESULT_PATH),
        timeoutSeconds: config.dialTimeoutSeconds,
      }),
    );
  } catch {
    return xml("<Response></Response>", 500);
  }
}
