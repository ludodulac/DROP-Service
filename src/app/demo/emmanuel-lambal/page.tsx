import Link from "next/link";

const services = [
  "Dépannage plomberie et petites fuites",
  "WC, sanitaires et robinetterie",
  "Recherche de fuite après dégât des eaux",
  "Chauffage et chauffe-eau",
  "Salle de bains, cuisine et installations",
];

const benefits = [
  "Comprendre le problème avant de rappeler",
  "Voir la commune, l’urgence et les disponibilités immédiatement",
  "Recevoir jusqu’à 3 photos utiles avant le déplacement",
];

export default function EmmanuelLambalDemoPage() {
  return (
    <main style={{ padding: "48px 0" }}>
      <section className="card" style={{ maxWidth: 820, margin: "0 auto 24px" }}>
        <p className="muted" style={{ marginTop: 0 }}>Démonstration privée • fiche préparée à partir d’informations publiques</p>
        <h1>Emmanuel Lambal — Plombier-chauffagiste à Brest</h1>
        <p className="muted">11 rue de Keranroux, 29200 Brest • Intervention principalement dans le Finistère</p>
        <p style={{ lineHeight: 1.7 }}>
          30 ans d’expérience en plomberie et chauffage. Cette fiche de démonstration montre comment un client peut transmettre une demande plus complète avant d’être rappelé.
        </p>

        <h2>Principaux besoins pris en compte</h2>
        <div style={{ display: "grid", gap: 10, margin: "16px 0 24px" }}>
          {services.map((service) => <div key={service}>✓ {service}</div>)}
        </div>

        <h2>Une demande exploitable avant même de rappeler</h2>
        <div style={{ display: "grid", gap: 10, margin: "16px 0 20px" }}>
          {benefits.map((benefit) => <div key={benefit}>✓ {benefit}</div>)}
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="button" href="/demo/emmanuel-lambal/request">Tester comme un client</Link>
          <a className="button secondary" href="#installation">Comment l’utiliser</a>
        </div>
        <p className="muted" style={{ marginBottom: 0, marginTop: 18, fontSize: 14 }}>
          Démonstration indépendante : Emmanuel Lambal n’a pas encore validé cette fiche et aucun partenariat n’est supposé.
        </p>
      </section>

      <section id="installation" className="card" style={{ maxWidth: 820, margin: "0 auto 24px" }}>
        <p className="muted" style={{ marginTop: 0 }}>Installation simple</p>
        <h2>Un lien à placer là où vos clients vous trouvent déjà</h2>
        <p style={{ lineHeight: 1.7 }}>
          La page peut être reliée à un bouton « Faire une demande » sur votre site et partagée par lien ou QR code. Elle ne remplace pas votre téléphone : elle donne une autre porte d’entrée aux clients lorsque vous êtes occupé.
        </p>
        <p style={{ lineHeight: 1.7, marginBottom: 0 }}>
          Avant toute mise en ligne réelle, les prestations, la zone d’intervention et les informations affichées sont vérifiées avec vous.
        </p>
      </section>

      <section className="card" style={{ maxWidth: 820, margin: "0 auto" }}>
        <p className="muted" style={{ marginTop: 0 }}>Proposition pilote</p>
        <h2>14 jours gratuits, sans engagement</h2>
        <p style={{ lineHeight: 1.7 }}>
          Nous installons le parcours et observons pendant 14 jours si les demandes reçues sont plus faciles à traiter : informations utiles présentes, photos, urgence, disponibilité et nombre d’allers-retours avant de pouvoir décider quoi faire.
        </p>
        <Link className="button" href="/demo/emmanuel-lambal/request">Voir le parcours client</Link>
      </section>
    </main>
  );
}
