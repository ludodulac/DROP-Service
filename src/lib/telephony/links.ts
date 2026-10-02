import { getPublicAppUrl } from "@/lib/public-app-url";

export function getMissedCallRequestUrl(slug: string) {
  return getPublicAppUrl(`/a/${encodeURIComponent(slug)}/request?source=missed_call`);
}

export function getMissedCallSmsBody(slug: string) {
  return `Vous n’avez pas pu nous joindre. Décrivez votre demande ici : ${getMissedCallRequestUrl(slug)}`;
}
