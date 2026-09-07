export default async function RequestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main style={{ padding: "40px 0 64px" }}>
      <section className="card" style={{ maxWidth: 720, margin: "0 auto" }}>
        <p className="muted" style={{ marginTop: 0 }}>Demande pour {slug}</p>
        <h1>Décrivez votre besoin</h1>
        <form style={{ display: "grid", gap: 16 }}>
          <label>
            Nom
            <input name="customerName" required style={fieldStyle} />
          </label>
          <label>
            Téléphone
            <input name="customerPhone" type="tel" required style={fieldStyle} />
          </label>
          <label>
            Email (facultatif)
            <input name="customerEmail" type="email" style={fieldStyle} />
          </label>
          <label>
            Commune
            <input name="city" required style={fieldStyle} />
          </label>
          <label>
            Type de besoin
            <select name="category" required style={fieldStyle} defaultValue="">
              <option value="" disabled>Sélectionner</option>
              <option value="leak">Fuite</option>
              <option value="heating">Chauffage</option>
              <option value="installation">Installation</option>
              <option value="other">Autre</option>
            </select>
          </label>
          <label>
            Urgence
            <select name="urgency" required style={fieldStyle} defaultValue="normal">
              <option value="low">Peut attendre</option>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
          <label>
            Description
            <textarea name="description" required rows={5} style={fieldStyle} />
          </label>
          <label>
            Disponibilités
            <input name="availability" style={fieldStyle} placeholder="Ex. mardi après 17h" />
          </label>
          <label>
            Photos (à connecter au stockage dans l’étape suivante)
            <input name="photos" type="file" multiple accept="image/*" style={fieldStyle} />
          </label>
          <button className="button" type="submit">Envoyer la demande</button>
        </form>
      </section>
    </main>
  );
}

const fieldStyle = {
  display: "block",
  width: "100%",
  marginTop: 8,
  padding: 12,
  border: "1px solid #d0d5dd",
  borderRadius: 10,
  background: "white",
} as const;
