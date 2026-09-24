"use client";

import { useState } from "react";

type DiagnosticResult =
  | { status: "idle" }
  | { status: "running" }
  | { status: "success"; ready: true; interval: "month" }
  | { status: "error"; code: string };

const allowedErrors = new Set([
  "not_authenticated",
  "invalid_interval",
  "artisan_not_found",
  "artisan_inactive",
  "stripe_test_not_configured",
  "artisan_lookup_failed",
  "invalid_request",
]);

export default function StripeTestDiagnosticPage() {
  const [result, setResult] = useState<DiagnosticResult>({ status: "idle" });

  async function runDiagnostic() {
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
        "ready" in payload &&
        payload.ready === true &&
        "interval" in payload &&
        payload.interval === "month"
      ) {
        setResult({ status: "success", ready: true, interval: "month" });
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

  return (
    <main style={{ maxWidth: 560, margin: "48px auto", padding: "0 20px", fontFamily: "system-ui" }}>
      <h1>DIAGNOSTIC STRIPE TEST</h1>
      <p>Contrôle temporaire de la configuration serveur du Preview. Aucun paiement n’est déclenché.</p>
      <button type="button" onClick={runDiagnostic} disabled={result.status === "running"}>
        {result.status === "running" ? "Diagnostic en cours…" : "Tester la configuration TEST"}
      </button>
      <div role="status" aria-live="polite" style={{ marginTop: 20 }}>
        {result.status === "success" && <p>ready: true<br />interval: month</p>}
        {result.status === "error" && <p>{result.code}</p>}
      </div>
    </main>
  );
}
