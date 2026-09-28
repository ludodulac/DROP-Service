import { NextResponse } from "next/server";
import { createPrivilegedSupabaseClient } from "@/lib/supabase-privileged-server";

export const dynamic = "force-dynamic";

function noStore(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

function requiredString(
  body: Record<string, unknown>,
  key: string,
  minLength: number,
  maxLength: number,
) {
  const raw = body[key];
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (value.length < minLength || value.length > maxLength) return null;
  return value;
}

function optionalString(body: Record<string, unknown>, key: string) {
  const raw = body[key];
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string") return undefined;
  return raw.trim() || null;
}

export async function POST(request: Request) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return noStore({ error: "invalid_request" }, 400);
  }

  if (typeof rawBody !== "object" || rawBody === null || Array.isArray(rawBody)) {
    return noStore({ error: "invalid_request" }, 400);
  }

  const body = rawBody as Record<string, unknown>;
  const slug = requiredString(body, "slug", 2, 80);
  const customerName = requiredString(body, "customerName", 2, 120);
  const phone = requiredString(body, "customerPhone", 6, 40);
  const city = requiredString(body, "city", 1, 120);
  const category = requiredString(body, "category", 1, 120);
  const description = requiredString(body, "description", 5, 4000);
  const urgency = body.urgency;
  const email = optionalString(body, "customerEmail");
  const availability = optionalString(body, "availability");

  if (
    !slug ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    !customerName ||
    !phone ||
    !city ||
    !category ||
    !description ||
    (urgency !== "low" && urgency !== "normal" && urgency !== "urgent") ||
    email === undefined ||
    availability === undefined
  ) {
    return noStore({ error: "invalid_request" }, 400);
  }

  const supabase = createPrivilegedSupabaseClient();
  if (!supabase) {
    return noStore({ error: "server_not_configured" }, 503);
  }

  const { data: artisan, error: artisanError } = await supabase
    .from("drop_service_artisans")
    .select("id, email, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (artisanError) {
    return noStore({ error: "artisan_lookup_failed" }, 500);
  }

  if (!artisan) {
    return noStore({ error: "artisan_not_found" }, 404);
  }

  if (!artisan.is_active) {
    return noStore({ error: "artisan_inactive" }, 403);
  }

  const requestContext = {
    requestId: crypto.randomUUID(),
    artisanId: artisan.id,
    artisanEmail: artisan.email,
  };

  const { error: insertError } = await supabase.from("drop_service_requests").insert({
    id: requestContext.requestId,
    artisan_id: requestContext.artisanId,
    customer_name: customerName,
    phone,
    email,
    city,
    category,
    urgency,
    description,
    availability,
    status: "new",
  });

  if (insertError) {
    console.error("request_create_failed", {
      code: insertError.code,
      message: insertError.message,
    });
    return noStore({ error: "request_create_failed" }, 500);
  }

  // Notification context intentionally remains server-side for the next mission.
  // In particular, requestContext.artisanEmail must never be returned to the browser.
  return noStore({ requestId: requestContext.requestId }, 201);
}
