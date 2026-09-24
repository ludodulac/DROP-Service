import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import RequestForm from "./RequestForm";

export default async function RequestPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }) {
  const { slug } = await params;
  const { data: artisan } = await supabase
    .from("drop_service_artisans")
    .select("id, company_name, slug, activity, service_area, logo_url, is_active")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!artisan) notFound();

  const { preview } = await searchParams;
  let isOwnerPreview = false;
  if (preview === "1") {
    const serverSupabase = await createServerSupabaseClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (user) {
      const { data: owner } = await serverSupabase.from("drop_service_artisans").select("id").eq("user_id", user.id).eq("slug", slug).maybeSingle();
      isOwnerPreview = owner?.id === artisan.id;
    }
  }

  return (
    <main style={{ padding: "32px 0 64px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {isOwnerPreview && <aside className="preview-banner"><div><strong>Aperçu de votre page publique</strong><span>Voici ce que voient vos clients.</span></div><Link className="preview-return" href="/dashboard">Retour à mon espace artisan</Link></aside>}
        <header style={{ marginBottom: 18 }}>
          <p className="eyebrow">Demande d’intervention</p>
          <h1 style={{ marginBottom: 10 }}>Expliquez votre besoin à {artisan.company_name}</h1>
          <p className="muted" style={{ margin: 0, maxWidth: 620 }}>Donnez les informations utiles maintenant pour que l’artisan puisse comprendre la situation avant de vous rappeler.</p>
        </header>

        <section className="card" style={{ padding: 24 }}>
          <RequestForm artisanId={artisan.id} companyName={artisan.company_name} />
        </section>

        <footer className="muted" style={{ marginTop: 16, textAlign: "center", fontSize: 12 }}>
          Service de transmission de demandes pour artisans · Ludovic Dulac
        </footer>
      </div>
    </main>
  );
}
