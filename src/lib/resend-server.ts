import "server-only";

type ArtisanRequestNotification = {
  to: string | null;
  requestId: string;
  customerName: string;
  phone: string;
  customerEmail: string | null;
  city: string;
  category: string;
  urgency: "low" | "normal" | "urgent";
  description: string;
  availability: string | null;
};

function urgencyLabel(urgency: ArtisanRequestNotification["urgency"]) {
  if (urgency === "urgent") return "Urgent";
  if (urgency === "low") return "Peut attendre";
  return "À traiter prochainement";
}

export async function sendArtisanRequestNotification(
  notification: ArtisanRequestNotification,
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("resend_not_configured");
  }

  if (!notification.to) {
    throw new Error("artisan_email_missing");
  }

  const text = [
    "Nouvelle demande reçue sur BRIF",
    "",
    `Nom du client : ${notification.customerName}`,
    `Téléphone : ${notification.phone}`,
    `Email : ${notification.customerEmail ?? "Non renseigné"}`,
    `Ville : ${notification.city}`,
    `Catégorie : ${notification.category}`,
    `Urgence : ${urgencyLabel(notification.urgency)}`,
    `Description : ${notification.description}`,
    `Disponibilités : ${notification.availability ?? "Non renseignées"}`,
    "",
    `Référence : ${notification.requestId}`,
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [notification.to],
      subject: `Nouvelle demande BRIF — ${notification.category} — ${notification.city}`,
      text,
    }),
  });

  if (!response.ok) {
    throw new Error(`resend_send_failed_${response.status}`);
  }
}
