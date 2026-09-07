import Link from "next/link";

const fieldStyle = {
  display: "block",
  width: "100%",
  marginTop: 8,
  padding: 12,
  border: "1px solid #d0d5dd",
  borderRadius: 10,
  background: "white",
} as const;

export default function EmmanuelLambalRequestDemoPage() {
  return (
    <main style={{ padding: "48px 0" }}>
      <section className="card" style={{ maxWidth: 720, margin: "0 auto 24px" }}>
        <p className="muted" style={{ marginTop: 0 }}>Démonstration • aucune donnée n’est envoyée</p>
        <h1>Besoin d’un plombier-chauffagiste ?</h1>
        <p style={{ lineHeight: 1.6 }}>
          Décrivez votre besoin en quelques instants pour permettre à l’artisan de comprendre la situation avant de vous rappeler.
        </p>

        <form style={{ display: "grid", gap: 16 }}>
          <label>Type de besoin
            <select style={fieldStyle} defaultValue="">
              <option value="" disabled>Sélectionner</option>
              <option>Fuite / recherche de fuite</option>
              <option>Robinetterie / sanitaires</option>
              <option>Chauffe-eau</option>
              <option>Chauffage</option>
              <option>Installation / rénovation</option>
              <option>Autre</option>
            </select>
          </label>
          <label>Commune<input style={fieldStyle} placeholder="Ex. Brest" /></label>
          <label>Niveau d’urgence
            <select style={fieldStyle} defaultValue="normal">
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="low">Peut attendre</option>
            </select>
          </label>
          <label>Que se passe-t-il ?<textarea rows={5} style={fieldStyle} placeholder="Décrivez le problème en quelques mots…" /></label>
          <label>Quand êtes-vous disponible ?<input style={fieldStyle} placeholder="Ex. aujourd’hui après 17h" /></label>
          <label>Photos utiles (3 maximum)<input type="file" multiple accept="image/jpeg,image/png,image/webp" style={fieldStyle} /></label>
          <label>Votre nom<input style={fieldStyle} /></label>
          <label>Téléphone<input type="tel" style={fieldStyle} /></label>
          <label>Email (facultatif)<input type="email" style={fieldStyle} /></label>
          <a className="button" href="#apercu">Voir ce que reçoit l’artisan</a>
        </form>

        <p className="muted" style={{ marginTop: 20, fontSize: 14 }}>
          Ceci est une maquette indépendante préparée à titre de démonstration. Elle n’est pas affiliée à Emmanuel Lambal et ne collecte aucune donnée.
        </p>
        <Link href="/demo/emmanuel-lambal">← Retour à la comparaison</Link>
      </section>

      <section id="apercu" className="card" style={{ maxWidth: 720, margin: "0 auto" }}>
        <p className="muted" style={{ marginTop: 0 }}>Aperçu côté artisan • exemple</p>
        <h2>Nouvelle demande — fuite urgente à Brest</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <p><strong>Type :</strong> Fuite / recherche de fuite</p>
          <p><strong>Commune :</strong> Brest</p>
          <p><strong>Urgence :</strong> Urgent</p>
          <p><strong>Description :</strong> Fuite sous l’évier de la cuisine depuis ce matin. L’eau coule dès que le robinet est utilisé.</p>
          <p><strong>Disponibilité :</strong> Aujourd’hui après 17h</p>
          <p><strong>Photos :</strong> 2 photos jointes</p>
          <p><strong>Contact :</strong> Marie D. • 06 XX XX XX XX</p>
        </div>
        <p style={{ lineHeight: 1.6, marginBottom: 0 }}>
          En un coup d’œil, l’artisan sait déjà ce qui se passe, où intervenir, le niveau d’urgence et quand le client est disponible.
        </p>
      </section>
    </main>
  );
}
