import { HubEditorialContent } from "@/components/tools/hub-editorial-content";
import { getCmsHubMetadata, getPageMetadata } from "@/lib/seo";

const baseMetadata = getPageMetadata({
  title: "Ferramentas de PDF Online",
  description:
    "Converta, edite, organize, compacte, redimensione e prepare documentos PDF para Word, Excel, PowerPoint, HTML, imagens e impressão.",
  pathname: "/ferramentas/pdfs",
});
export async function generateMetadata() { return getCmsHubMetadata("pdfs", baseMetadata); }

export default function PdfsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <HubEditorialContent hub="pdfs" />
    </>
  );
}
