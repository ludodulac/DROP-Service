import { NextRequest, NextResponse } from "next/server";
import { getPublicAppUrl } from "@/lib/public-app-url";
import { getMissedCallSmsBody } from "@/lib/telephony/links";
import { getTelephonyProvider } from "@/lib/telephony/provider";
import {
  claimTelephonySms,
  completeTelephonyCall,
  markTelephonySms,
  recordTelephonyError,
} from "@/lib/telephony/state-server";
import {
  formDataToWebhookParams,
  getWebhookParam,
  isTwilioCallSid,
} from "@/lib/telephony/twilio-webhook";

export const dynamic = "force-dynamic";

const RESULT_PATH = "/api/telephony/twilio/voice/result";

function emptyTwiml(status = 200) {
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    {
      status,
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    },
  );
}

export async function POST(request: NextRequest) {
  const { adapter, config } = getTelephonyProvider();

  if (!config.twilioAuthToken) {
    return new NextResponse("Telephony not configured", { status: 503 });
  }

  const formData = await request.formData();
  const params = formDataToWebhookParams(formData);
  const signature = request.headers.get("x-twilio-signature") ?? "";
  const webhookUrl = getPublicAppUrl(RESULT_PATH);

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
  const providerLegCallId = getWebhookParam(params, "DialCallSid") || null;
  const rawDialStatus = getWebhookParam(params, "DialCallStatus");

  if (!isTwilioCallSid(providerCallId) || !rawDialStatus) {
    return new NextResponse("Invalid Twilio dial payload", { status: 400 });
  }

  const normalized = adapter.normalizeDialStatus(rawDialStatus);

  try {
    const state = await completeTelephonyCall({
      provider: adapter.provider,
      providerCallId,
      providerLegCallId,
      callStatus: normalized.status,
      callReason: normalized.reason,
      providerStatus: normalized.providerStatus,
      smsCooldownMinutes: config.smsCooldownMinutes,
    });

    if (state.smsStatus === "PREPARED" && config.smsLive) {
      const claim = await claimTelephonySms({
        provider: adapter.provider,
        providerCallId,
      });

      if (claim.claimed) {
        if (!claim.callerPhone || !claim.smsLink) {
          await markTelephonySms({
            provider: adapter.provider,
            providerCallId,
            smsStatus: "FAILED",
            errorMessage: "sms_context_missing",
          });
        } else {
          try {
            const sent = await adapter.sendSms({
              to: claim.callerPhone,
              body: getMissedCallSmsBody(claim.smsLink),
            });

            await markTelephonySms({
              provider: adapter.provider,
              providerCallId,
              smsStatus: "SENT",
              providerMessageId: sent.providerMessageId,
            });
          } catch {
            await markTelephonySms({
              provider: adapter.provider,
              providerCallId,
              smsStatus: "FAILED",
              errorMessage: "sms_send_failed",
            });
          }
        }
      }
    }

    return emptyTwiml();
  } catch {
    try {
      await recordTelephonyError({
        provider: adapter.provider,
        providerCallId,
        errorMessage: "dial_result_processing_failed",
      });
    } catch {
      // Preserve the original callback failure.
    }

    return emptyTwiml(500);
  }
}
