import { NextRequest, NextResponse } from "next/server";
import { getPublicAppUrl } from "@/lib/public-app-url";
import { getMissedCallRequestUrl, getMissedCallSmsBody } from "@/lib/telephony/links";
import { getTelephonyProvider } from "@/lib/telephony/provider";
import { formDataToWebhookParams, getWebhookParam } from "@/lib/telephony/twilio-signature";
import { completeTelephonyCall, markTelephonySms } from "@/lib/telephony/state-server";

export const dynamic = "force-dynamic";

function emptyTwiml() {
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status: 200,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const { adapter, config } = getTelephonyProvider();

  if (!config.twilioAuthToken) {
    return new NextResponse("Telephony not configured", { status: 503 });
  }

  const formData = await request.formData();
  const params = formDataToWebhookParams(formData);
  const signature = request.headers.get("x-twilio-signature") ?? "";
  const webhookUrl = getPublicAppUrl(
    `/api/telephony/twilio/dial-status/${encodeURIComponent(slug)}`,
  );

  if (!adapter.validateWebhook({
    authToken: config.twilioAuthToken,
    signature,
    url: webhookUrl,
    params,
  })) {
    return new NextResponse("Invalid Twilio signature", { status: 403 });
  }

  const providerCallSid = getWebhookParam(params, "CallSid");
  const providerDialCallSid = getWebhookParam(params, "DialCallSid") || null;
  const rawDialStatus = getWebhookParam(params, "DialCallStatus");

  if (!/^CA[0-9a-f]{32}$/i.test(providerCallSid) || !rawDialStatus) {
    return new NextResponse("Invalid Twilio dial payload", { status: 400 });
  }

  const normalized = adapter.normalizeDialStatus(rawDialStatus);
  const smsLink = getMissedCallRequestUrl(slug);

  try {
    const state = await completeTelephonyCall({
      provider: adapter.provider,
      providerCallSid,
      providerDialCallSid,
      outcome: normalized.outcome,
      reason: normalized.reason,
      providerStatus: normalized.providerStatus,
      smsLink,
      smsCooldownMinutes: config.smsCooldownMinutes,
    });

    if (
      normalized.outcome === "MISSED" &&
      state.smsState === "PREPARED" &&
      config.smsLive
    ) {
      if (!state.callerPhone) {
        await markTelephonySms({
          provider: adapter.provider,
          providerCallSid,
          smsState: "FAILED",
        });
      } else {
        try {
          const sent = await adapter.sendSms({
            to: state.callerPhone,
            body: getMissedCallSmsBody(slug),
          });
          await markTelephonySms({
            provider: adapter.provider,
            providerCallSid,
            smsState: "SENT",
            providerMessageId: sent.providerMessageId,
          });
        } catch (smsError) {
          console.error("telephony_sms_send_failed", {
            providerCallSid,
            reason: smsError instanceof Error ? smsError.message : "unknown",
          });
          await markTelephonySms({
            provider: adapter.provider,
            providerCallSid,
            smsState: "FAILED",
          });
        }
      }
    }

    return emptyTwiml();
  } catch (error) {
    console.error("telephony_dial_callback_failed", {
      providerCallSid,
      reason: error instanceof Error ? error.message : "unknown",
    });
    return emptyTwiml();
  }
}
