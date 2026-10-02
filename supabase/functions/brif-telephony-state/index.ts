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

async function verifyVercelOidc(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!token) return false;

  let issuer = "";
  try {
    const decoded = decodeJwt(token);
    issuer = typeof decoded.iss === "string" ? decoded.iss : "";
  } catch {
    return false;
  }
  if (!ALLOWED_ISSUERS.has(issuer)) return false;

  try {
    const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks`));
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience: AUDIENCE,
      subject: SUBJECT,
    });

    return (
      payload.owner === TEAM_SLUG &&
      payload.owner_id === TEAM_ID &&
      payload.project === PROJECT_NAME &&
      payload.project_id === PROJECT_ID &&
      payload.environment === "production"
    );
  } catch {
    return false;
  }
}

function firstRow(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "not_found" }, 404);
  if (!(await verifyVercelOidc(request))) return json({ error: "unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "server_not_configured" }, 503);

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return json({ error: "invalid_request" }, 400);
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_request" }, 400);
  }

  const action = typeof body.action === "string" ? body.action : "";
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (action === "register_incoming") {
    const { data, error } = await supabase.rpc("drop_service_telephony_register_incoming", {
      p_provider: body.provider,
      p_provider_call_sid: body.providerCallSid,
      p_slug: body.slug,
      p_caller_phone: body.callerPhone,
      p_provider_number: body.providerNumber,
    });
    const row = firstRow(data) as Record<string, unknown> | undefined;
    if (error || !row) return json({ error: "register_incoming_failed" }, 422);
    return json({
      callId: row.call_id,
      artisanId: row.artisan_id,
      artisanSlug: row.artisan_slug,
      artisanPhone: row.artisan_phone,
    }, 200);
  }

  if (action === "complete_call") {
    const { data, error } = await supabase.rpc("drop_service_telephony_complete_call", {
      p_provider: body.provider,
      p_provider_call_sid: body.providerCallSid,
      p_provider_dial_call_sid: body.providerDialCallSid,
      p_outcome: body.outcome,
      p_reason: body.reason,
      p_provider_status: body.providerStatus,
      p_sms_link: body.smsLink,
      p_sms_cooldown_minutes: body.smsCooldownMinutes,
    });
    const row = firstRow(data) as Record<string, unknown> | undefined;
    if (error || !row) return json({ error: "complete_call_failed" }, 422);
    return json({
      callId: row.call_id,
      smsState: row.sms_state,
      callerPhone: row.caller_phone,
    }, 200);
  }

  if (action === "mark_sms") {
    const { data, error } = await supabase.rpc("drop_service_telephony_mark_sms", {
      p_provider: body.provider,
      p_provider_call_sid: body.providerCallSid,
      p_sms_state: body.smsState,
      p_provider_message_id: body.providerMessageId ?? null,
    });
    const row = firstRow(data) as Record<string, unknown> | undefined;
    if (error || !row) return json({ error: "mark_sms_failed" }, 422);
    return json({ callId: row.call_id, smsState: row.sms_state }, 200);
  }

  return json({ error: "unsupported_action" }, 400);
});
