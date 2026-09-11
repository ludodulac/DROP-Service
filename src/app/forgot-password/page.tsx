"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const redirectTo = `${window.location.origin}/update-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (resetError) {
      setError("Impossible d'envoyer l'email pour le moment. Réessayez dans quelques instants.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <main style={{ padding: "56px 0 72px" }}>
      <div className="auth-shell">
        <section className="auth-intro">
          <div className="brand-lockup"><span className="brand-mark">L</span><span>Ludovic Dulac</span></div>
          <p className="eyebrow">Accès à votre espace</p>
          <h1 style={{ marginBottom: 14 }}>Retrouvez l'accès à votre compte.</h1>
          <p className="muted" style={{ maxWidth: 520, margin: 0 }}>Indiquez l'adresse email utilisée pour votre espace artisan. Nous vous enverrons un lien sécurisé pour choisir un nouveau mot de passe.</p>
        </section>

        <section className="card auth-card">
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>Mot de passe oublié</h2>
            <p className="muted" style={{ marginTop: 0 }}>Vous recevrez un email si cette adresse correspond à un compte.</p>
          </div>

          {sent ? (
            <div>
              <div className="alert-success" role="status">Si un compte existe avec cette adresse, un email de réinitialisation vient d'être envoyé. Pensez à vérifier les courriers indésirables.</div>
              <p className="muted" style={{ marginBottom: 0, marginTop: 18, fontSize: 14 }}><Link className="text-link" href="/login">Retour à la connexion</Link></p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="form-grid">
              <label className="field-label">Adresse email
                <input className="field" required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@entreprise.fr" />
              </label>
              {error && <p className="alert-error" role="alert">{error}</p>}
              <button className="button" type="submit" disabled={loading}>{loading ? "Envoi en cours…" : "Recevoir le lien de réinitialisation"}</button>
            </form>
          )}

          {!sent && <p className="muted" style={{ marginBottom: 0, marginTop: 18, fontSize: 14 }}><Link className="text-link" href="/login">Retour à la connexion</Link></p>}
        </section>
      </div>
    </main>
  );
}
