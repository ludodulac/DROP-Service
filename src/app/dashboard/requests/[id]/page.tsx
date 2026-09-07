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

const statusLabels = { new: "Nouveau", contacted: "Contacté", quote_sent: "Devis envoyé", won: "Chantier gagné", lost: "Demande perdue" } as const;
const urgencyLabels = { low: "Peut attendre", normal: "Normal", urgent: "Urgent" } as const;

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { void load(); }, [params.id]);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { router.replace("/login"); return; }

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

    const { data: photoData } = await supabase.from("drop_service_request_photos").select("id, file_name, storage_path").eq("request_id", params.id);
    const signedPhotos = await Promise.all(((photoData ?? []) as Photo[]).map(async (photo) => {
      const { data: signed } = await supabase.storage.from("drop-service-request-photos").createSignedUrl(photo.storage_path, 60 * 15);
      return { ...photo, url: signed?.signedUrl };
    }));
    setPhotos(signedPhotos);
    setLoading(false);
  }

  async function updateStatus(status: RequestDetail["status"]) {
    if (!request) return;
    setSaving(true);
    setError("");
    const { error: updateError } = await supabase.from("drop_service_requests").update({ status }).eq("id", request.id);
    if (updateError) setError("Le statut n'a pas pu être mis à jour. Réessayez.");
    else setRequest({ ...request, status });
    setSaving(false);
  }

  if (loading) return <main style={{ padding: "40px 0" }}><div className="loading-state">Chargement de la demande…</div></main>;
  if (!request) return <main style={{ padding: "40px 0" }}><div className="card" style={{ maxWidth: 620, margin: "0 auto" }}><p className="alert-error">{error}</p><Link className="text-link" href="/dashboard">Retour aux demandes</Link></div></main>;

  const urgencyClass = request.urgency === "urgent" ? "badge badge-danger" : request.urgency === "low" ? "badge" : "badge badge-warning";
  const statusClass = request.status === "won" ? "badge badge-success" : request.status === "lost" ? "badge badge-danger" : "badge";

  return (
    <main className="app-page">
      <div className="request-detail-shell">
        <div className="request-detail-topbar">
          <Link className="text-link" href="/dashboard">← Retour aux demandes</Link>
          <span className="muted" style={{ fontSize: 13 }}>{new Date(request.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</span>
        </div>

        <section className="request-hero">
          <div>
            <div className="request-badges"><span className={urgencyClass}>{urgencyLabels[request.urgency]}</span><span className={statusClass}>{statusLabels[request.status]}</span></div>
            <p className="eyebrow">{request.category} · {request.city}</p>
            <h1>{request.customer_name}</h1>
            <p className="muted">Toutes les informations utiles avant votre premier rappel.</p>
          </div>
          <div className="request-primary-actions">
            <a className="button" href={`tel:${request.phone}`}>Appeler {request.customer_name.split(" ")[0]}</a>
            {request.email && <a className="button button-secondary" href={`mailto:${request.email}`}>Envoyer un email</a>}
          </div>
        </section>

        {error && <p className="alert-error" role="alert">{error}</p>}

        <div className="request-detail-grid">
          <section className="data-panel request-main-panel">
            <div className="detail-section">
              <p className="detail-label">Problème décrit</p>
              <p className="detail-description">{request.description}</p>
            </div>
            <div className="detail-divider" />
            <div className="detail-facts">
              <div><span>Commune</span><strong>{request.city}</strong></div>
              <div><span>Disponibilités</span><strong>{request.availability || "Non précisées"}</strong></div>
              <div><span>Téléphone</span><a href={`tel:${request.phone}`}>{request.phone}</a></div>
              <div><span>Email</span>{request.email ? <a href={`mailto:${request.email}`}>{request.email}</a> : <strong>Non renseigné</strong>}</div>
            </div>
          </section>

          <aside className="request-side-panel">
            <section className="card">
              <h2 style={{ marginTop: 0, fontSize: 18 }}>Avancement</h2>
              <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>Mettez le statut à jour au fil du traitement.</p>
              <label className="field-label">Statut de la demande
                <select className="field" value={request.status} disabled={saving} onChange={(e) => void updateStatus(e.target.value as RequestDetail["status"])}>
                  {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
            </section>
          </aside>
        </div>

        <section className="data-panel">
          <div className="section-heading"><div><h2>Photos reçues</h2><p className="muted">Ouvrez une photo pour l'afficher en grand.</p></div><span className="count-label">{photos.length} photo{photos.length > 1 ? "s" : ""}</span></div>
          {photos.length === 0 ? <div className="photo-empty">Aucune photo jointe à cette demande.</div> : (
            <div className="photo-grid">{photos.map((photo) => photo.url ? <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer"><img src={photo.url} alt={photo.file_name || "Photo de la demande"} /></a> : null)}</div>
          )}
        </section>
      </div>
    </main>
  );
}
