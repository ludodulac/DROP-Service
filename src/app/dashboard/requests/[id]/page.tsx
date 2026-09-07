"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type RequestDetail = {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  city: string;
  category: string;
  description: string;
  urgency: "low" | "normal" | "urgent";
  availability: string | null;
  status: "new" | "contacted" | "quote_sent" | "won" | "lost";
  created_at: string;
};

type Photo = { id: string; file_name: string; storage_path: string; url?: string };

const statusLabels = { new: "Nouveau", contacted: "Contacté", quote_sent: "Devis envoyé", won: "Gagné", lost: "Perdu" } as const;
const urgencyLabels = { low: "Peut attendre", normal: "Normal", urgent: "Urgent" } as const;

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { void load(); }, [params.id]);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.replace("/login");
      return;
    }

    const { data, error: requestError } = await supabase
      .from("drop_service_requests")
      .select("id, customer_name, phone, email, city, category, description, urgency, availability, status, created_at")
      .eq("id", params.id)
      .maybeSingle();

    if (requestError || !data) {
      setError("Cette demande est introuvable ou ne vous appartient pas.");
      setLoading(false);
      return;
    }

    setRequest(data as RequestDetail);

    const { data: photoData } = await supabase
      .from("drop_service_request_photos")
      .select("id, file_name, storage_path")
      .eq("request_id", params.id);

    const signedPhotos = await Promise.all(
      ((photoData ?? []) as Photo[]).map(async (photo) => {
        const { data: signed } = await supabase.storage
          .from("drop-service-request-photos")
          .createSignedUrl(photo.storage_path, 60 * 15);
        return { ...photo, url: signed?.signedUrl };
      })
    );

    setPhotos(signedPhotos);
    setLoading(false);
  }

  if (loading) return <main style={{ padding: "40px 0" }}><p>Chargement de la demande…</p></main>;

  if (!request) return <main style={{ padding: "40px 0" }}><div className="card"><p>{error}</p><Link href="/dashboard">Retour au tableau de bord</Link></div></main>;

  return (
    <main style={{ padding: "40px 0 64px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", display: "grid", gap: 18 }}>
        <Link href="/dashboard">← Retour aux demandes</Link>
        <section className="card">
          <p className="muted" style={{ marginTop: 0 }}>{new Date(request.created_at).toLocaleString("fr-FR")}</p>
          <h1 style={{ marginBottom: 8 }}>{request.customer_name}</h1>
          <p style={{ marginTop: 0 }}><strong>{request.category}</strong> · {request.city} · {urgencyLabels[request.urgency]}</p>
          <p><strong>Statut :</strong> {statusLabels[request.status]}</p>
        </section>

        <section className="card">
          <h2>Coordonnées</h2>
          <p><strong>Téléphone :</strong> <a href={`tel:${request.phone}`}>{request.phone}</a></p>
          {request.email && <p><strong>Email :</strong> <a href={`mailto:${request.email}`}>{request.email}</a></p>}
          {request.availability && <p><strong>Disponibilités :</strong> {request.availability}</p>}
        </section>

        <section className="card">
          <h2>Description</h2>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{request.description}</p>
        </section>

        <section className="card">
          <h2>Photos</h2>
          {photos.length === 0 ? <p className="muted">Aucune photo jointe.</p> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              {photos.map((photo) => photo.url ? (
                <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer">
                  <img src={photo.url} alt={photo.file_name || "Photo de la demande"} style={{ width: "100%", height: 190, objectFit: "cover", borderRadius: 10, border: "1px solid #e5e7eb" }} />
                </a>
              ) : null)}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
