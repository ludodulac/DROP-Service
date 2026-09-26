import "server-only";

import Stripe from "stripe";

export type StripeEnvironment = "test" | "live";
export type StripeInterval = "month" | "year";

export type StripeServerConfig = {
  environment: StripeEnvironment;
  expectedLivemode: boolean;
  secretKey: string;
  monthlyPrice: string;
  yearlyPrice: string;
  webhookSecret: string;
  portalConfigurationId: string;
  canonicalHost: string;
};

const PREVIEW_HOST = "brif-artisans-git-test-stripe-sandbox-checkout-ludo24.vercel.app";
const PRODUCTION_HOST = "drop-service-swart.vercel.app";
const TEST_PORTAL_CONFIGURATION_ID = "bpc_1UJvhB3kIID3Yaiqsgvjgcla";

export function getStripeEnvironment(vercelEnv = process.env.VERCEL_ENV): StripeEnvironment | null {
  if (vercelEnv === "preview") return "test";
  if (vercelEnv === "production") return "live";
  return null;
}

export function getStripeServerConfig(): StripeServerConfig | null {
  const environment = getStripeEnvironment();
  if (!environment) return null;

  if (environment === "test") {
    const secretKey = process.env.STRIPE_TEST_SECRET_KEY;
    const monthlyPrice = process.env.STRIPE_TEST_PRICE_MONTHLY;
    const yearlyPrice = process.env.STRIPE_TEST_PRICE_YEARLY;
    const webhookSecret = process.env.STRIPE_TEST_WEBHOOK_SECRET;
    if (!secretKey || !monthlyPrice || !yearlyPrice || !webhookSecret) return null;
    return { environment, expectedLivemode: false, secretKey, monthlyPrice, yearlyPrice, webhookSecret, portalConfigurationId: TEST_PORTAL_CONFIGURATION_ID, canonicalHost: PREVIEW_HOST };
  }

  const secretKey = process.env.STRIPE_LIVE_SECRET_KEY;
  const monthlyPrice = process.env.STRIPE_LIVE_PRICE_MONTHLY;
  const yearlyPrice = process.env.STRIPE_LIVE_PRICE_YEARLY;
  const webhookSecret = process.env.STRIPE_LIVE_WEBHOOK_SECRET;
  const portalConfigurationId = process.env.STRIPE_LIVE_PORTAL_CONFIGURATION_ID;
  if (!secretKey || !monthlyPrice || !yearlyPrice || !webhookSecret || !portalConfigurationId) return null;
  return { environment, expectedLivemode: true, secretKey, monthlyPrice, yearlyPrice, webhookSecret, portalConfigurationId, canonicalHost: PRODUCTION_HOST };
}

export function getStripePrice(config: StripeServerConfig, interval: StripeInterval) {
  return interval === "month" ? config.monthlyPrice : config.yearlyPrice;
}

export function createStripeClient(secretKey: string) {
  return new Stripe(secretKey);
}

export function trustedStripeOrigin(request: Request, config: StripeServerConfig) {
  const origin = new URL(request.url).origin;
  return new URL(origin).host === config.canonicalHost ? origin : null;
}
