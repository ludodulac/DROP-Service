import "server-only";

import { getTelephonyRuntimeConfig } from "./config";
import { TwilioTelephonyAdapter } from "./twilio";
import type { TelephonyProviderAdapter } from "./types";

export function getTelephonyProvider(): {
  adapter: TelephonyProviderAdapter;
  config: ReturnType<typeof getTelephonyRuntimeConfig>;
} {
  const config = getTelephonyRuntimeConfig();

  return {
    config,
    adapter: new TwilioTelephonyAdapter(
      config.twilioAccountSid,
      config.twilioAuthToken,
      config.twilioPhoneNumber,
    ),
  };
}
