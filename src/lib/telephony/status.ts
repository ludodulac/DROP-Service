import type { NormalizedDialResult } from "./types";

export function normalizeTwilioDialStatus(rawStatus: string): NormalizedDialResult {
  const normalized = rawStatus.trim().toLowerCase();

  if (normalized === "completed" || normalized === "answered") {
    return {
      status: "ANSWERED",
      reason: "COMPLETED",
      providerStatus: normalized,
    };
  }

  if (normalized === "no-answer") {
    return {
      status: "MISSED",
      reason: "NO_ANSWER",
      providerStatus: normalized,
    };
  }

  if (normalized === "busy") {
    return {
      status: "MISSED",
      reason: "BUSY",
      providerStatus: normalized,
    };
  }

  if (normalized === "failed") {
    return {
      status: "FAILED",
      reason: "PROVIDER_FAILED",
      providerStatus: normalized,
    };
  }

  if (normalized === "canceled") {
    return {
      status: "CANCELED",
      reason: "CANCELED",
      providerStatus: normalized,
    };
  }

  return {
    status: "FAILED",
    reason: "UNKNOWN",
    providerStatus: normalized || "unknown",
  };
}
