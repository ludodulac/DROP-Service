"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

type Props = { artisanId: string; companyName: string };

export default function RequestForm({ artisanId, companyName }: Props) {
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [photoWarning, setPhotoWarning] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    setPhotoWarning("");
    const form = new FormData(event.currentTarget);
    const files = form.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0);

    if (files.length > 3) {
      setError("Vous pouvez ajouter jusqu’à 3 photos.");
      setSending(false);
      return;
    }
    if (files.some((file) => file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
      setError("Une photo n’est pas au bon format ou dépasse 5 Mo. Utilisez JPG, PNG ou WebP.");
      setSending(false);
      return;
    }

    const requestId = crypto.randomUUID();
    const { error: requestError } = await supabase.from("drop_service_requests").insert({
      id: requestId,
      artisan_id: artisanId,
      customer_name: String(form.get("customerName") ?? "").trim(),
      phone: String(form.get("customerPhone") ?? "").trim(),
      email: String(form.get("customerEmail") ?? "").trim() || null,
      city: String(form.get("city") ?? "").trim(),
      category: String(form.get("category") ?? "").trim(),
      urgency: String(form.get("urgency") ?? "normal"),
      description: String(form.get("description") ?? "").trim(),
      availability: String(form.get("availability") ?? "").trim() || null,
      status: "new",
    });

    if (requestError) {
      setError("Votre demande n’a pas pu être envoyée. Vérifiez votre connexion puis réessayez.");
      setSending(false);
      return;
    }

    let failedPhotos = 0;
    for (const [index, file] of files.entries()) {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `requests/${artisanId}/${requestId}/${index + 1}-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("drop-service-request-photos").upload(path, file, { contentType: file.type });
      if (uploadError) {
        failedPhotos += 1;
        continue;
      }

      const { error: photoRecordError } = await supabase.from("drop_service_request_photos").insert({
        request_id: requestId,
        storage_path: path,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      });
      if (photoRecordError) failedPhotos += 1;
    }

    if (failedPhotos > 0) {
      setPhotoWarning(
        `Votre demande a bien été enregistrée, mais ${failedPhotos} photo${failedPhotos > 1 ? "s n’ont" : " n’a"} pas pu être jointe${failedPhotos > 1 ? "s" : ""}. Ne renvoyez pas toute la demande : vous pourrez transmettre ${failedPhotos > 1 ? "ces photos" : "la photo"} à l’artisan lors de son rappel.`
      );
    }

    setSuccess(true);
    setSending(false);
  }

  if (success) {
    return (
      <div className="form-grid">
        <div className="alert-success" role="status">
          <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: 20 }}>Votre demande est envoyée</h2>
          <p style={{ margin: 0 }}>{companyName} a reçu les informations utiles pour comprendre votre besoin avant de vous recontacter.</p>
        </div>
        {photoWarning && (
          <div className="card" role="status">
            <strong>Photos partiellement envoyées</strong>
            <p className="muted" style={{ marginBottom: 0 }}>{photoWarning}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="form-grid">
      <section className="form-section" aria-labelledby="besoin-title">
        <h2 id="besoin-title" className="form-section-title">Votre besoin</h2>

        <label className="field-label">
          Quel est le problème ?
          <select name="category" required className="field" defaultValue="">
            <option value="" disabled>Choisir un type de besoin</option>
            <option value="Fuite">Fuite ou recherche de fuite</option>
            <option value="Chauffage">Chauffage</option>
            <option value="Installation">Installation ou remplacement</option>
            <option value="Autre">Autre besoin</option>
          </select>
        </label>

        <label className="field-label">
          Où se situe l’intervention ?
          <input name="city" required className="field" autoComplete="address-level2" placeholder="Ex. Brest" />
        </label>

        <label className="field-label">
          Est-ce urgent ?
          <select name="urgency" required className="field" defaultValue="normal">
            <option value="low">Non, cela peut attendre</option>
            <option value="normal">À traiter prochainement</option>
            <option value="urgent">Oui, c’est urgent</option>
          </select>
        </label>

        <label className="field-label">
          Décrivez ce qui se passe
          <span className="field-help">Quelques phrases suffisent : ce que vous constatez, depuis quand, et ce qui a déjà été essayé.</span>
          <textarea name="description" required minLength={5} rows={5} className="field" placeholder="Ex. Fuite sous l’évier depuis ce matin, l’eau coule dès que j’ouvre le robinet." />
        </label>

        <label className="field-label">
          Quand êtes-vous disponible ?
          <input name="availability" className="field" placeholder="Ex. aujourd’hui après 17 h ou mardi matin" />
        </label>

        <label className="field-label">
          Ajouter des photos
          <span className="field-help">Facultatif · jusqu’à 3 photos · 5 Mo maximum par photo.</span>
          <input name="photos" type="file" multiple accept="image/jpeg,image/png,image/webp" className="field" />
        </label>
      </section>

      <section className="form-section" aria-labelledby="contact-title">
        <h2 id="contact-title" className="form-section-title">Vos coordonnées</h2>

        <label className="field-label">
          Nom
          <input name="customerName" required minLength={2} className="field" autoComplete="name" />
        </label>

        <label className="field-label">
          Téléphone
          <span className="field-help">Pour que l’artisan puisse vous rappeler.</span>
          <input name="customerPhone" type="tel" required minLength={6} className="field" autoComplete="tel" inputMode="tel" />
        </label>

        <label className="field-label">
          Email <span className="field-help">(facultatif)</span>
          <input name="customerEmail" type="email" className="field" autoComplete="email" inputMode="email" />
        </label>
      </section>

      {error && <p className="alert-error" role="alert">{error}</p>}

      <button className="button" type="submit" disabled={sending} aria-busy={sending}>
        {sending ? "Envoi de la demande…" : "Envoyer ma demande"}
      </button>
      <p className="muted" style={{ margin: "-6px 0 0", fontSize: 12, textAlign: "center" }}>Vos informations sont transmises à {companyName} pour traiter votre demande.</p>
    </form>
  );
}
