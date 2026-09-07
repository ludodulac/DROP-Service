import Link from "next/link";

export default async function ArtisanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main style={{ padding: "48px 0" }}>
      <section className="card" style={{ maxWidth: 720, margin: "0 auto" }}>
        <p className="muted" style={{ marginTop: 0 }}>Page artisan — {slug}</p>
        <h1>Plomberie Démo</h1>
        <p className="muted">Plomberie • Chauffage • Dépannage local</p>
        <p style={{ lineHeight: 1.6 }}>
          Décrivez votre problème et envoyez les informations utiles. L’entreprise pourra
          consulter votre demande dès qu’elle est disponible.
        </p>
        <Link className="button" href={`/a/${slug}/request`}>
          Faire une demande
        </Link>
      </section>
    </main>
  );
}
