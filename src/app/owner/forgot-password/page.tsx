"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function OwnerForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const redirectTo = "https://brif-artisans.vercel.app/owner/update-password";
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (resetError) {
      const message =
        resetError.code === "over_email_send_rate_limit"
          ? "Un lien vient peut-être déjà d’être envoyé. Patientez environ une minute avant d’en demander un nouveau."
          : "La demande n’a pas pu être envoyée pour le moment. Réessayez dans quelques instants.";
      setError(message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <main style={{ padding: "56px 0 72px" }}>
      <section className="card auth-card" style={{ maxWidth: 480, margin: "0 auto" }}>
        <div>
          <p className="eyebrow">Administration BRIF</p>
          <h1 style={{ marginTop: 6, marginBottom: 8, fontSize: "clamp(30px, 5vw, 38px)" }}>Mot de passe oublié</h1>
          <p className="muted" style={{ marginTop: 0 }}>Indiquez l’adresse email utilisée pour l’accès propriétaire.</p>
        </div>

        {sent ? (
          <div>
            <div className="alert-success" role="status">
              Si cette adresse correspond à un compte, un email de récupération a été envoyé. Vérifiez aussi les courriers indésirables.
            </div>
            <p className="muted" style={{ marginBottom: 0, marginTop: 18, fontSize: 14 }}>
              <Link className="text-link" href="/owner/login">Retour à l’accès propriétaire</Link>
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="form-grid">
              <label className="field-label">Adresse email
                <input
                  className="field"
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              {error && <p className="alert-error" role="alert">{error}</p>}
              <button className="button" type="submit" disabled={loading}>
                {loading ? "Envoi en cours…" : "Recevoir le lien de récupération"}
              </button>
            </form>
            <p className="muted" style={{ marginBottom: 0, marginTop: 18, fontSize: 14 }}>
              <Link className="text-link" href="/owner/login">Retour à l’accès propriétaire</Link>
            </p>
          </>
        )}
      </section>
    </main>
  );
}
