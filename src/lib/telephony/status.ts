import type { NormalizedDialResult } from "./types";

export function normalizeTwilioDialStatus(rawStatus: string): NormalizedDialResult {
  const normalized = rawStatus.trim().toLowerCase();

  if (normalized === "completed" || normalized === "answered") {
    return { outcome: "ANSWERED", reason: "COMPLETED", providerStatus: normalized };
  }

  if (normalized === "no-answer") {
    return { outcome: "MISSED", reason: "NO_ANSWER", providerStatus: normalized };
  }

  if (normalized === "busy") {
    return { outcome: "MISSED", reason: "BUSY", providerStatus: normalized };
  }

  if (normalized === "canceled") {
    return { outcome: "FAILED", reason: "CANCELED", providerStatus: normalized };
  }

  if (normalized === "failed") {
    return { outcome: "FAILED", reason: "PROVIDER_FAILED", providerStatus: normalized };
  }

  return { outcome: "FAILED", reason: "UNKNOWN", providerStatus: normalized || "unknown" };
}
