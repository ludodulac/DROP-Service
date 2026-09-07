"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Artisan = { id: string; company_name: string; slug: string; };
type RequestRow = {
  id: string;
  customer_name: string;
  category: string;
  city: string;
  urgency: "low" | "normal" | "urgent";
  status: "new" | "contacted" | "quote_sent" | "won" | "lost";
  created_at: string;
};

const statusLabels: Record<RequestRow["status"], string> = { new: "Nouveau", contacted: "Contacté", quote_sent: "Devis envoyé", won: "Gagné", lost: "Perdu" };
const urgencyLabels: Record<RequestRow["urgency"], string> = { low: "Peut attendre", normal: "Normal", urgent: "Urgent" };

export default function DashboardPage() {
  const router = useRouter();
  const [artisan, setArtisan] = useState<Artisan | null>(null);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { void loadDashboard(); }, []);

  async function loadDashboard() {
    setLoading(true); setError("");
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) { router.replace("/login"); return; }

    const { data: artisanData, error: artisanError } = await supabase.from("drop_service_artisans").select("id, company_name, slug").eq("user_id", user.id).maybeSingle();
    if (artisanError) { setError(artisanError.message); setLoading(false); return; }
    if (!artisanData) { router.replace("/onboarding"); return; }
    setArtisan(artisanData);

    const { data: requestData, error: requestError } = await supabase.from("drop_service_requests").select("id, customer_name, category, city, urgency, status, created_at").eq("artisan_id", artisanData.id).order("created_at", { ascending: false });
    if (requestError) setError(requestError.message); else setRequests((requestData ?? []) as RequestRow[]);
    setLoading(false);
  }

  async function updateStatus(id: string, status: RequestRow["status"]) {
    const { error: updateError } = await supabase.from("drop_service_requests").update({ status }).eq("id", id);
    if (updateError) { setError(updateError.message); return; }
    setRequests((current) => current.map((item) => item.id === id ? { ...item, status } : item));
  }

  async function signOut() { await supabase.auth.signOut(); router.replace("/login"); }

  if (loading) return <main style={{ padding: "40px 0" }}><p>Chargement du tableau de bord…</p></main>;

  const quoted = requests.filter((r) => r.status === "quote_sent" || r.status === "won").length;
  const won = requests.filter((r) => r.status === "won").length;
  const urgent = requests.filter((r) => r.urgency === "urgent").length;
  const conversion = requests.length ? Math.round((won / requests.length) * 100) : 0;

  return (
    <main style={{ padding: "40px 0 64px" }}>
      <section style={{ display: "grid", gap: 20 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div><p className="muted" style={{ marginBottom: 6 }}>{artisan?.company_name}</p><h1 style={{ marginTop: 0, marginBottom: 8 }}>Demandes clients</h1><p className="muted" style={{ margin: 0 }}>Suivez ce que le parcours vous apporte réellement.</p></div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{artisan && <Link className="button" href={`/a/${artisan.slug}`}>Voir ma page publique</Link>}<button type="button" onClick={signOut} style={secondaryButton}>Se déconnecter</button></div>
        </header>

        {error && <div className="card" style={{ borderColor: "#f5b7b1" }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          <Kpi label="Demandes reçues" value={requests.length} />
          <Kpi label="Urgentes" value={urgent} />
          <Kpi label="Devis envoyés" value={quoted} />
          <Kpi label="Chantiers gagnés" value={won} />
          <Kpi label="Conversion demande → gagné" value={`${conversion}%`} />
        </div>

        <div className="card">
          <strong>Objectif du pilote</strong>
          <p className="muted" style={{ marginBottom: 0, lineHeight: 1.6 }}>Ces indicateurs servent à mesurer des résultats observés plutôt qu'à promettre un nombre de clients. Marquez chaque demande au fil du traitement pour obtenir un bilan exploitable à la fin des 14 jours.</p>
        </div>

        <div className="card" style={{ overflowX: "auto" }}>
          {requests.length === 0 ? <p className="muted" style={{ margin: 0 }}>Aucune demande pour le moment. Votre page publique est prête à recevoir des prospects.</p> : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}><thead><tr>{['Client','Catégorie','Commune','Urgence','Statut','Détail'].map((label) => <th key={label} style={thStyle}>{label}</th>)}</tr></thead><tbody>{requests.map((request) => <tr key={request.id}><td style={tdStyle}>{request.customer_name}</td><td style={tdStyle}>{request.category}</td><td style={tdStyle}>{request.city}</td><td style={tdStyle}>{urgencyLabels[request.urgency]}</td><td style={tdStyle}><select value={request.status} onChange={(event) => void updateStatus(request.id, event.target.value as RequestRow["status"])} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #d0d5dd", background: "white" }}>{Object.entries(statusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></td><td style={tdStyle}><Link href={`/dashboard/requests/${request.id}`}>Voir</Link></td></tr>)}</tbody></table>
          )}
        </div>
      </section>
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return <div className="card" style={{ padding: 18 }}><div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div><div className="muted" style={{ marginTop: 5, fontSize: 14 }}>{label}</div></div>;
}

const thStyle = { textAlign: "left" as const, padding: "12px 10px", borderBottom: "1px solid #e5e7eb", color: "#667085" };
const tdStyle = { padding: "14px 10px", borderBottom: "1px solid #f0f1f2" };
const secondaryButton = { padding: "10px 14px", borderRadius: 10, border: "1px solid #d0d5dd", background: "white", cursor: "pointer" } as const;
