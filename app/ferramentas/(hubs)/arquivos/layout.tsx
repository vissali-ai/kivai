import type { Metadata } from "next";
import { ArquivosHubEditorial } from "@/components/tools/arquivos-hub-editorial";
import { getPageMetadata, noIndexRobots } from "@/lib/seo";

const baseMetadata = getPageMetadata({
  title: "Ferramentas para Arquivos",
  description:
    "Ferramentas online para compactar e descompactar arquivos ZIP e RAR de forma simples.",
  pathname: "/ferramentas/arquivos",
});

export const metadata: Metadata = {
  ...baseMetadata,
  robots: noIndexRobots,
};

export default function ArquivosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ArquivosHubEditorial />
    </>
  );
}
