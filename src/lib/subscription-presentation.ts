export const subscriptionStatusLabels = {
  inactive: "Inactif",
  trialing: "Période d’essai",
  active: "Actif",
  past_due: "Paiement à régulariser",
  canceled: "Résilié",
  unpaid: "Paiement impayé",
  incomplete: "Activation incomplète",
  incomplete_expired: "Activation expirée",
  paused: "En pause",
} as const;

export type SubscriptionStatus = keyof typeof subscriptionStatusLabels;
export type BillingInterval = "month" | "year";

export type SubscriptionDisplayInput = {
  status: SubscriptionStatus;
  billing_interval: BillingInterval | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export function getBillingLabel(interval: BillingInterval | null) {
  if (interval === "month") return "Mensuel";
  if (interval === "year") return "Annuel";
  return null;
}

export function getSubscriptionPeriodLabel(subscription: SubscriptionDisplayInput) {
  if (!subscription.current_period_end) return null;

  const date = new Date(subscription.current_period_end).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (subscription.cancel_at_period_end) {
    return `Fin de l’abonnement prévue le ${date}`;
  }

  if (subscription.status === "active") {
    return `Prochain renouvellement : ${date}`;
  }

  return `Fin de période : ${date}`;
}
