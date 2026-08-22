import { HubEditorialContent } from "@/components/tools/hub-editorial-content";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Ferramentas de Texto Online: palavras, caracteres e leitura",
  description: "Analise palavras, caracteres, frases, parágrafos, linhas, frequência de termos e tempos estimados de leitura e fala com ferramentas online do Kivai.",
  pathname: "/ferramentas/texto",
});

export default function TextoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <HubEditorialContent hub="texto" />
    </>
  );
}
