import Link from "next/link";

const before = ["Nom", "E-mail", "Message libre"];

const after = [
  "Type d’intervention",
  "Commune",
  "Niveau d’urgence",
  "Description structurée",
  "Disponibilités",
  "Jusqu’à 3 photos",
  "Téléphone pour rappeler rapidement",
];

const benefits = [
  "Comprendre le problème avant de rappeler",
  "Prioriser plus vite les urgences",
  "Éviter les allers-retours pour demander photos, adresse et disponibilités",
];

export default function EmmanuelLambalDemoPage() {
  return (
    <main style={{ padding: "48px 0" }}>
      <section className="card" style={{ maxWidth: 820, margin: "0 auto 24px" }}>
        <p className="muted" style={{ marginTop: 0 }}>Démonstration privée • programme pilote</p>
        <h1>Emmanuel Lambal — Plombier-chauffagiste</h1>
        <p className="muted">Brest • Plomberie & chauffage</p>
        <h2>Recevoir une demande exploitable avant même de rappeler le client</h2>
        <p style={{ lineHeight: 1.7 }}>
          L’idée est simple : pendant que vous êtes sur un chantier, le client renseigne son problème, sa commune,
          l’urgence, ses disponibilités et peut joindre des photos. Au moment de le rappeler, vous avez déjà l’essentiel.
        </p>
        <div style={{ display: "grid", gap: 10, margin: "20px 0" }}>
          {benefits.map((benefit) => (
            <div key={benefit} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span aria-hidden="true">✓</span>
              <span>{benefit}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="button" href="/demo/emmanuel-lambal/request">Tester comme un client</Link>
          <a className="button secondary" href="#comparaison">Voir l’avant / après</a>
        </div>
        <p className="muted" style={{ marginBottom: 0, marginTop: 18, fontSize: 14 }}>
          Démonstration indépendante préparée pour illustrer le concept. Aucun partenariat n’est supposé à ce stade.
        </p>
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
            <h3>Avec le parcours pilote</h3>
            <ul>{after.map((item) => <li key={item} style={{ marginBottom: 8 }}>{item}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="card" style={{ maxWidth: 820, margin: "0 auto" }}>
        <p className="muted" style={{ marginTop: 0 }}>Proposition pilote</p>
        <h2>14 jours gratuits, sans engagement</h2>
        <p style={{ lineHeight: 1.7 }}>
          Nous installons le parcours et nous comparons pendant 14 jours la qualité des demandes reçues : niveau de
          détail, photos, urgence, disponibilité et nombre d’allers-retours nécessaires avant de pouvoir décider quoi faire.
          Aucun paiement ni carte bancaire n’est demandé pour le pilote.
        </p>
        <Link className="button" href="/demo/emmanuel-lambal/request">Voir le parcours client</Link>
      </section>
    </main>
  );
}
