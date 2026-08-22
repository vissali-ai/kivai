import { ArquivosHubEditorial } from "@/components/tools/arquivos-hub-editorial";
import { getCmsHubMetadata, getPageMetadata } from "@/lib/seo";

const baseMetadata = getPageMetadata({
  title: "Ferramentas para Arquivos",
  description:
    "Ferramentas online para compactar e descompactar arquivos ZIP e RAR de forma simples.",
  pathname: "/ferramentas/arquivos",
});
export async function generateMetadata() { return getCmsHubMetadata("arquivos", baseMetadata); }

export default function ArquivosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ArquivosHubEditorial />
    </>
  );
}
