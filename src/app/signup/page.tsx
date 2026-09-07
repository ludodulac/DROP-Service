"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError("Impossible de créer le compte pour le moment. Vérifiez vos informations puis réessayez.");
      setLoading(false);
      return;
    }

    if (data.session) {
      router.replace("/onboarding");
      return;
    }

    setMessage("Compte créé. Vérifiez votre boîte email pour confirmer votre inscription, puis revenez vous connecter.");
    setLoading(false);
  }

  return (
    <main style={{ padding: "56px 0 72px" }}>
      <div className="auth-shell">
        <section className="auth-intro">
          <div className="brand-lockup"><span className="brand-mark">L</span><span>Ludovic Dulac</span></div>
          <p className="eyebrow">Espace artisan</p>
          <h1 style={{ marginBottom: 14 }}>Mettez vos demandes clients au même endroit.</h1>
          <p className="muted" style={{ maxWidth: 520, margin: 0 }}>Créez votre espace, personnalisez votre page de demande et commencez à recevoir des informations plus complètes avant de rappeler vos clients.</p>
          <div className="auth-proof">
            <span>Installation rapide</span>
            <span>Sans jargon technique</span>
            <span>Pensé pour le terrain</span>
          </div>
        </section>

        <section className="card auth-card">
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>Créer mon espace</h2>
            <p className="muted" style={{ marginTop: 0 }}>Une adresse email et un mot de passe suffisent pour démarrer.</p>
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <label className="field-label">Adresse email
              <input className="field" required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@entreprise.fr" />
            </label>
            <label className="field-label">Mot de passe
              <input className="field" required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <span className="field-help">8 caractères minimum.</span>
            </label>
            {error && <p className="alert-error" role="alert">{error}</p>}
            {message && <div className="alert-success" role="status">{message}</div>}
            <button className="button" type="submit" disabled={loading}>{loading ? "Création de l'espace…" : "Créer mon espace artisan"}</button>
          </form>
          <p className="muted" style={{ marginBottom: 0, marginTop: 18, fontSize: 14 }}>Déjà inscrit ? <Link className="text-link" href="/login">Me connecter</Link></p>
        </section>
      </div>
    </main>
  );
}
