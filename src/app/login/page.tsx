"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
              <input className="field" required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {error && <p className="alert-error" role="alert">{error}</p>}
            <button className="button" type="submit" disabled={loading}>{loading ? "Connexion en cours…" : "Accéder à mon espace"}</button>
          </form>
          <p className="muted" style={{ marginBottom: 0, marginTop: 18, fontSize: 14 }}>Pas encore de compte ? <Link className="text-link" href="/signup">Créer mon espace artisan</Link></p>
        </section>
      </div>
    </main>
  );
}
