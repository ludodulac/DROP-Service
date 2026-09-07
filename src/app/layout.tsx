import type { Metadata } from "next";
import "./globals.css";
import "./request-detail.css";

export const metadata: Metadata = {
  title: "Demandes clients pour artisans — Ludovic Dulac",
  description: "Recevez des demandes clients plus claires, priorisez les urgences et suivez chaque dossier jusqu'au devis et au chantier gagné.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
