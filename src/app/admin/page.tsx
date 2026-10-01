"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ProspectStatus = "to_review" | "approved" | "contacted" | "replied" | "demo" | "pilot" | "client" | "declined";
type Prospect = {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  activity: string | null;
  status: ProspectStatus;
  priority: "low" | "normal" | "high";
  why_fit: string | null;
  draft_subject: string | null;
  draft_email: string | null;
  next_action: string | null;
  next_action_at: string | null;
  notes: string | null;
  created_at: string;
};

type AdminTask = {
  id: string;
  prospect_id: string | null;
  title: string;
  detail: string | null;
  status: "todo" | "done" | "dismissed";
  due_at: string | null;
};

const statusLabels: Record<ProspectStatus, string> = {
  to_review: "À valider",
  approved: "Message prêt",
  contacted: "Contacté",
  replied: "A répondu",
  demo: "Démo",
  pilot: "Pilote",
  client: "Client",
  declined: "Refusé",
};

const statusOrder: ProspectStatus[] = ["to_review", "approved", "contacted", "replied", "demo", "pilot", "client", "declined"];

const initialProspects = [
  {
    company_name: "Emmanuel Lambal",
    contact_name: "Emmanuel Lambal",
    email: "emmanuel-lambal@orange.fr",
    phone: null,
    website: "https://www.emmanuel-lambal.com/",
    city: "Brest",
    activity: "Plomberie et chauffage",
    status: "to_review" as const,
    priority: "high" as const,
    why_fit: "Formulaire actuel très simple : bon contraste pour démontrer la valeur d'une demande plus complète avec urgence, disponibilité et photos.",
    draft_subject: "Un exemple préparé pour vos demandes clients",
    draft_email: "Bonjour M. Lambal,\n\nJ’ai regardé comment vous recevez actuellement vos demandes de devis et je vous ai préparé gratuitement un exemple personnalisé pour votre activité.\n\nL’idée est simple : avant de rappeler le client, vous recevez déjà le type de problème, la commune, le niveau d’urgence, ses disponibilités et éventuellement des photos. Ça évite une partie des allers-retours pendant que vous êtes sur chantier.\n\nJe cherche actuellement 3 artisans pour tester le système gratuitement pendant 14 jours, sans engagement.\n\nSi vous voulez, je peux vous montrer l’exemple que j’ai préparé pour vous en 5 minutes.\n\nBien cordialement,\nLudovic Dulac",
    next_action: "Valider le message avant le premier contact",
    notes: "Premier prospect pilote recommandé. Démo personnalisée déjà prête.",
  },
];

function gmailComposeUrl(prospect: Prospect) {
  if (!prospect.email || !prospect.draft_email) return null;
  const params = new URLSearchParams({
    subject: prospect.draft_subject ?? "",
    body: prospect.draft_email,
  });
  return `mailto:${encodeURIComponent(prospect.email)}?${params.toString()}`;
}

function nextActionForStatus(status: ProspectStatus) {
  switch (status) {
    case "approved": return "Ouvrir le message préparé et envoyer le premier contact";
    case "contacted": return "Attendre la réponse puis relancer dans 3 jours si nécessaire";
    case "replied": return "Proposer une démonstration de 5 minutes";
    case "demo": return "Proposer l’installation du pilote gratuit de 14 jours";
    case "pilot": return "Suivre les demandes et préparer le bilan du pilote";
    case "client": return "Suivre la satisfaction et la facturation mensuelle";
    case "declined": return "Aucune action prévue";
    default: return "Valider le message avant le premier contact";
  }
}

export default function AdminPage() {
  const router = useRouter();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"prospects" | "emails" | "clients">("prospects");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [ownerMenuOpen, setOwnerMenuOpen] = useState(false);

  useEffect(() => { void loadAdmin(); }, []);

  async function signOutOwner() {
    setError("");
    setOwnerMenuOpen(false);
    const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });

    if (signOutError) {
      setError("La déconnexion n’a pas pu être effectuée. Réessayez.");
      return;
    }

    window.location.replace("/owner/login");
  }

  async function loadAdmin() {
    setLoading(true);
    setError("");
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) { router.replace("/login"); return; }

    let { data: prospectData, error: prospectError } = await supabase
      .from("drop_service_admin_prospects")
      .select("id, company_name, contact_name, email, phone, website, city, activity, status, priority, why_fit, draft_subject, draft_email, next_action, next_action_at, notes, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (prospectError) { setError("Impossible de charger les prospects."); setLoading(false); return; }

    const knownCompanies = new Set((prospectData ?? []).map((prospect) => prospect.company_name.toLowerCase()));
    const missingSeeds = initialProspects.filter((prospect) => !knownCompanies.has(prospect.company_name.toLowerCase()));
    if (missingSeeds.length) {
      const { error: seedError } = await supabase.from("drop_service_admin_prospects").insert(
        missingSeeds.map((prospect) => ({ owner_id: user.id, ...prospect }))
      );
      if (!seedError) {
        const refreshed = await supabase
          .from("drop_service_admin_prospects")
          .select("id, company_name, contact_name, email, phone, website, city, activity, status, priority, why_fit, draft_subject, draft_email, next_action, next_action_at, notes, created_at")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false });
        prospectData = refreshed.data;
      }
    }

    const { data: taskData } = await supabase
      .from("drop_service_admin_tasks")
      .select("id, prospect_id, title, detail, status, due_at")
      .eq("owner_id", user.id)
      .eq("status", "todo")
      .order("due_at", { ascending: true, nullsFirst: false });

    setProspects((prospectData ?? []) as Prospect[]);
    setTasks((taskData ?? []) as AdminTask[]);
    setLoading(false);
  }

  async function ensureFollowupTask(prospect: Prospect) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data: existing } = await supabase
      .from("drop_service_admin_tasks")
      .select("id")
      .eq("owner_id", userData.user.id)
      .eq("prospect_id", prospect.id)
      .eq("status", "todo")
      .limit(1);
    if (existing?.length) return;

    const due = new Date();
    due.setDate(due.getDate() + 3);
    const { data: inserted } = await supabase.from("drop_service_admin_tasks").insert({
      owner_id: userData.user.id,
      prospect_id: prospect.id,
      title: `Relancer ${prospect.company_name}`,
      detail: "Si aucune réponse n’est arrivée, envoyer une relance courte et personnalisée.",
      status: "todo",
      due_at: due.toISOString(),
    }).select("id, prospect_id, title, detail, status, due_at").single();
    if (inserted) setTasks((current) => [...current, inserted as AdminTask]);
  }

  async function updateStatus(id: string, status: ProspectStatus) {
    setSaving(true);
    setError("");
    const prospect = prospects.find((item) => item.id === id);
    const nextAction = nextActionForStatus(status);
    const nextActionAt = status === "contacted" ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() : null;
    const { error: updateError } = await supabase.from("drop_service_admin_prospects").update({
      status,
      next_action: nextAction,
      next_action_at: nextActionAt,
      updated_at: new Date().toISOString(),
    }).eq("id", id);

    if (updateError) setError("Le statut n'a pas pu être mis à jour.");
    else {
      setProspects((current) => current.map((p) => p.id === id ? { ...p, status, next_action: nextAction, next_action_at: nextActionAt } : p));
      if (status === "contacted" && prospect) await ensureFollowupTask(prospect);
    }
    setSaving(false);
  }

  async function markTaskDone(id: string) {
    const { error: taskError } = await supabase.from("drop_service_admin_tasks").update({ status: "done", updated_at: new Date().toISOString() }).eq("id", id);
    if (!taskError) setTasks((current) => current.filter((task) => task.id !== id));
  }

  async function copyDraft(prospect: Prospect) {
    if (!prospect.draft_email) return;
    const fullMessage = `${prospect.draft_subject ? `Objet : ${prospect.draft_subject}\n\n` : ""}${prospect.draft_email}`;
    await navigator.clipboard.writeText(fullMessage);
    setCopiedId(prospect.id);
    window.setTimeout(() => setCopiedId((current) => current === prospect.id ? null : current), 1800);
  }

  async function saveDraft(id: string, subject: string, message: string) {
    const draftSubject = subject.trim();
    const draftEmail = message.trim();

    if (!draftSubject || !draftEmail) {
      setError("Renseignez l’objet et le message avant d’enregistrer.");
      return false;
    }

    setSaving(true);
    setError("");
    const { data: updated, error: updateError } = await supabase
      .from("drop_service_admin_prospects")
      .update({
        draft_subject: draftSubject,
        draft_email: draftEmail,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("draft_subject, draft_email")
      .single();

    if (updateError || !updated) {
      setError("Le message n’a pas pu être enregistré.");
      setSaving(false);
      return false;
    }

    setProspects((current) => current.map((prospect) =>
      prospect.id === id
        ? { ...prospect, draft_subject: updated.draft_subject, draft_email: updated.draft_email }
        : prospect
    ));
    setSaving(false);
    return true;
  }

  async function deleteProspect(id: string) {
    if (!window.confirm("Supprimer définitivement ce prospect ?")) return;
    setSaving(true);
    setError("");
    await supabase.from("drop_service_admin_tasks").delete().eq("prospect_id", id);
    const { error: deleteError } = await supabase.from("drop_service_admin_prospects").delete().eq("id", id);
    if (deleteError) setError("Le prospect n’a pas pu être supprimé.");
    else {
      setProspects((current) => current.filter((prospect) => prospect.id !== id));
      setTasks((current) => current.filter((task) => task.prospect_id !== id));
      setSelectedId(null);
    }
    setSaving(false);
  }

  async function createProspect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { error: insertError } = await supabase.from("drop_service_admin_prospects").insert({
      owner_id: userData.user.id,
      company_name: String(form.get("company") ?? "").trim(),
      contact_name: String(form.get("contact") ?? "").trim() || null,
      email: String(form.get("email") ?? "").trim() || null,
      city: String(form.get("city") ?? "").trim() || null,
      activity: String(form.get("activity") ?? "").trim() || null,
      why_fit: String(form.get("why") ?? "").trim() || null,
      status: "to_review",
      priority: "normal",
      draft_subject: `Une façon simple de recevoir des demandes clients plus claires`,
      draft_email: `Bonjour ${String(form.get("contact") ?? "").trim() || String(form.get("company") ?? "").trim()},\n\nJe me permets de vous contacter car j’ai créé BRIF, un outil destiné aux artisans pour recevoir des demandes clients plus claires et éviter une partie des allers-retours.\n\nLe principe est simple : vos clients décrivent leur besoin, peuvent ajouter des photos et vous recevez les informations utiles avant de les rappeler.\n\nJe peux vous montrer simplement comment cela fonctionnerait pour votre activité.\n\nBien cordialement,\nLudovic Dulac`,
      next_action: "Préparer et valider le premier message",
    });
    if (insertError) setError("Le prospect n'a pas pu être ajouté.");
    else { setCreating(false); await loadAdmin(); setActiveTab("prospects"); }
    setSaving(false);
  }

  const selected = prospects.find((p) => p.id === selectedId) ?? null;
  const counts = useMemo(() => {
    const review = prospects.filter((p) => p.status === "to_review").length;
    const ready = prospects.filter((p) => p.status === "approved").length;
    const followup = prospects.filter((p) => ["contacted", "replied", "demo"].includes(p.status)).length;
    const emailMessages = prospects.filter(
      (p) => ["to_review", "approved"].includes(p.status) && Boolean(p.draft_email),
    ).length;

    return {
      review,
      ready,
      followup,
      pilots: prospects.filter((p) => p.status === "pilot").length,
      clients: prospects.filter((p) => p.status === "client").length,
      emailMessages,
      today: review + ready + followup + tasks.length,
    };
  }, [prospects, tasks.length]);

  const visibleProspects = prospects.filter((p) => {
    if (activeTab === "emails") return ["to_review", "approved"].includes(p.status) && Boolean(p.draft_email);
    if (activeTab === "clients") return p.status === "client";
    return true;
  });

  if (loading) return <main className="admin-page"><div className="loading-state">Préparation de votre administration…</div></main>;

  return (
    <main className="admin-page">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-brand-row">
            <div className="brand-lockup"><span className="brand-mark">LD</span><div><strong>Administration</strong><span>Ludovic Dulac</span></div></div>
            <div className="admin-owner-menu-wrap">
              <button
                className="admin-owner-menu-trigger"
                type="button"
                aria-label={ownerMenuOpen ? "Fermer le menu propriétaire" : "Ouvrir le menu propriétaire"}
                aria-expanded={ownerMenuOpen}
                aria-controls="owner-menu"
                onClick={() => setOwnerMenuOpen((open) => !open)}
              >
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
              </button>
              {ownerMenuOpen && (
                <div className="admin-owner-menu" id="owner-menu" role="menu">
                  <div className="admin-owner-menu-head">
                    <strong>Menu propriétaire</strong>
                    <button
                      className="admin-owner-menu-close"
                      type="button"
                      aria-label="Fermer le menu propriétaire"
                      onClick={() => setOwnerMenuOpen(false)}
                    >
                      ×
                    </button>
                  </div>
                  <button className="admin-owner-menu-item" type="button" role="menuitem" onClick={() => void signOutOwner()}>
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>
          </div>
          <nav className="admin-nav" aria-label="Administration">
            <AdminNav active={activeTab === "prospects"} onClick={() => setActiveTab("prospects")} label="Prospects" badge={`${prospects.length} total`} />
            <AdminNav active={activeTab === "emails"} onClick={() => setActiveTab("emails")} label="Emails à valider" badge={`${counts.emailMessages} message${counts.emailMessages > 1 ? "s" : ""}`} />
            <AdminNav active={activeTab === "clients"} onClick={() => setActiveTab("clients")} label="Clients" badge={String(counts.clients)} />
          </nav>
          <div className="admin-sidebar-footer"><span>Poste de pilotage privé</span></div>
        </aside>

        <section className="admin-content">
          <header className="admin-header">
            <div>
              <p className="eyebrow">Poste de pilotage</p>
              <h1>{activeTab === "prospects" ? "Prospects" : activeTab === "emails" ? "Emails à valider" : "Clients"}</h1>
              <p className="muted">Tout ce qu’il faut pour avancer sans retourner dans vos notes.</p>
            </div>
            <button className="button" type="button" onClick={() => setCreating(true)}>Ajouter un prospect</button>
          </header>

          {error && <p className="alert-error">{error}</p>}

          <section className="data-panel">
              <div className="section-heading"><div><h2>{activeTab === "emails" ? "Messages préparés" : activeTab === "clients" ? "Clients" : "Pipeline commercial"}</h2><p className="muted">Cliquez sur une ligne pour voir le détail, valider le message ou l’ouvrir dans Gmail.</p></div><span className="count-label">{visibleProspects.length} résultat{visibleProspects.length > 1 ? "s" : ""}</span></div>
              {visibleProspects.length === 0 ? <div className="empty-state"><div className="empty-icon">✓</div><h3>Rien ici pour le moment</h3><p>Cette vue se remplira au fur et à mesure de la prospection et des pilotes.</p></div> : (
                <>
                  <div className="admin-mobile-prospect-list">
                    {visibleProspects.map((prospect) => (
                      <article className="admin-mobile-prospect-card" key={`mobile-${prospect.id}`}>
                        <div className="admin-mobile-prospect-head">
                          <div>
                            <strong>{prospect.company_name}</strong>
                            {prospect.contact_name && prospect.contact_name !== prospect.company_name && <span>{prospect.contact_name}</span>}
                          </div>
                          <button className="text-link" type="button" onClick={() => setSelectedId(prospect.id)}>Ouvrir</button>
                        </div>
                        <div className="admin-mobile-prospect-meta">
                          <span>{prospect.city || "Ville à préciser"}</span>
                          <span>{prospect.activity || "Activité à préciser"}</span>
                        </div>
                        <label className="field-label">
                          Statut
                          <select className="compact-select" value={prospect.status} disabled={saving} onChange={(e) => void updateStatus(prospect.id, e.target.value as ProspectStatus)}>
                            {statusOrder.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                          </select>
                        </label>
                        <div className="admin-mobile-next-action">
                          <span>Prochaine action</span>
                          <strong>{prospect.next_action || nextActionForStatus(prospect.status)}</strong>
                        </div>
                      </article>
                    ))}
                  </div>
                  <div className="table-wrap admin-desktop-prospect-table"><table className="data-table admin-table"><thead><tr><th>Entreprise</th><th>Ville / activité</th><th>Statut</th><th>Prochaine action</th><th></th></tr></thead><tbody>{visibleProspects.map((prospect) => <tr key={prospect.id} onClick={() => setSelectedId(prospect.id)} style={{ cursor: "pointer" }}><td><strong>{prospect.company_name}</strong>{prospect.contact_name && prospect.contact_name !== prospect.company_name && <span className="cell-subtext">{prospect.contact_name}</span>}</td><td>{prospect.city || "—"}<span className="cell-subtext">{prospect.activity || "Activité à préciser"}</span></td><td><select className="compact-select" value={prospect.status} disabled={saving} onClick={(e) => e.stopPropagation()} onChange={(e) => void updateStatus(prospect.id, e.target.value as ProspectStatus)}>{statusOrder.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></td><td>{prospect.next_action || nextActionForStatus(prospect.status)}</td><td><button className="text-link" type="button" onClick={(e) => { e.stopPropagation(); setSelectedId(prospect.id); }}>Ouvrir</button></td></tr>)}</tbody></table></div>
                </>
              )}
            </section>
        </section>
      </div>

      {selected && <ProspectDrawer prospect={selected} saving={saving} copied={copiedId === selected.id} onCopy={() => void copyDraft(selected)} onClose={() => setSelectedId(null)} onSaveDraft={(subject, message) => saveDraft(selected.id, subject, message)} onStatus={(status) => void updateStatus(selected.id, status)} onDelete={() => void deleteProspect(selected.id)} />}
      {creating && <CreateProspectModal saving={saving} onClose={() => setCreating(false)} onSubmit={createProspect} />}
    </main>
  );
}

function AdminNav({ active, onClick, label, badge }: { active: boolean; onClick: () => void; label: string; badge: string }) {
  return <button type="button" className={`admin-nav-item${active ? " admin-nav-active" : ""}`} onClick={onClick}><span>{label}</span><strong>{badge}</strong></button>;
}

function ProspectDrawer({ prospect, saving, copied, onCopy, onClose, onSaveDraft, onStatus, onDelete }: { prospect: Prospect; saving: boolean; copied: boolean; onCopy: () => void; onClose: () => void; onSaveDraft: (subject: string, message: string) => Promise<boolean>; onStatus: (status: ProspectStatus) => void; onDelete: () => void }) {
  const [draftSubject, setDraftSubject] = useState(prospect.draft_subject ?? "");
  const [draftEmail, setDraftEmail] = useState(prospect.draft_email ?? "");
  const [draftSaved, setDraftSaved] = useState(false);
  const gmailUrl = gmailComposeUrl(prospect);

  useEffect(() => {
    setDraftSubject(prospect.draft_subject ?? "");
    setDraftEmail(prospect.draft_email ?? "");
    setDraftSaved(false);
  }, [prospect.id]);

  async function submitDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDraftSaved(false);
    if (await onSaveDraft(draftSubject, draftEmail)) setDraftSaved(true);
  }

  return <div className="admin-overlay" onMouseDown={onClose}><aside className="admin-drawer" onMouseDown={(e) => e.stopPropagation()}>
    <div className="admin-drawer-head"><div><p className="eyebrow">Prospect</p><h2>{prospect.company_name}</h2><p className="muted">{prospect.city || "Ville à préciser"} · {prospect.activity || "Activité à préciser"}</p></div><button className="text-button" type="button" onClick={onClose}>Fermer</button></div>
    <div className="admin-drawer-section"><label className="field-label">Statut<select className="field" value={prospect.status} disabled={saving} onChange={(e) => onStatus(e.target.value as ProspectStatus)}>{statusOrder.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label></div>
    {prospect.why_fit && <div className="admin-drawer-section"><h3>Pourquoi ce prospect</h3><p>{prospect.why_fit}</p></div>}
    <div className="admin-drawer-section"><h3>Coordonnées</h3><div className="admin-contact-grid">{prospect.email && <a className="text-link" href={`mailto:${prospect.email}`}>{prospect.email}</a>}{prospect.phone && <a className="text-link" href={`tel:${prospect.phone}`}>{prospect.phone}</a>}{prospect.website && <a className="text-link" href={prospect.website} target="_blank" rel="noreferrer">Voir le site / contact</a>}</div>{!prospect.email && <p className="field-help">Aucun email public fiable n’a été retenu. Le message peut être copié dans le formulaire du site ou utilisé comme trame d’appel.</p>}</div>
    <div className="admin-drawer-section">
      <div className="admin-email-head"><h3>Préparer le message</h3><span className={`badge ${prospect.draft_email ? "badge-warning" : ""}`}>{prospect.draft_email ? "Modifiable" : "À préparer"}</span></div>
      <form className="form-grid" onSubmit={(event) => void submitDraft(event)}>
        <label className="field-label">Objet du message<input className="field" required value={draftSubject} onChange={(event) => setDraftSubject(event.target.value)} /></label>
        <label className="field-label">Corps du message<textarea className="field" required rows={10} value={draftEmail} onChange={(event) => setDraftEmail(event.target.value)} /></label>
        <button className="button" type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer le message"}</button>
        {draftSaved && <p className="alert-success" role="status">Message enregistré.</p>}
      </form>
    </div>
    {prospect.draft_email && <div className="admin-drawer-section"><div className="admin-email-head"><h3>Message préparé</h3><span className={`badge ${prospect.status === "approved" ? "badge-success" : "badge-warning"}`}>{prospect.status === "approved" ? "Validé" : "À valider avant envoi"}</span></div>{prospect.draft_subject && <p><strong>Objet :</strong> {prospect.draft_subject}</p>}<pre className="admin-email-preview">{prospect.draft_email}</pre><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button className="button button-secondary" type="button" onClick={onCopy}>{copied ? "Message copié ✓" : "Copier le message"}</button>{prospect.status === "to_review" && <button className="button" type="button" disabled={saving} onClick={() => onStatus("approved")}>Valider ce message</button>}{prospect.status === "approved" && gmailUrl && <a className="button" href={gmailUrl} target="_blank" rel="noreferrer">Ouvrir l’email préparé</a>}{prospect.status === "approved" && <button className="button button-secondary" type="button" disabled={saving} onClick={() => onStatus("contacted")}>Marquer comme envoyé</button>}</div><p className="field-help">Rien n’est envoyé automatiquement. Vous gardez le contrôle du message final et de l’envoi.</p></div>}
    {prospect.notes && <div className="admin-drawer-section"><h3>Note interne</h3><p className="muted">{prospect.notes}</p></div>}
    {prospect.next_action && <div className="admin-next-action"><span>Prochaine action</span><strong>{prospect.next_action}</strong>{prospect.next_action_at && <small>Prévue le {new Date(prospect.next_action_at).toLocaleDateString("fr-FR")}</small>}</div>}
    <div className="admin-drawer-section"><button className="button admin-delete-button" type="button" disabled={saving} onClick={onDelete}>Supprimer le prospect</button></div>
  </aside></div>;
}

function CreateProspectModal({ saving, onClose, onSubmit }: { saving: boolean; onClose: () => void; onSubmit: (e: FormEvent<HTMLFormElement>) => void }) {
  return <div className="admin-overlay" onMouseDown={onClose}><form className="admin-modal" onSubmit={onSubmit} onMouseDown={(e) => e.stopPropagation()}><div className="admin-drawer-head"><div><p className="eyebrow">Prospection</p><h2>Ajouter un prospect</h2></div><button className="text-button" type="button" onClick={onClose}>Fermer</button></div><label className="field-label">Entreprise<input className="field" name="company" required /></label><label className="field-label">Nom du contact<input className="field" name="contact" /></label><div className="admin-form-columns"><label className="field-label">Email<input className="field" name="email" type="email" /></label><label className="field-label">Ville<input className="field" name="city" /></label></div><label className="field-label">Activité<input className="field" name="activity" placeholder="Ex. Plomberie et chauffage" /></label><label className="field-label">Pourquoi il est intéressant<textarea className="field" name="why" rows={4} /></label><button className="button" type="submit" disabled={saving}>{saving ? "Ajout…" : "Ajouter à la liste"}</button></form></div>;
}
