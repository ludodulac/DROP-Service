import "server-only";

import Stripe from "stripe";

export type StripeTestInterval = "month" | "year";

export function getStripeTestConfig(interval: StripeTestInterval) {
  const secretKey = process.env.STRIPE_TEST_SECRET_KEY;
  const monthlyPrice = process.env.STRIPE_TEST_PRICE_MONTHLY;
  const yearlyPrice = process.env.STRIPE_TEST_PRICE_YEARLY;

  if (!secretKey || !monthlyPrice || !yearlyPrice) {
    return null;
  }

  return {
    secretKey,
    priceId: interval === "month" ? monthlyPrice : yearlyPrice,
  };
}

export function createStripeTestClient(secretKey: string) {
  return new Stripe(secretKey);
}
