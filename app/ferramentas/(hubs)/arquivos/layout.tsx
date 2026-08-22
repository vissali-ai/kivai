import { ArquivosHubEditorial } from "@/components/tools/arquivos-hub-editorial";
import { getCmsHubMetadata, getPageMetadata } from "@/lib/seo";

const baseMetadata = getPageMetadata({
  title: "Ferramentas para Arquivos: ZIP, RAR e Renomeação em Lote",
  description:
    "Compacte arquivos em ZIP, abra ZIP e RAR e organize nomes em lote com ferramentas online para extração, compactação e gerenciamento de arquivos.",
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
