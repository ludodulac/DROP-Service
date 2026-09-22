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
    <main id="haut" style={{ padding: "48px 0" }}>
      <section className="card" style={{ maxWidth: 720, margin: "0 auto 24px" }}>
        <p className="demo-label">Page de démonstration</p>
        <h1>Transmettre votre demande à Emmanuel Lambal</h1>
        <p className="muted">Plombier-chauffagiste • Brest et Finistère selon la demande</p>
        <p style={{ lineHeight: 1.6 }}>
          Décrivez votre besoin et ajoutez, si utile, quelques photos. Ces informations permettent à l’artisan de comprendre la situation avant de vous rappeler.
        </p>

        <form style={{ display: "grid", gap: 16 }}>
          <label>De quoi avez-vous besoin ?
            <select style={fieldStyle} defaultValue="">
              <option value="" disabled>Sélectionner</option>
              <option>Fuite / dégât des eaux</option>
              <option>WC / sanitaire</option>
              <option>Robinetterie / évier / lavabo</option>
              <option>Chauffe-eau / ballon d’eau chaude</option>
              <option>Chauffage</option>
              <option>Salle de bains / installation</option>
              <option>Autre</option>
            </select>
          </label>
          <label>Commune d’intervention<input style={fieldStyle} placeholder="Ex. Brest" /></label>
          <label>Niveau d’urgence
            <select style={fieldStyle} defaultValue="normal">
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="low">Peut attendre</option>
            </select>
            <span className="muted" style={{ display: "block", marginTop: 8, fontSize: 13 }}>
              Le niveau d’urgence aide l’artisan à comprendre votre situation mais ne garantit pas sa disponibilité ni un délai d’intervention.
            </span>
          </label>
          <label>Que se passe-t-il ?<textarea rows={5} style={fieldStyle} placeholder="Ex. fuite sous l’évier depuis ce matin…" /></label>
          <label>Quand êtes-vous disponible ?<input style={fieldStyle} placeholder="Ex. aujourd’hui après 17h" /></label>
          <label>Photos utiles (3 maximum)<input type="file" multiple accept="image/jpeg,image/png,image/webp" style={fieldStyle} /></label>\n          <div className="demo-photo-grid" aria-label="Exemples de photos jointes">\n            <div className="demo-photo"><span>PHOTO EXEMPLE</span><strong>Fuite sous évier</strong></div>\n            <div className="demo-photo"><span>PHOTO EXEMPLE</span><strong>Raccord humide</strong></div>\n          </div>
          <label>Votre nom<input style={fieldStyle} /></label>
          <label>Téléphone<input type="tel" style={fieldStyle} /></label>
          <label>Email (facultatif)<input type="email" style={fieldStyle} /></label>
          <a className="button" href="#apercu">Voir l’exemple de demande reçue ↓</a>\n          <p className="scroll-hint">La suite se trouve plus bas sur cette même page.</p>
        </form>

        <p className="muted" style={{ marginTop: 20, fontSize: 14 }}>
          Cette page est une démonstration préparée pour Emmanuel Lambal. Elle ne collecte ni ne transmet les informations saisies.
        </p>
        <Link href="/demo/emmanuel-lambal">← Retour à la présentation</Link>
      </section>

      <section id="apercu" className="card" style={{ maxWidth: 720, margin: "0 auto" }}>
        <p className="muted" style={{ marginTop: 0 }}>Exemple de ce que l’artisan reçoit</p>
        <h2>Nouvelle demande — fuite urgente à Brest</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <p><strong>Besoin :</strong> Fuite / dégât des eaux</p>
          <p><strong>Commune :</strong> Brest</p>
          <p><strong>Urgence :</strong> Urgent</p>
          <p><strong>Description :</strong> Fuite sous l’évier de la cuisine depuis ce matin. L’eau coule dès que le robinet est utilisé.</p>
          <p><strong>Disponibilité :</strong> Aujourd’hui après 17h</p>
          <p><strong>Photos :</strong> 2 photos jointes</p>\n          <div className="demo-photo-grid" aria-label="Photos exemple reçues par l’artisan">\n            <div className="demo-photo"><span>PHOTO EXEMPLE</span><strong>Fuite sous évier</strong></div>\n            <div className="demo-photo"><span>PHOTO EXEMPLE</span><strong>Raccord humide</strong></div>\n          </div>
          <p><strong>Contact :</strong> Marie D. • 06 XX XX XX XX</p>
        </div>
        <p style={{ lineHeight: 1.6, marginBottom: 0 }}>
          Avant de rappeler, l’artisan connaît déjà le besoin, la commune, l’urgence déclarée, les disponibilités et dispose éventuellement de photos.
        </p>
      </section>
    </main>
  );
}
