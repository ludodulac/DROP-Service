import "server-only";

import { createPrivilegedSupabaseClient } from "@/lib/supabase-privileged-server";
import type {
  TelephonyCallReason,
  TelephonyCallStatus,
  TelephonySmsStatus,
} from "./types";

function firstRow<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return (value as T | null) ?? null;
}

async function callTelephonyRpc<T>(
  functionName: string,
  args: Record<string, unknown>,
) {
  const supabase = createPrivilegedSupabaseClient();
  if (!supabase) {
    throw new Error("telephony_database_not_configured");
  }

  const { data, error } = await supabase.rpc(functionName, args);
  if (error) {
    throw new Error("telephony_database_operation_failed");
  }

  const row = firstRow<T>(data);
  if (!row) {
    throw new Error("telephony_database_result_missing");
  }

  return row;
}

type IncomingCallRow = {
  call_id: string;
  artisan_id: string;
  artisan_slug: string;
  destination_phone: string;
};

export async function registerIncomingCall(input: {
  provider: string;
  providerCallId: string;
  artisanSlug: string;
  callerPhone: string | null;
  calledPhone: string;
  smsLink: string;
}) {
  const row = await callTelephonyRpc<IncomingCallRow>(
    "drop_service_telephony_register_incoming",
    {
      p_provider: input.provider,
      p_provider_call_id: input.providerCallId,
      p_artisan_slug: input.artisanSlug,
      p_caller_phone: input.callerPhone,
      p_called_phone: input.calledPhone,
      p_sms_link: input.smsLink,
    },
  );

  return {
    callId: row.call_id,
    artisanId: row.artisan_id,
    artisanSlug: row.artisan_slug,
    destinationPhone: row.destination_phone,
  };
}

type CompleteCallRow = {
  call_id: string;
  call_status: TelephonyCallStatus;
  sms_status: TelephonySmsStatus;
  caller_phone: string | null;
  sms_link: string | null;
};

export async function completeTelephonyCall(input: {
  provider: string;
  providerCallId: string;
  providerLegCallId: string | null;
  callStatus: Exclude<TelephonyCallStatus, "PENDING">;
  callReason: Exclude<TelephonyCallReason, "PENDING">;
  providerStatus: string;
  smsCooldownMinutes: number;
}) {
  const row = await callTelephonyRpc<CompleteCallRow>(
    "drop_service_telephony_complete_call",
    {
      p_provider: input.provider,
      p_provider_call_id: input.providerCallId,
      p_provider_leg_call_id: input.providerLegCallId,
      p_call_status: input.callStatus,
      p_call_reason: input.callReason,
      p_provider_status: input.providerStatus,
      p_sms_cooldown_minutes: input.smsCooldownMinutes,
    },
  );

  return {
    callId: row.call_id,
    callStatus: row.call_status,
    smsStatus: row.sms_status,
    callerPhone: row.caller_phone,
    smsLink: row.sms_link,
  };
}

type ClaimSmsRow = {
  call_id: string;
  claimed: boolean;
  caller_phone: string | null;
  sms_link: string | null;
};

export async function claimTelephonySms(input: {
  provider: string;
  providerCallId: string;
}) {
  const row = await callTelephonyRpc<ClaimSmsRow>(
    "drop_service_telephony_claim_sms",
    {
      p_provider: input.provider,
      p_provider_call_id: input.providerCallId,
    },
  );

  return {
    callId: row.call_id,
    claimed: row.claimed,
    callerPhone: row.caller_phone,
    smsLink: row.sms_link,
  };
}

export async function markTelephonySms(input: {
  provider: string;
  providerCallId: string;
  smsStatus: "SENT" | "FAILED";
  providerMessageId?: string;
  errorMessage?: string;
}) {
  return callTelephonyRpc<{ call_id: string; sms_status: TelephonySmsStatus }>(
    "drop_service_telephony_mark_sms",
    {
      p_provider: input.provider,
      p_provider_call_id: input.providerCallId,
      p_sms_status: input.smsStatus,
      p_provider_message_id: input.providerMessageId ?? null,
      p_error_message: input.errorMessage ?? null,
    },
  );
}

export async function recordTelephonyError(input: {
  provider: string;
  providerCallId: string;
  errorMessage: string;
}) {
  return callTelephonyRpc<{ call_id: string }>(
    "drop_service_telephony_record_error",
    {
      p_provider: input.provider,
      p_provider_call_id: input.providerCallId,
      p_error_message: input.errorMessage,
    },
  );
}
