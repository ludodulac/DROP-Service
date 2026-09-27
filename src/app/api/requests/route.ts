import { createPrivilegedSupabaseClient } from "@/lib/supabase-privileged-server";

export const runtime = "nodejs";

const URGENCIES = new Set(["low", "normal", "urgent"]);

type RequestPayload = {
  artisanId?: unknown;
  customerName?: unknown;
  customerPhone?: unknown;
  customerEmail?: unknown;
  city?: unknown;
  category?: unknown;
  urgency?: unknown;
  description?: unknown;
  availability?: unknown;
};

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const supabase = createPrivilegedSupabaseClient();
  if (!supabase) return Response.json({ error: "server_not_configured" }, { status: 503 });

  let payload: RequestPayload;
  try {
    payload = (await request.json()) as RequestPayload;
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const artisanId = text(payload.artisanId, 80);
  const customerName = text(payload.customerName, 120);
  const phone = text(payload.customerPhone, 80);
  const customerEmail = text(payload.customerEmail, 254) || null;
  const city = text(payload.city, 120);
  const category = text(payload.category, 120);
  const urgency = text(payload.urgency, 20);
  const description = text(payload.description, 5000);
  const availability = text(payload.availability, 500) || null;

  if (
    !artisanId ||
    customerName.length < 2 ||
    phone.length < 6 ||
    !city ||
    !category ||
    description.length < 5 ||
    !URGENCIES.has(urgency)
  ) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const { data: artisan, error: artisanError } = await supabase
    .from("drop_service_artisans")
    .select("id, email, is_active")
    .eq("id", artisanId)
    .maybeSingle();

  if (artisanError) return Response.json({ error: "artisan_lookup_failed" }, { status: 500 });
  if (!artisan || artisan.is_active !== true) {
    return Response.json({ error: "artisan_not_found" }, { status: 404 });
  }

  const requestId = crypto.randomUUID();
  const { error: insertError } = await supabase.from("drop_service_requests").insert({
    id: requestId,
    artisan_id: artisan.id,
    customer_name: customerName,
    phone,
    email: customerEmail,
    city,
    category,
    urgency,
    description,
    availability,
    status: "new",
  });

  if (insertError) return Response.json({ error: "request_creation_failed" }, { status: 500 });

  // Server-only notification context for the next mission.
  // Never include artisan.email in the browser response.
  const notificationContext = {
    request_id: requestId,
    artisan_id: artisan.id,
    artisan_email: artisan.email,
  };
  void notificationContext;

  return Response.json({ request_id: requestId }, { status: 201 });
}
