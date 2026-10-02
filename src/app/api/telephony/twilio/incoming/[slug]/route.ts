import { NextRequest, NextResponse } from "next/server";
import { getPublicAppUrl } from "@/lib/public-app-url";
import { normalizePhoneForDial } from "@/lib/telephony/phone";
import { getTelephonyProvider } from "@/lib/telephony/provider";
import { formDataToWebhookParams, getWebhookParam } from "@/lib/telephony/twilio-signature";
import { registerIncomingCall } from "@/lib/telephony/state-server";

export const dynamic = "force-dynamic";

function xml(body: string, status = 200) {
  return new NextResponse(body, {
    status,
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
    `/api/telephony/twilio/incoming/${encodeURIComponent(slug)}`,
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
  const callerPhone = getWebhookParam(params, "From");
  const providerNumber = getWebhookParam(params, "To");

  if (!/^CA[0-9a-f]{32}$/i.test(providerCallSid) || !callerPhone || !providerNumber) {
    return new NextResponse("Invalid Twilio call payload", { status: 400 });
  }

  try {
    const state = await registerIncomingCall({
      provider: adapter.provider,
      providerCallSid,
      slug,
      callerPhone,
      providerNumber,
    });

    const destination = normalizePhoneForDial(state.artisanPhone, config.defaultCountryCode);
    if (!destination) {
      console.error("telephony_artisan_phone_invalid", {
        callId: state.callId,
        artisanId: state.artisanId,
      });
      return xml("<Response></Response>", 422);
    }

    const actionUrl = getPublicAppUrl(
      `/api/telephony/twilio/dial-status/${encodeURIComponent(state.artisanSlug)}`,
    );

    return xml(adapter.buildDialResponse({
      destination,
      actionUrl,
      timeoutSeconds: config.dialTimeoutSeconds,
    }));
  } catch (error) {
    console.error("telephony_incoming_failed", {
      providerCallSid,
      reason: error instanceof Error ? error.message : "unknown",
    });
    return xml("<Response></Response>", 500);
  }
}
