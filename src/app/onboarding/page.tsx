"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default function OnboardingPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [activity, setActivity] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [phone, setPhone] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void checkAccount();
  }, []);

  async function checkAccount() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.replace("/login");
      return;
    }

    const { data } = await supabase
      .from("drop_service_artisans")
      .select("id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (data) {
      router.replace("/dashboard");
      return;
    }

    setChecking(false);
  }

  function handleCompanyChange(value: string) {
    setCompanyName(value);
    if (!slug || slug === slugify(companyName)) setSlug(slugify(value));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.replace("/login");
      return;
    }

    const cleanSlug = slugify(slug);
    if (cleanSlug.length < 2) {
      setError("Choisissez une adresse publique d’au moins 2 caractères.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("drop_service_artisans").insert({
      user_id: userData.user.id,
      company_name: companyName.trim(),
      activity: activity.trim(),
      service_area: serviceArea.trim() || null,
      phone: phone.trim() || null,
      email: userData.user.email ?? null,
      slug: cleanSlug,
      is_active: true,
    });

    if (insertError) {
      setError(insertError.code === "23505" ? "Cette adresse publique est déjà utilisée. Essayez-en une autre." : insertError.message);
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
  }

  if (checking) return <main style={{ padding: "48px 0" }}><p>Préparation de votre espace…</p></main>;

  return (
    <main style={{ padding: "48px 0 64px" }}>
      <section className="card" style={{ maxWidth: 620, margin: "0 auto" }}>
        <p className="muted" style={{ marginTop: 0 }}>Première configuration</p>
        <h1>Créez votre page artisan</h1>
        <p className="muted">Ces informations serviront à votre page publique de demande de devis.</p>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          <label>Nom de l’entreprise<input required minLength={2} maxLength={120} value={companyName} onChange={(e) => handleCompanyChange(e.target.value)} style={fieldStyle} /></label>
          <label>Activité<input required minLength={2} maxLength={120} value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="Ex. Plomberie et chauffage" style={fieldStyle} /></label>
          <label>Zone d’intervention<input value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} placeholder="Ex. Brest et alentours" style={fieldStyle} /></label>
          <label>Téléphone professionnel<input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={fieldStyle} /></label>
          <label>Adresse de votre page publique<input required value={slug} onChange={(e) => setSlug(slugify(e.target.value))} style={fieldStyle} /><span className="muted" style={{ display: "block", marginTop: 6 }}>/a/{slug || "votre-entreprise"}</span></label>
          {error && <p style={{ margin: 0, color: "#b42318" }}>{error}</p>}
          <button className="button" type="submit" disabled={loading}>{loading ? "Création…" : "Créer ma page"}</button>
        </form>
      </section>
    </main>
  );
}

const fieldStyle = { display: "block", width: "100%", marginTop: 8, padding: 12, border: "1px solid #d0d5dd", borderRadius: 10, background: "white" } as const;
