import "server-only";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://nczdadkyysrxxcsnsrrn.supabase.co";

async function callTelephonyState<T>(action: string, payload: Record<string, unknown>) {
  const oidcToken = process.env.VERCEL_OIDC_TOKEN;
  if (!oidcToken) throw new Error("vercel_oidc_token_missing");

  const response = await fetch(`${supabaseUrl}/functions/v1/brif-telephony-state`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${oidcToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, ...payload }),
    cache: "no-store",
  });

  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code =
      typeof result === "object" &&
      result !== null &&
      "error" in result &&
      typeof (result as { error?: unknown }).error === "string"
        ? (result as { error: string }).error
        : `telephony_state_failed_${response.status}`;
    throw new Error(code);
  }
  return result as T;
}

export type IncomingCallState = {
  callId: string;
  artisanId: string;
  artisanSlug: string;
  artisanPhone: string;
};

export async function registerIncomingCall(input: {
  provider: string;
  providerCallSid: string;
  slug: string;
  callerPhone: string;
  providerNumber: string;
}) {
  return callTelephonyState<IncomingCallState>("register_incoming", input);
}

export type CompleteCallState = {
  callId: string;
  smsState: "NOT_PREPARED" | "NOT_REQUIRED" | "PREPARED" | "SUPPRESSED" | "SENT" | "FAILED";
  callerPhone: string | null;
};

export async function completeTelephonyCall(input: {
  provider: string;
  providerCallSid: string;
  providerDialCallSid: string | null;
  outcome: "ANSWERED" | "MISSED" | "FAILED";
  reason: "COMPLETED" | "NO_ANSWER" | "BUSY" | "PROVIDER_FAILED" | "CANCELED" | "UNKNOWN";
  providerStatus: string;
  smsLink: string;
  smsCooldownMinutes: number;
}) {
  return callTelephonyState<CompleteCallState>("complete_call", input);
}

export async function markTelephonySms(input: {
  provider: string;
  providerCallSid: string;
  smsState: "SENT" | "FAILED";
  providerMessageId?: string;
}) {
  return callTelephonyState<{ callId: string; smsState: string }>("mark_sms", input);
}
