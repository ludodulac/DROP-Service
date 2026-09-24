"use client";

import { useState } from "react";

type CheckoutState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "error"; code: string };

const allowedErrors = new Set([
  "not_authenticated",
  "invalid_interval",
  "artisan_not_found",
  "artisan_inactive",
  "stripe_test_not_configured",
  "artisan_lookup_failed",
  "invalid_request",
  "invalid_checkout_origin",
  "checkout_url_unavailable",
  "checkout_session_failed",
]);

export default function StripeTestDiagnosticPage() {
  const [result, setResult] = useState<CheckoutState>({ status: "idle" });

  async function startSandboxCheckout() {
    setResult({ status: "running" });

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval: "month" }),
      });
      const payload: unknown = await response.json();

      if (
        response.ok &&
        typeof payload === "object" &&
        payload !== null &&
        "url" in payload &&
        typeof payload.url === "string" &&
        payload.url.startsWith("https://checkout.stripe.com/")
      ) {
        window.location.assign(payload.url);
        return;
      }

      const code =
        typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof payload.error === "string" &&
        allowedErrors.has(payload.error)
          ? payload.error
          : "diagnostic_failed";

      setResult({ status: "error", code });
    } catch {
      setResult({ status: "error", code: "diagnostic_failed" });
    }
  }

  const checkoutReturn =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("checkout")
      : null;

  return (
    <main style={{ maxWidth: 560, margin: "48px auto", padding: "0 20px", fontFamily: "system-ui" }}>
      <h1>DIAGNOSTIC STRIPE TEST</h1>
      <p>TEST / SANDBOX uniquement. Aucun paiement réel.</p>
      {checkoutReturn === "success" && (
        <p>Retour Checkout TEST reçu. Ce retour ne prouve pas qu’un abonnement est actif.</p>
      )}
      {checkoutReturn === "cancelled" && <p>Checkout TEST annulé.</p>}
      <button type="button" onClick={startSandboxCheckout} disabled={result.status === "running"}>
        {result.status === "running"
          ? "Ouverture du Checkout TEST…"
          : "TEST / SANDBOX — ABONNEMENT TEST MENSUEL — 39 €"}
      </button>
      <div role="status" aria-live="polite" style={{ marginTop: 20 }}>
        {result.status === "error" && <p>{result.code}</p>}
      </div>
    </main>
  );
}
