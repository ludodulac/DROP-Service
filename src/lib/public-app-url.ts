const fallbackOrigin = "https://brif-artisans.vercel.app";

export const PUBLIC_APP_ORIGIN = (
  process.env.NEXT_PUBLIC_APP_URL?.trim() || fallbackOrigin
).replace(/\/+$/, "");

export function getPublicAppUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${PUBLIC_APP_ORIGIN}${normalizedPath}`;
}

export function getArtisanPublicUrl(slug: string) {
  return getPublicAppUrl(`/a/${encodeURIComponent(slug)}`);
}
