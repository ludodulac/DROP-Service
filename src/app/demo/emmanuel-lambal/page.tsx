import Link from "next/link";

const before = [
  "Nom",
  "E-mail",
  "Message libre",
];

const after = [
  "Type d’intervention",
  "Commune",
  "Niveau d’urgence",
  "Description structurée",
  "Disponibilités",
  "Jusqu’à 3 photos",
  "Téléphone pour rappeler rapidement",
];

export default function EmmanuelLambalDemoPage() {
  return (
    <main style={{ padding: "48px 0" }}>
      <section className="card" style={{ maxWidth: 820, margin: "0 auto 24px" }}>
        <p className="muted" style={{ marginTop: 0 }}>Démonstration privée • programme pilote</p>
        <h1>Emmanuel Lambal — Plombier-chauffagiste</h1>
        <p className="muted">Brest • Plomberie & chauffage</p>
        <h2>Une demande plus complète avant même de rappeler le client</h2>
        <p style={{ lineHeight: 1.7 }}>
          Cette démonstration illustre un parcours possible pour permettre à un client de préciser son besoin, son urgence,
          sa commune, ses disponibilités et d’ajouter des photos. Elle n’est pas le site officiel d’Emmanuel Lambal et
          n’implique aucun partenariat à ce stade.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="button" href="/demo/emmanuel-lambal/request">Tester la demande client</Link>
          <a className="button secondary" href="#comparaison">Voir l’avant / après</a>
        </div>
      </section>

      <section id="comparaison" className="card" style={{ maxWidth: 820, margin: "0 auto 24px" }}>
        <p className="muted" style={{ marginTop: 0 }}>Comparaison du parcours</p>
        <h2>Avant → Après</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          <div>
            <h3>Formulaire classique</h3>
            <ul>{before.map((item) => <li key={item} style={{ marginBottom: 8 }}>{item}</li>)}</ul>
          </div>
          <div>
            <h3>Avec notre système</h3>
            <ul>{after.map((item) => <li key={item} style={{ marginBottom: 8 }}>{item}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="card" style={{ maxWidth: 820, margin: "0 auto" }}>
        <p className="muted" style={{ marginTop: 0 }}>Proposition pilote</p>
        <h2>14 jours gratuits, sans engagement</h2>
        <p style={{ lineHeight: 1.7 }}>
          Si l’artisan accepte le test, nous personnalisons et installons le parcours. Pendant 14 jours, nous comparons
          la qualité des demandes reçues : informations complètes, photos, urgence et disponibilité. Aucun paiement ni
          carte bancaire n’est demandé pour le pilote.
        </p>
      </section>
    </main>
  );
}
