import Stripe from "stripe";

export const runtime = "nodejs";

function response(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status });
}

function logPingError(category: string, code?: string) {
  console.error("[stripe_ping_error]", {
    category,
    ...(code ? { code } : {}),
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    logPingError("missing_signature");
    return response({ error: "missing_signature" }, 400);
  }

  const webhookSecret = process.env.STRIPE_TEST_PING_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logPingError("server_not_configured");
    return response({ error: "server_not_configured" }, 503);
  }

  const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY ?? "sk_test_not_configured");

  let notification: Stripe.V2.Core.EventNotification;
  try {
    notification = stripe.parseEventNotification(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch (error: unknown) {
    const code =
      error instanceof Error &&
      typeof (error as Error & { code?: unknown }).code === "string"
        ? String((error as Error & { code?: unknown }).code)
        : undefined;
    logPingError("invalid_event", code);
    return response({ error: "invalid_event" }, 400);
  }

  if (notification.type === "v2.core.event_destination.ping") {
    return response({ received: true, result: "ping" }, 200);
  }

  return response({ received: true, result: "ignored" }, 200);
}
