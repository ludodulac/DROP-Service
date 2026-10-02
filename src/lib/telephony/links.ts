import { getPublicAppUrl } from "@/lib/public-app-url";

export function getMissedCallRequestUrl(slug: string) {
  return getPublicAppUrl(
    "/a/" + encodeURIComponent(slug) + "/request?source=missed_call",
  );
}

export function getMissedCallSmsBody(link: string) {
  return (
    "Bonjour, je n’ai pas pu répondre à votre appel. " +
    "Vous pouvez m’envoyer votre demande et des photos ici : " +
    link
  );
}
