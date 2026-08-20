import { ArquivosHubEditorial } from "@/components/tools/arquivos-hub-editorial";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Ferramentas para Arquivos",
  description:
    "Ferramentas online para compactar e descompactar arquivos ZIP e RAR de forma simples.",
  pathname: "/ferramentas/arquivos",
});

export default function ArquivosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ArquivosHubEditorial />
    </>
  );
}
