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
        <p className="muted" style={{ marginTop: 0 }}>Exemple personnalisé • BRIF</p>
        <h1>Un parcours de demande préparé pour Emmanuel Lambal</h1>
        <p className="muted">Plombier-chauffagiste à Brest • Intervention principalement dans le Finistère</p>
        <p style={{ lineHeight: 1.7 }}>
          L’objectif est simple : permettre à vos clients de vous transmettre les informations utiles pendant que vous êtes sur un chantier, afin que vous puissiez comprendre la situation avant de rappeler.
        </p>

        <h2>Les besoins que vos clients peuvent décrire</h2>
        <div style={{ display: "grid", gap: 10, margin: "16px 0 24px" }}>
          {services.map((service) => <div key={service}>✓ {service}</div>)}
        </div>

        <h2>Ce que vous recevez avant de rappeler</h2>
        <div style={{ display: "grid", gap: 10, margin: "16px 0 20px" }}>
          {benefits.map((benefit) => <div key={benefit}>✓ {benefit}</div>)}
        </div>
        <Link className="button" href="/demo/emmanuel-lambal/request">Voir exactement ce que verrait un client</Link>

        <p className="muted" style={{ marginBottom: 0, marginTop: 18, fontSize: 14 }}>
          Cet exemple a été préparé à partir d’informations professionnelles publiques. Les prestations, la zone d’intervention et les informations affichées seront vérifiées avec vous avant toute utilisation réelle.
        </p>
      </section>

      <section className="card" style={{ maxWidth: 820, margin: "0 auto 24px" }}>
        <p className="muted" style={{ marginTop: 0 }}>Fonctionnement</p>
        <h2>Le client décrit son besoin, vous gardez la main</h2>
        <p style={{ lineHeight: 1.7 }}>
          Le client indique son besoin, sa commune, le niveau d’urgence, ses disponibilités et peut joindre des photos. Une fois la demande envoyée, elle apparaît dans votre espace de suivi. Le téléphone reste disponible : BRIF ajoute simplement une porte d’entrée lorsque vous ne pouvez pas répondre immédiatement.
        </p>
        <p style={{ lineHeight: 1.7, marginBottom: 0 }}>
          Le parcours peut ensuite être relié à votre site, partagé par lien ou accessible avec un QR code.
        </p>
      </section>

      <section className="card" style={{ maxWidth: 820, margin: "0 auto" }}>
        <p className="muted" style={{ marginTop: 0 }}>Étape suivante</p>
        <h2>Tester avec quelques demandes réelles</h2>
        <p style={{ lineHeight: 1.7, marginBottom: 0 }}>
          Si le principe vous paraît utile, l’étape suivante consiste simplement à vérifier ensemble les informations de votre fiche puis à tester le parcours sur quelques demandes réelles. L’objectif est de voir s’il vous fait gagner du temps avant d’aller plus loin.
        </p>
      </section>
    </main>
  );
}
