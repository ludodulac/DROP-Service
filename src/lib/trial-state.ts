export const TRIAL_DURATION_DAYS = 21;
export const TRIAL_OFFER_THRESHOLD_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export type TrialPhase = "full" | "ending" | "expired";

export type TrialDisplayState = {
  started_at: string;
  ends_at: string;
  phase: TrialPhase;
  days_remaining: number;
};

export function getTrialDisplayState(
  startedAt: string,
  endsAt: string,
  now: Date = new Date(),
): TrialDisplayState {
  const startedMs = new Date(startedAt).getTime();
  const endsMs = new Date(endsAt).getTime();
  const nowMs = now.getTime();

  if (!Number.isFinite(startedMs) || !Number.isFinite(endsMs) || endsMs <= startedMs) {
    throw new Error("invalid_trial_window");
  }

  const remainingMs = endsMs - nowMs;
  if (remainingMs <= 0) {
    return {
      started_at: startedAt,
      ends_at: endsAt,
      phase: "expired",
      days_remaining: 0,
    };
  }

  const daysRemaining = Math.ceil(remainingMs / DAY_MS);
  return {
    started_at: startedAt,
    ends_at: endsAt,
    phase: remainingMs <= TRIAL_OFFER_THRESHOLD_DAYS * DAY_MS ? "ending" : "full",
    days_remaining: daysRemaining,
  };
}
