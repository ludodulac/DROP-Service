"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  getBillingLabel,
  getSubscriptionPeriodLabel,
  subscriptionStatusLabels,
  type SubscriptionDisplayInput,
} from "@/lib/subscription-presentation";
import { canStartSubscriptionCheckout } from "@/lib/subscription-checkout-policy";

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
  const [subscription, setSubscription] = useState<SubscriptionDisplayInput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutInterval, setCheckoutInterval] = useState<"month" | "year" | null>(null);
  const [checkoutReturn, setCheckoutReturn] = useState<string | null>(null);

  useEffect(() => {
    setCheckoutReturn(new URLSearchParams(window.location.search).get("checkout"));
    void loadDashboard();
  }, []);

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

    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("drop_service_subscriptions")
      .select("status, billing_interval, current_period_end, cancel_at_period_end")
      .eq("artisan_id", artisanData.id)
      .maybeSingle();

    if (subscriptionError) {
      setError("Votre abonnement n’a pas pu être chargé. Vos demandes restent accessibles.");
    } else {
      setSubscription(subscriptionData as SubscriptionDisplayInput | null);
    }

    const { data: requestData, error: requestError } = await supabase
      .from("drop_service_requests")
      .select("id, customer_name, category, city, urgency, status, created_at")
      .eq("artisan_id", artisanData.id)
      .order("created_at", { ascending: false });

    if (requestError) setError(requestError.message);
    else setRequests((requestData ?? []) as RequestRow[]);
    setLoading(false);
  }

  async function startCheckout(interval: "month" | "year") {
    setCheckoutInterval(interval);
    setError("");
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const payload: unknown = await response.json();
      if (
        response.ok &&
        typeof payload === "object" &&
        payload !== null &&
        "url" in payload &&
        typeof payload.url === "string" &&
        payload.url.startsWith("https://checkout.stripe.com/")
      ) {
        window.location.assign(payload.url);
        return;
      }
      const code =
        typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
          ? payload.error
          : "checkout_failed";
      setError(code === "subscription_checkout_blocked"
        ? "Un abonnement est déjà en cours. Aucun nouvel abonnement n’a été créé."
        : "Le Checkout n’a pas pu être ouvert. Réessayez.");
    } catch {
      setError("Le Checkout n’a pas pu être ouvert. Réessayez.");
    } finally {
      setCheckoutInterval(null);
    }
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
          {artisan && <Link className="button primary-action" href={`/a/${artisan.slug}?preview=1`}>Prévisualiser ma page publique</Link>}
        </section>

        {error && <div className="alert-error" role="alert">{error}</div>}
        {checkoutReturn === "success" && !subscription && (
          <div className="alert-info" role="status">Paiement terminé. Vérification de votre abonnement en cours.</div>
        )}

        <section className="card" aria-labelledby="subscription-heading" style={{ marginBottom: 20 }}>
          <p className="eyebrow" id="subscription-heading">Abonnement</p>
          <div>
            {subscription ? (
              <>
                <strong>
                  {subscriptionStatusLabels[subscription.status]}
                  {getBillingLabel(subscription.billing_interval) ? ` · ${getBillingLabel(subscription.billing_interval)}` : ""}
                </strong>
                {getSubscriptionPeriodLabel(subscription) && (
                  <p className="muted" style={{ marginBottom: subscription.cancel_at_period_end ? 8 : 0 }}>
                    {getSubscriptionPeriodLabel(subscription)}
                  </p>
                )}
                {subscription.cancel_at_period_end && <span className="badge badge-warning">Annulation programmée</span>}
              </>
            ) : (
              <p className="muted">Aucun abonnement actif</p>
            )}
            {canStartSubscriptionCheckout(subscription?.status) && (
              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                <button className="button" type="button" disabled={checkoutInterval !== null} onClick={() => void startCheckout("month")}>
                  {checkoutInterval === "month" ? "Ouverture…" : "Choisir le mensuel — 39 €/mois"}
                </button>
                <button className="button" type="button" disabled={checkoutInterval !== null} onClick={() => void startCheckout("year")}>
                  {checkoutInterval === "year" ? "Ouverture…" : "Choisir l’annuel — 390 €/an"}
                </button>
              </div>
            )}
          </div>
        </section>

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
            <>
            <div className="mobile-request-list">{requests.map((request) => (<article className="mobile-request-card" key={`mobile-${request.id}`}><div className="mobile-request-head"><div><Link className="client-link" href={`/dashboard/requests/${request.id}`}>{request.customer_name}</Link><span className="cell-subtext">{new Date(request.created_at).toLocaleDateString("fr-FR")}</span></div><span className={`badge ${request.urgency === "urgent" ? "badge-danger" : request.urgency === "low" ? "" : "badge-warning"}`}>{urgencyLabels[request.urgency]}</span></div><div className="mobile-request-grid"><div className="mobile-request-field"><span>Besoin</span><span>{request.category}</span></div><div className="mobile-request-field"><span>Commune</span><span>{request.city}</span></div><div className="mobile-request-field"><span>Statut</span><select className="compact-select" aria-label={`Statut de la demande de ${request.customer_name}`} value={request.status} onChange={(event) => void updateStatus(request.id, event.target.value as RequestRow["status"])}>{Object.entries(statusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div></div><Link className="row-action" href={`/dashboard/requests/${request.id}`}>Voir la demande →</Link></article>))}</div><div className="table-wrap">
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
            </>
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
