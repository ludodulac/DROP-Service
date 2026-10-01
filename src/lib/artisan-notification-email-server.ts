import "server-only";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://nczdadkyysrxxcsnsrrn.supabase.co";

export async function resolveArtisanAuthEmail(
  oidcToken: string | null,
  artisanId: string,
) {
  if (!oidcToken) {
    throw new Error("vercel_oidc_token_missing");
  }

  const response = await fetch(
    `${supabaseUrl}/functions/v1/brif-artisan-notification-email`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${oidcToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ artisanId }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`artisan_auth_email_resolver_failed_${response.status}`);
  }

  const payload: unknown = await response.json();
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("email" in payload) ||
    typeof (payload as { email?: unknown }).email !== "string" ||
    !(payload as { email: string }).email.includes("@")
  ) {
    throw new Error("artisan_auth_email_missing");
  }

  return (payload as { email: string }).email;
}
