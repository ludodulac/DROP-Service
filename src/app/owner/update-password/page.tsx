"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 3 18 18" />
      <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
      <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c6.5 0 10 8 10 8a17.7 17.7 0 0 1-2.1 3.2" />
      <path d="M6.6 6.6C3.7 8.6 2 12 2 12s3.5 8 10 8a9.8 9.8 0 0 0 4.3-1" />
    </svg>
  );
}

export default function OwnerUpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let recoveryDetected = false;

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        recoveryDetected = true;
        setCanReset(true);
        setChecking(false);
      }
    });

    const timer = window.setTimeout(() => {
      if (!recoveryDetected) {
        setCanReset(false);
        setChecking(false);
      }
    }, 1800);

    return () => {
      window.clearTimeout(timer);
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError("Impossible de modifier le mot de passe. Le lien a peut-être expiré : demandez un nouveau lien.");
      setLoading(false);
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
    if (signOutError) {
      setError("Le mot de passe a été modifié, mais la session n’a pas pu être fermée proprement. Fermez cette page puis revenez à l’accès propriétaire.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    window.setTimeout(() => window.location.replace("/owner/login"), 1400);
  }

  return (
    <main style={{ padding: "56px 0 72px" }}>
      <section className="card auth-card" style={{ maxWidth: 480, margin: "0 auto" }}>
        <div>
          <p className="eyebrow">Administration BRIF</p>
          <h1 style={{ marginTop: 6, marginBottom: 8, fontSize: "clamp(30px, 5vw, 38px)" }}>Nouveau mot de passe</h1>
          <p className="muted" style={{ marginTop: 0 }}>Choisissez un nouveau mot de passe pour l’accès propriétaire.</p>
        </div>

        {checking ? (
          <p className="muted">Vérification du lien de récupération…</p>
        ) : !canReset ? (
          <div>
            <p className="alert-error" role="alert">Ce lien de récupération n’est plus valide ou a expiré.</p>
            <p style={{ marginBottom: 0 }}>
              <Link className="text-link" href="/owner/forgot-password">Demander un nouveau lien</Link>
            </p>
          </div>
        ) : success ? (
          <div className="alert-success" role="status">
            Mot de passe modifié. Retour à l’accès propriétaire…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form-grid">
            <label className="field-label">Nouveau mot de passe
              <span style={{ position: "relative", display: "block" }}>
                <input
                  className="field"
                  style={{ paddingRight: 48 }}
                  required
                  minLength={8}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: 0, background: "transparent", padding: 6, color: "#667085", cursor: "pointer", display: "grid", placeItems: "center" }}
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </span>
            </label>
            <label className="field-label">Confirmer le nouveau mot de passe
              <input
                className="field"
                required
                minLength={8}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
              />
            </label>

            {error && <p className="alert-error" role="alert">{error}</p>}
            <button className="button" type="submit" disabled={loading}>
              {loading ? "Modification…" : "Enregistrer le nouveau mot de passe"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
