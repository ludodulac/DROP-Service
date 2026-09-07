import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import RequestForm from "./RequestForm";

export default async function RequestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: artisan } = await supabase
    .from("drop_service_artisans")
    .select("id, company_name, slug, activity, service_area, logo_url, is_active")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!artisan) notFound();

  return (
    <main style={{ padding: "40px 0 64px" }}>
      <section className="card" style={{ maxWidth: 720, margin: "0 auto" }}>
        <p className="muted" style={{ marginTop: 0 }}>Demande pour {artisan.company_name}</p>
        <h1>Décrivez votre besoin</h1>
        <RequestForm artisanId={artisan.id} companyName={artisan.company_name} />
      </section>
    </main>
  );
}
