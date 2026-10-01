import type { NextConfig } from "next";

const isVercelProduction =
  process.env.VERCEL === "1" &&
  process.env.VERCEL_ENV === "production";

if (isVercelProduction) {
  const requiredNotificationConfig = [
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    "VERCEL_OIDC_TOKEN",
  ] as const;

  const missing = requiredNotificationConfig.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `BRIF production notification configuration missing: ${missing.join(", ")}`,
    );
  }
}

const nextConfig: NextConfig = {};

export default nextConfig;
