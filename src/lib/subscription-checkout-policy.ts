export const checkoutAllowedSubscriptionStatuses = [
  "inactive",
  "canceled",
  "incomplete_expired",
] as const;

export const checkoutBlockedSubscriptionStatuses = [
  "trialing",
  "active",
  "past_due",
  "unpaid",
  "paused",
  "incomplete",
] as const;

export function canStartSubscriptionCheckout(status: unknown): boolean {
  if (status === null || status === undefined) return true;
  return (checkoutAllowedSubscriptionStatuses as readonly unknown[]).includes(status);
}
