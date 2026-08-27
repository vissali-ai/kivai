import { ArquivosHubEditorial } from "@/components/tools/arquivos-hub-editorial";
import { getCmsHubMetadata, getPageMetadata } from "@/lib/seo";

const baseMetadata = getPageMetadata({
  title: "Ferramentas para Arquivos: ZIP, RAR e Organização em Lote",
  description:
    "Compacte arquivos em ZIP, extraia ZIP e RAR, renomeie arquivos em lote e adicione prefixos ou sufixos para organizar arquivos com mais rapidez.",
  pathname: "/ferramentas/arquivos",
});

export async function generateMetadata() {
  return getCmsHubMetadata("arquivos", baseMetadata);
}

export default function ArquivosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ArquivosHubEditorial />
    </>
  );
}
