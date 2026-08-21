import { HubEditorialContent } from "@/components/tools/hub-editorial-content";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Ferramentas de PDF Online",
  description:
    "Converta, edite, organize, compacte, redimensione e prepare documentos PDF para Word, Excel, PowerPoint, HTML, imagens e impressão.",
  pathname: "/ferramentas/pdfs",
});

export default function PdfsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <HubEditorialContent hub="pdfs" />
    </>
  );
}
