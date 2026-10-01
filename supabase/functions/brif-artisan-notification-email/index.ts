import { createClient } from "npm:@supabase/supabase-js@2";
import { createRemoteJWKSet, decodeJwt, jwtVerify } from "npm:jose@6";

const TEAM_SLUG = "ludo24";
const TEAM_ID = "team_21vKSHA6yLhiKS5p2wWSujD5";
const PROJECT_NAME = "brif-artisans";
const PROJECT_ID = "prj_OJHqPS0PeRba3YsE52Nqnpdc8e6v";
const AUDIENCE = `https://vercel.com/${TEAM_SLUG}`;
const SUBJECT = `owner:${TEAM_SLUG}:project:${PROJECT_NAME}:environment:production`;
const ALLOWED_ISSUERS = new Set([
  "https://oidc.vercel.com",
  `https://oidc.vercel.com/${TEAM_SLUG}`,
]);

function json(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" },
  });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "not_found" }, 404);

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!token) return json({ error: "unauthorized" }, 401);

  let issuer: string;
  try {
    const decoded = decodeJwt(token);
    issuer = typeof decoded.iss === "string" ? decoded.iss : "";
  } catch {
    return json({ error: "unauthorized" }, 401);
  }

  if (!ALLOWED_ISSUERS.has(issuer)) return json({ error: "unauthorized" }, 401);

  try {
    const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks`));
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience: AUDIENCE,
      subject: SUBJECT,
    });

    if (
      payload.owner !== TEAM_SLUG ||
      payload.owner_id !== TEAM_ID ||
      payload.project !== PROJECT_NAME ||
      payload.project_id !== PROJECT_ID ||
      payload.environment !== "production"
    ) {
      return json({ error: "unauthorized" }, 401);
    }
  } catch {
    return json({ error: "unauthorized" }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_request" }, 400);
  }

  const artisanId =
    typeof body === "object" &&
    body !== null &&
    "artisanId" in body &&
    typeof (body as { artisanId?: unknown }).artisanId === "string"
      ? (body as { artisanId: string }).artisanId
      : "";

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(artisanId)) {
    return json({ error: "invalid_request" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "server_not_configured" }, 503);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: artisan, error: artisanError } = await supabase
    .from("drop_service_artisans")
    .select("user_id")
    .eq("id", artisanId)
    .single();

  if (artisanError || !artisan?.user_id) return json({ error: "artisan_not_found" }, 404);

  const { data: authData, error: authError } = await supabase.auth.admin.getUserById(artisan.user_id);
  const email = authData.user?.email?.trim();

  if (authError || !email) return json({ error: "artisan_email_not_found" }, 404);

  return json({ email }, 200);
});
