import { HubEditorialContent } from "@/components/tools/hub-editorial-content";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Ferramentas de Imagem Online",
  description:
    "Edite, converta, comprima, redimensione, recorte e otimize imagens com ferramentas online para JPG, PNG, WebP, HEIC e outros formatos.",
  pathname: "/ferramentas/imagens",
});

export default function ImagensLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <HubEditorialContent hub="imagens" />
    </>
  );
}
