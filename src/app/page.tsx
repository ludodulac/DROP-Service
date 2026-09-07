import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: "64px 0" }}>
      <section className="card" style={{ maxWidth: 760, margin: "0 auto" }}>
        <p className="muted" style={{ marginTop: 0, fontWeight: 700 }}>Assistant Demandes & Devis</p>
        <h1 style={{ fontSize: "clamp(2rem, 6vw, 4rem)", marginBottom: 16 }}>
          Moins d’appels perdus. Des demandes clients mieux organisées.
        </h1>
        <p className="muted" style={{ fontSize: 18, lineHeight: 1.6 }}>
          Une application simple pour les artisans : vos prospects décrivent leur besoin,
          ajoutent leurs disponibilités et leurs photos, puis vous retrouvez chaque demande
          dans votre tableau de bord.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
          <Link className="button" href="/signup">Créer mon espace artisan</Link>
          <Link className="button" href="/login" style={{ background: "#475467" }}>Me connecter</Link>
        </div>
      </section>
    </main>
  );
}
