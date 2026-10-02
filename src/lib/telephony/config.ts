export type TelephonyRuntimeConfig = {
  provider: "twilio";
  twilioAccountSid: string | null;
  twilioAuthToken: string | null;
  twilioPhoneNumber: string | null;
  smsLive: boolean;
  smsCooldownMinutes: number;
  dialTimeoutSeconds: number;
  defaultCountryCode: string;
};

function boundedInteger(raw: string | undefined, fallback: number, min: number, max: number) {
  const value = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(value) && value >= min && value <= max ? value : fallback;
}

export function getTelephonyRuntimeConfig(): TelephonyRuntimeConfig {
  const provider = process.env.TELEPHONY_PROVIDER?.trim().toLowerCase() || "twilio";
  if (provider !== "twilio") {
    throw new Error("unsupported_telephony_provider");
  }

  return {
    provider: "twilio",
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID?.trim() || null,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN?.trim() || null,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER?.trim() || null,
    smsLive: process.env.TELEPHONY_SMS_LIVE?.trim().toLowerCase() === "true",
    smsCooldownMinutes: boundedInteger(process.env.TELEPHONY_SMS_COOLDOWN_MINUTES, 60, 1, 1440),
    dialTimeoutSeconds: boundedInteger(process.env.TELEPHONY_DIAL_TIMEOUT_SECONDS, 25, 5, 120),
    defaultCountryCode: process.env.TELEPHONY_DEFAULT_COUNTRY_CODE?.trim() || "+33",
  };
}
