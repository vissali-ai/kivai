import { HubEditorialContent } from "@/components/tools/hub-editorial-content";
import { getCmsHubMetadata, getPageMetadata } from "@/lib/seo";

const baseMetadata = getPageMetadata({
  title: "Ferramentas de Texto Online: palavras, caracteres e leitura",
  description: "Analise palavras, caracteres, frases, parágrafos, linhas, frequência de termos e tempos estimados de leitura e fala com ferramentas online do Kivai.",
  pathname: "/ferramentas/texto",
});
export async function generateMetadata() { return getCmsHubMetadata("texto", baseMetadata); }

export default function TextoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <HubEditorialContent hub="texto" />
    </>
  );
}
