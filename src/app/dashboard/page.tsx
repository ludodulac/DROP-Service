"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Artisan = { id: string; company_name: string; slug: string };
type RequestRow = {
  id: string;
  customer_name: string;
  category: string;
  city: string;
  urgency: "low" | "normal" | "urgent";
  status: "new" | "contacted" | "quote_sent" | "won" | "lost";
  created_at: string;
};

const statusLabels: Record<RequestRow["status"], string> = {
  new: "Nouveau",
  contacted: "Contacté",
  quote_sent: "Devis envoyé",
  won: "Chantier gagné",
  lost: "Perdu",
};

const urgencyLabels: Record<RequestRow["urgency"], string> = {
  low: "Peut attendre",
  normal: "Normal",
  urgent: "Urgent",
};

export default function DashboardPage() {
  const router = useRouter();
  const [artisan, setArtisan] = useState<Artisan | null>(null);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { void loadDashboard(); }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) { router.replace("/login"); return; }

    const { data: artisanData, error: artisanError } = await supabase
      .from("drop_service_artisans")
      .select("id, company_name, slug")
      .eq("user_id", user.id)
      .maybeSingle();

    if (artisanError) { setError(artisanError.message); setLoading(false); return; }
    if (!artisanData) { router.replace("/onboarding"); return; }
    setArtisan(artisanData);

    const { data: requestData, error: requestError } = await supabase
      .from("drop_service_requests")
      .select("id, customer_name, category, city, urgency, status, created_at")
      .eq("artisan_id", artisanData.id)
      .order("created_at", { ascending: false });

    if (requestError) setError(requestError.message);
    else setRequests((requestData ?? []) as RequestRow[]);
    setLoading(false);
  }

  async function updateStatus(id: string, status: RequestRow["status"]) {
    const { error: updateError } = await supabase.from("drop_service_requests").update({ status }).eq("id", id);
    if (updateError) { setError("Le statut n’a pas pu être mis à jour. Réessayez."); return; }
    setRequests((current) => current.map((item) => item.id === id ? { ...item, status } : item));
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const metrics = useMemo(() => {
    const won = requests.filter((r) => r.status === "won").length;
    const quoted = requests.filter((r) => r.status === "quote_sent" || r.status === "won").length;
    const toHandle = requests.filter((r) => r.status === "new").length;
    return {
      total: requests.length,
      toHandle,
      quoted,
      won,
      conversion: requests.length ? Math.round((won / requests.length) * 100) : 0,
    };
  }, [requests]);

  if (loading) {
    return <main className="app-page"><div className="loading-line">Chargement de vos demandes…</div></main>;
  }

  return (
    <main className="app-page">
      <div className="app-shell">
        <header className="app-topbar">
          <div className="brand-lockup">
            <div className="brand-mark" aria-hidden="true">D</div>
            <div>
              <strong>Demandes clients</strong>
              <span>{artisan?.company_name}</span>
            </div>
          </div>
          <button type="button" onClick={signOut} className="text-button">Se déconnecter</button>
        </header>

        <section className="page-heading">
          <div>
            <p className="eyebrow">Espace artisan</p>
            <h1>Vos demandes</h1>
            <p className="muted">Repérez ce qui demande votre attention et suivez chaque demande jusqu’au chantier gagné.</p>
          </div>
          {artisan && <Link className="button primary-action" href={`/a/${artisan.slug}`}>Ouvrir ma page client</Link>}
        </section>

        {error && <div className="alert-error" role="alert">{error}</div>}

        <section className="attention-panel" aria-label="À traiter">
          <div>
            <span className="attention-label">À traiter maintenant</span>
            <strong>{metrics.toHandle}</strong>
            <span>nouvelle{metrics.toHandle > 1 ? "s" : ""} demande{metrics.toHandle > 1 ? "s" : ""}</span>
          </div>
          <p>{metrics.toHandle > 0 ? "Commencez par les nouvelles demandes, puis mettez leur statut à jour au fil du traitement." : "Vous êtes à jour. Les prochaines demandes apparaîtront ici automatiquement."}</p>
        </section>

        <section className="metric-strip" aria-label="Résultats du pilote">
          <Metric label="Demandes reçues" value={metrics.total} />
          <Metric label="Devis envoyés" value={metrics.quoted} />
          <Metric label="Chantiers gagnés" value={metrics.won} />
          <Metric label="Conversion" value={`${metrics.conversion}%`} />
        </section>

        <section className="data-panel">
          <div className="section-heading">
            <div>
              <h2>Demandes récentes</h2>
              <p className="muted">Mettez à jour le statut pour obtenir un bilan fiable du pilote.</p>
            </div>
            <span className="count-label">{requests.length} au total</span>
          </div>

          {requests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">✓</div>
              <h3>Votre espace est prêt</h3>
              <p>Partagez votre page client pour commencer à recevoir des demandes structurées.</p>
              {artisan && <Link className="button" href={`/a/${artisan.slug}`}>Voir la page à partager</Link>}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Client</th><th>Besoin</th><th>Commune</th><th>Urgence</th><th>Statut</th><th><span className="sr-only">Action</span></th></tr></thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td><Link className="client-link" href={`/dashboard/requests/${request.id}`}>{request.customer_name}</Link><span className="cell-subtext">{new Date(request.created_at).toLocaleDateString("fr-FR")}</span></td>
                      <td>{request.category}</td>
                      <td>{request.city}</td>
                      <td><span className={`badge ${request.urgency === "urgent" ? "badge-danger" : request.urgency === "low" ? "" : "badge-warning"}`}>{urgencyLabels[request.urgency]}</span></td>
                      <td>
                        <select className="compact-select" aria-label={`Statut de la demande de ${request.customer_name}`} value={request.status} onChange={(event) => void updateStatus(request.id, event.target.value as RequestRow["status"])}>
                          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      </td>
                      <td><Link className="row-action" href={`/dashboard/requests/${request.id}`}>Voir la demande →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="app-footer">Service de transmission de demandes pour artisans · Ludovic Dulac</footer>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="metric-item"><span>{label}</span><strong>{value}</strong></div>;
}
