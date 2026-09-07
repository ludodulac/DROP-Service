import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: "64px 0" }}>
      <section className="card" style={{ maxWidth: 760, margin: "0 auto" }}>
        <p className="muted" style={{ marginTop: 0, fontWeight: 700 }}>
          V1 — Assistant Demandes & Devis
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 6vw, 4rem)", marginBottom: 16 }}>
          Moins d’appels perdus. Des demandes clients mieux organisées.
        </h1>
        <p className="muted" style={{ fontSize: 18, lineHeight: 1.6 }}>
          Une petite application pensée pour les artisans : le prospect décrit son besoin,
          ajoute ses disponibilités et ses photos, puis l’entreprise retrouve la demande
          dans un tableau de bord simple.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
          <Link className="button" href="/a/demo-plomberie">
            Voir la page artisan
          </Link>
          <Link className="button" href="/dashboard" style={{ background: "#475467" }}>
            Voir le dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
