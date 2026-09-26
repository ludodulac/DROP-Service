export const portalAllowedSubscriptionStatuses = [
  "trialing",
  "active",
  "past_due",
  "unpaid",
  "paused",
  "incomplete",
] as const;

export const portalBlockedSubscriptionStatuses = [
  "inactive",
  "canceled",
  "incomplete_expired",
] as const;

export function canManageSubscriptionInPortal(status: unknown): boolean {
  return (portalAllowedSubscriptionStatuses as readonly unknown[]).includes(status);
}
