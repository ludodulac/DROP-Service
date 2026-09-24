import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function ArtisanPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }) {
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
    <main style={{ padding: "48px 0" }}>
      {isOwnerPreview && <aside className="preview-banner"><div><strong>Aperçu de votre page publique</strong><span>Voici ce que voient vos clients.</span></div><Link className="preview-return" href="/dashboard">Retour à mon espace artisan</Link></aside>}
      <section className="card" style={{ maxWidth: 720, margin: "0 auto" }}>
        <p className="muted" style={{ marginTop: 0 }}>Demande de devis</p>
        <h1>{artisan.company_name}</h1>
        <p className="muted">{artisan.activity}{artisan.service_area ? ` • ${artisan.service_area}` : ""}</p>
        <p style={{ lineHeight: 1.6 }}>Décrivez votre problème et envoyez les informations utiles. L’entreprise pourra consulter votre demande et vous recontacter.</p>
        <Link className="button" href={`/a/${artisan.slug}/request${isOwnerPreview ? "?preview=1" : ""}`}>Faire une demande</Link>
      </section>
    </main>
  );
}
