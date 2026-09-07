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
      setError(signUpError.message);
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
    <main style={{ padding: "48px 0" }}>
      <section className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <p className="muted" style={{ marginTop: 0 }}>Espace artisan</p>
        <h1>Créer mon compte</h1>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          <label>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={fieldStyle} /></label>
          <label>Mot de passe<input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={fieldStyle} /></label>
          {error && <p style={{ margin: 0, color: "#b42318" }}>{error}</p>}
          {message && <p style={{ margin: 0, color: "#067647" }}>{message}</p>}
          <button className="button" type="submit" disabled={loading}>{loading ? "Création…" : "Créer mon compte"}</button>
        </form>
        <p className="muted" style={{ marginBottom: 0, marginTop: 18 }}>Déjà inscrit ? <Link href="/login">Se connecter</Link></p>
      </section>
    </main>
  );
}

const fieldStyle = { display: "block", width: "100%", marginTop: 8, padding: 12, border: "1px solid #d0d5dd", borderRadius: 10, background: "white" } as const;
