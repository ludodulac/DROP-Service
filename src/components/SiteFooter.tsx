import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer style={{borderTop:"1px solid #e5e7eb",marginTop:"3rem",padding:"1.5rem 1rem",fontSize:14,color:"#5f6368"}}>
      <nav aria-label="Informations légales" style={{display:"flex",gap:"1rem",justifyContent:"center",flexWrap:"wrap"}}>
        <Link href="/mentions-legales">Mentions légales</Link>
        <Link href="/conditions-generales">Conditions générales</Link>
        <Link href="/confidentialite">Confidentialité</Link>
      </nav>
    </footer>
  );
}
