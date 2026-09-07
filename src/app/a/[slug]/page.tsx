import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default async function ArtisanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: artisan } = await supabase
    .from("drop_service_artisans")
    .select("id, company_name, slug, activity, service_area, logo_url, is_active")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!artisan) notFound();

  return (
    <main style={{ padding: "48px 0" }}>
      <section className="card" style={{ maxWidth: 720, margin: "0 auto" }}>
        <p className="muted" style={{ marginTop: 0 }}>Demande de devis</p>
        <h1>{artisan.company_name}</h1>
        <p className="muted">{artisan.activity}{artisan.service_area ? ` • ${artisan.service_area}` : ""}</p>
        <p style={{ lineHeight: 1.6 }}>Décrivez votre problème et envoyez les informations utiles. L’entreprise pourra consulter votre demande et vous recontacter.</p>
        <Link className="button" href={`/a/${artisan.slug}/request`}>Faire une demande</Link>
      </section>
    </main>
  );
}
