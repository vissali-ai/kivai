import { getPageMetadata } from "@/lib/seo";
import { EmpresasHubEditorial } from "@/components/tools/empresas-hub-editorial";

const baseMetadata = getPageMetadata({
  title: "Ferramentas para Empresas: CNPJ, CNAE, NCM e Domínios .BR",
  description:
    "Consulte CNPJ, CNAE, NCM, bancos e domínios .BR em ferramentas online para empresas, comércio e rotinas administrativas.",
  pathname: "/ferramentas/empresas",
});

export const metadata = baseMetadata;

export default function EmpresasLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <EmpresasHubEditorial />
    </>
  );
}
