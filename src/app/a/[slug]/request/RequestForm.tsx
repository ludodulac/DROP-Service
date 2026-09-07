"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

type Props = { artisanId: string; companyName: string };

export default function RequestForm({ artisanId, companyName }: Props) {
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const files = form.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0);

    if (files.length > 3) {
      setError("Vous pouvez envoyer 3 photos maximum.");
      setSending(false);
      return;
    }
    if (files.some((file) => file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
      setError("Chaque photo doit être au format JPG, PNG ou WebP et faire moins de 5 Mo.");
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
      setError("La demande n’a pas pu être envoyée. Réessayez dans quelques instants.");
      setSending(false);
      return;
    }

    for (const [index, file] of files.entries()) {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${artisanId}/${requestId}/${index + 1}-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("drop-service-request-photos").upload(path, file, { contentType: file.type });
      if (uploadError) continue;
      await supabase.from("drop_service_request_photos").insert({ request_id: requestId, storage_path: path, file_name: file.name, mime_type: file.type, size_bytes: file.size });
    }

    setSuccess(true);
    setSending(false);
  }

  if (success) return <div className="card"><h2>Demande envoyée</h2><p>{companyName} a bien reçu vos informations et pourra vous recontacter.</p></div>;

  return <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
    <label>Nom<input name="customerName" required minLength={2} style={fieldStyle} /></label>
    <label>Téléphone<input name="customerPhone" type="tel" required minLength={6} style={fieldStyle} /></label>
    <label>Email (facultatif)<input name="customerEmail" type="email" style={fieldStyle} /></label>
    <label>Commune<input name="city" required style={fieldStyle} /></label>
    <label>Type de besoin<select name="category" required style={fieldStyle} defaultValue=""><option value="" disabled>Sélectionner</option><option value="Fuite">Fuite</option><option value="Chauffage">Chauffage</option><option value="Installation">Installation</option><option value="Autre">Autre</option></select></label>
    <label>Urgence<select name="urgency" required style={fieldStyle} defaultValue="normal"><option value="low">Peut attendre</option><option value="normal">Normal</option><option value="urgent">Urgent</option></select></label>
    <label>Description<textarea name="description" required minLength={5} rows={5} style={fieldStyle} /></label>
    <label>Disponibilités<input name="availability" style={fieldStyle} placeholder="Ex. mardi après 17h" /></label>
    <label>Photos (3 maximum)<input name="photos" type="file" multiple accept="image/jpeg,image/png,image/webp" style={fieldStyle} /></label>
    {error && <p style={{ color: "#b42318", margin: 0 }}>{error}</p>}
    <button className="button" type="submit" disabled={sending}>{sending ? "Envoi…" : "Envoyer la demande"}</button>
  </form>;
}

const fieldStyle = { display: "block", width: "100%", marginTop: 8, padding: 12, border: "1px solid #d0d5dd", borderRadius: 10, background: "white" } as const;
