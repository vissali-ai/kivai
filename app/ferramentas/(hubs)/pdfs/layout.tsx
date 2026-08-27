import { PdfHubEditorialContent } from "@/components/tools/pdf-hub-editorial-content";
import { getCmsHubMetadata, getPageMetadata } from "@/lib/seo";

const baseMetadata = getPageMetadata({
  title: "Ferramentas de PDF Online",
  description:
    "Converta, edite, organize, compacte e prepare PDFs para Word, Excel, PowerPoint, HTML, imagens e impressão. Una, divida, gire, redimensione e desbloqueie arquivos com autorização.",
  pathname: "/ferramentas/pdfs",
});
export async function generateMetadata() { return getCmsHubMetadata("pdfs", baseMetadata); }

export default function PdfsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PdfHubEditorialContent />
    </>
  );
}
