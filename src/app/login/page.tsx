"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("Connexion impossible. Vérifiez votre adresse email et votre mot de passe.");
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <main style={{ padding: "56px 0 72px" }}>
      <div className="auth-shell">
        <section className="auth-intro">
          <div className="brand-lockup"><span className="brand-mark">L</span><span>Ludovic Dulac</span></div>
          <p className="eyebrow">Espace artisan</p>
          <h1 style={{ marginBottom: 14 }}>Retrouvez vos demandes sans perdre de temps.</h1>
          <p className="muted" style={{ maxWidth: 520, margin: 0 }}>Consultez les demandes clients, repérez les urgences et suivez les dossiers jusqu'au devis et au chantier gagné.</p>
          <div className="auth-proof">
            <span>Demandes centralisées</span>
            <span>Priorités visibles</span>
            <span>Suivi simple</span>
          </div>
        </section>

        <section className="card auth-card">
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>Se connecter</h2>
            <p className="muted" style={{ marginTop: 0 }}>Accédez à votre espace de suivi.</p>
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <label className="field-label">Adresse email
              <input className="field" required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@entreprise.fr" />
            </label>
            <label className="field-label">Mot de passe
              <span style={{ position: "relative", display: "block" }}>
                <input className="field" style={{ paddingRight: 48 }} required type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
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
            <div style={{ marginTop: -4 }}>
              <Link className="text-link" href="/forgot-password" style={{ fontSize: 14 }}>Mot de passe oublié ?</Link>
            </div>
            {error && <p className="alert-error" role="alert">{error}</p>}
            <button className="button" type="submit" disabled={loading}>{loading ? "Connexion en cours…" : "Accéder à mon espace"}</button>
          </form>
          <p className="muted" style={{ marginBottom: 0, marginTop: 18, fontSize: 14 }}>Pas encore de compte ? <Link className="text-link" href="/signup">Créer mon espace artisan</Link></p>
        </section>
      </div>
    </main>
  );
}
