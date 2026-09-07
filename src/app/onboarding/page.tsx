"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
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

  useEffect(() => { void checkAccount(); }, []);

  async function checkAccount() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { router.replace("/login"); return; }
    const { data } = await supabase.from("drop_service_artisans").select("id").eq("user_id", userData.user.id).maybeSingle();
    if (data) { router.replace("/dashboard"); return; }
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
    if (!userData.user) { router.replace("/login"); return; }

    const cleanSlug = slugify(slug);
    if (cleanSlug.length < 2) {
      setError("Choisissez une adresse publique d'au moins 2 caractères.");
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
      setError(insertError.code === "23505" ? "Cette adresse publique est déjà utilisée. Essayez-en une autre." : "Impossible de créer votre espace pour le moment. Réessayez dans quelques instants.");
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
  }

  if (checking) return <main style={{ padding: "56px 0" }}><div className="loading-state">Préparation de votre espace…</div></main>;

  return (
    <main style={{ padding: "56px 0 72px" }}>
      <div className="onboarding-shell">
        <section>
          <div className="brand-lockup"><span className="brand-mark">L</span><span>Ludovic Dulac</span></div>
          <p className="eyebrow">Mise en route · 2 minutes</p>
          <h1 style={{ marginBottom: 14 }}>Préparez votre page de demandes clients.</h1>
          <p className="muted" style={{ maxWidth: 610, marginTop: 0 }}>Ces informations permettent d'afficher une page claire à vos clients et de ranger chaque demande au bon endroit. Vous pourrez faire évoluer le contenu ensuite.</p>
          <div className="setup-steps" aria-label="Étapes de configuration">
            <div className="setup-step setup-step-active"><span>1</span><div><strong>Votre activité</strong><small>Entreprise, métier et zone</small></div></div>
            <div className="setup-step"><span>2</span><div><strong>Votre lien client</strong><small>Une adresse simple à partager</small></div></div>
            <div className="setup-step"><span>3</span><div><strong>Votre espace est prêt</strong><small>Vous recevez et suivez les demandes</small></div></div>
          </div>
        </section>

        <section className="card auth-card" style={{ maxWidth: 640 }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>Informations de votre activité</h2>
            <p className="muted" style={{ marginTop: 0 }}>Renseignez uniquement ce qui sera utile à vos clients.</p>
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <label className="field-label">Nom de l'entreprise
              <input className="field" required minLength={2} maxLength={120} value={companyName} onChange={(e) => handleCompanyChange(e.target.value)} placeholder="Ex. Plomberie Martin" />
            </label>
            <label className="field-label">Activité
              <input className="field" required minLength={2} maxLength={120} value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="Ex. Plomberie et chauffage" />
              <span className="field-help">Utilisez les mots que vos clients emploient habituellement.</span>
            </label>
            <label className="field-label">Zone d'intervention
              <input className="field" value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} placeholder="Ex. Brest et alentours" />
            </label>
            <label className="field-label">Téléphone professionnel
              <input className="field" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex. 06 12 34 56 78" />
            </label>
            <label className="field-label">Adresse de votre page client
              <div className="slug-field"><span>/a/</span><input required value={slug} onChange={(e) => setSlug(slugify(e.target.value))} aria-label="Adresse de votre page client" /></div>
              <span className="field-help">Exemple : /a/{slug || "plomberie-martin"}</span>
            </label>
            {error && <p className="alert-error" role="alert">{error}</p>}
            <button className="button" type="submit" disabled={loading}>{loading ? "Création de votre espace…" : "Créer ma page client"}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
