import { HubEditorialContent } from "@/components/tools/hub-editorial-content";
import { getCmsHubMetadata, getPageMetadata } from "@/lib/seo";

const baseMetadata = getPageMetadata({
  title: "Ferramentas de Imagem Online",
  description:
    "Edite, converta, comprima, redimensione, recorte e prepare imagens para sites, e-commerce e redes sociais. Remova fundos, metadados, aplique marca-d'água e use recursos para JPG, PNG, WebP, HEIC, SVG e outros formatos.",
  pathname: "/ferramentas/imagens",
});
export async function generateMetadata() { return getCmsHubMetadata("imagens", baseMetadata); }

export default function ImagensLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <HubEditorialContent hub="imagens" />
    </>
  );
}
