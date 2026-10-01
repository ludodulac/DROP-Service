"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getArtisanPublicUrl } from "@/lib/public-app-url";
import {
  getBillingLabel,
  getSubscriptionPeriodLabel,
  subscriptionStatusLabels,
  type SubscriptionDisplayInput,
} from "@/lib/subscription-presentation";
import { canStartSubscriptionCheckout } from "@/lib/subscription-checkout-policy";
import { canManageSubscriptionInPortal } from "@/lib/subscription-portal-policy";
import type { TrialDisplayState } from "@/lib/trial-state";

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
  const [trial, setTrial] = useState<TrialDisplayState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutInterval, setCheckoutInterval] = useState<"month" | "year" | null>(null);
  const [checkoutReturn, setCheckoutReturn] = useState<string | null>(null);
  const [portalOpening, setPortalOpening] = useState(false);
  const [shareFeedback, setShareFeedback] = useState("");

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

    try {
      const subscriptionResponse = await fetch("/api/subscription", { cache: "no-store" });
      const subscriptionPayload: unknown = await subscriptionResponse.json();
      if (
        subscriptionResponse.ok &&
        typeof subscriptionPayload === "object" &&
        subscriptionPayload !== null &&
        "subscription" in subscriptionPayload &&
        "trial" in subscriptionPayload
      ) {
        const payload = subscriptionPayload as {
          subscription: SubscriptionDisplayInput | null;
          trial: TrialDisplayState;
        };
        setSubscription(payload.subscription);
        setTrial(payload.trial);
      } else {
        setError("Votre abonnement n’a pas pu être chargé. Vos demandes restent accessibles.");
      }
    } catch {
      setError("Votre abonnement n’a pas pu être chargé. Vos demandes restent accessibles.");
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

  async function openPortal() {
    setPortalOpening(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const payload: unknown = await response.json();
      if (
        response.ok &&
        typeof payload === "object" &&
        payload !== null &&
        "url" in payload &&
        typeof payload.url === "string" &&
        payload.url.startsWith("https://billing.stripe.com/")
      ) {
        window.location.assign(payload.url);
        return;
      }
      setError("La gestion de votre abonnement n’a pas pu être ouverte. Réessayez.");
    } catch {
      setError("La gestion de votre abonnement n’a pas pu être ouverte. Réessayez.");
    } finally {
      setPortalOpening(false);
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

  function showShareFeedback(message: string) {
    setShareFeedback(message);
    window.setTimeout(() => setShareFeedback((current) => current === message ? "" : current), 1800);
  }

  async function copyPublicPageLink() {
    if (!artisan) return;
    const publicUrl = getArtisanPublicUrl(artisan.slug);
    try {
      await navigator.clipboard.writeText(publicUrl);
      showShareFeedback("Lien copié");
    } catch {
      showShareFeedback("Impossible de copier le lien");
    }
  }

  async function sharePublicPage() {
    if (!artisan) return;
    const publicUrl = getArtisanPublicUrl(artisan.slug);

    if (!navigator.share) {
      await copyPublicPageLink();
      return;
    }

    try {
      await navigator.share({
        title: artisan.company_name,
        text: "Vous pouvez m’envoyer votre demande ici :",
        url: publicUrl,
      });
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      await copyPublicPageLink();
    }
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
          {artisan && (
            <div className="artisan-page-actions">
              <Link className="button primary-action" href={`/a/${artisan.slug}?preview=1`}>Prévisualiser ma page publique</Link>
              <div className="artisan-share-zone" aria-label="Partager ma page client">
                <span className="artisan-share-label">Partager ma page client</span>
                <div className="artisan-share-buttons">
                  <button className="button button-secondary" type="button" onClick={() => void copyPublicPageLink()}>Copier le lien</button>
                  <button className="button button-secondary" type="button" onClick={() => void sharePublicPage()}>Partager</button>
                </div>
                {shareFeedback && <span className="artisan-share-feedback" role="status">{shareFeedback}</span>}
              </div>
            </div>
          )}
        </section>

        {error && <div className="alert-error" role="alert">{error}</div>}
        {checkoutReturn === "success" && !subscription && (
          <div className="alert-info" role="status">Paiement terminé. Vérification de votre abonnement en cours.</div>
        )}

        <section className="card subscription-card" aria-labelledby="subscription-heading" style={{ marginBottom: 20 }}>
          {subscription && canManageSubscriptionInPortal(subscription.status) ? (
            <>
              <p className="eyebrow" id="subscription-heading">Abonnement</p>
              <div>
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
                <div style={{ marginTop: 14 }}>
                  <button className="button" type="button" disabled={portalOpening} onClick={() => void openPortal()}>
                    {portalOpening ? "Ouverture…" : "Gérer mon abonnement"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="eyebrow" id="subscription-heading">Période d’essai gratuite</p>
              {trial ? (
                <div className="trial-panel">
                  {trial.phase === "full" && (
                    <>
                      <strong>Votre essai BRIF est actif.</strong>
                      <p className="muted">Fin prévue le {formatTrialEndDate(trial.ends_at)} · {trial.days_remaining} jours restants.</p>
                    </>
                  )}
                  {trial.phase === "ending" && (
                    <>
                      <strong>Il vous reste {trial.days_remaining} jour{trial.days_remaining > 1 ? "s" : ""} d’essai gratuit.</strong>
                      <p className="muted">Pour continuer à utiliser BRIF après votre essai, vous pourrez choisir votre abonnement.</p>
                    </>
                  )}
                  {trial.phase === "expired" && (
                    <>
                      <strong>Votre période d’essai gratuite est terminée.</strong>
                      <p className="muted">Choisissez un abonnement pour continuer avec BRIF.</p>
                    </>
                  )}
                  {trial.phase !== "full" && canStartSubscriptionCheckout(subscription?.status) && (
                    <div className="subscription-offers">
                      <button className="button subscription-offer-button" type="button" disabled={checkoutInterval !== null} onClick={() => void startCheckout("month")}>
                        {checkoutInterval === "month" ? "Ouverture…" : "Mensuel — 39 €/mois"}
                      </button>
                      <button className="button subscription-offer-button" type="button" disabled={checkoutInterval !== null} onClick={() => void startCheckout("year")}>
                        {checkoutInterval === "year" ? "Ouverture…" : "Annuel — 390 €/an"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="muted">Votre période d’essai n’a pas pu être chargée.</p>
              )}
            </>
          )}
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

function formatTrialEndDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="metric-item"><span>{label}</span><strong>{value}</strong></div>;
}
