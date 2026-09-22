import type { Metadata } from "next";
import "./globals.css";
import "./request-detail.css";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "BRIF — Demandes clients pour artisans",
  description: "Recevez des demandes clients plus claires, priorisez les urgences et suivez chaque dossier jusqu'au devis et au chantier gagné.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
