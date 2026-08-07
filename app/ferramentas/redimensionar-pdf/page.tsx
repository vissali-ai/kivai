import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { getToolMetadata } from "@/lib/seo";
import RedimensionarPdfClient from "./redimensionar-pdf-client";

const toolMetadata = getToolMetadata("redimensionar-pdf");
export const metadata = { ...toolMetadata, title: { absolute: "Redimensionar PDF para A4, A3, A5 e outros | Kivai" } };

const faq = [
  ["Como redimensionar um PDF?", "Selecione o PDF, escolha um formato, defina orientação, modo de ajuste e margens, confira a prévia e gere o novo arquivo."],
  ["Posso transformar PDF em A4?", "Sim. Escolha A4 para criar páginas de 210 × 297 mm em retrato ou 297 × 210 mm em paisagem."],
  ["Posso converter PDF A4 para A3?", "Sim. O conteúdo pode ser ampliado proporcionalmente para A3 ou ajustado conforme o modo escolhido."],
  ["Posso transformar A3 em A4?", "Sim. Use Ajustar página inteira para reduzir o conteúdo proporcionalmente e mantê-lo visível."],
  ["Quais tamanhos estão disponíveis?", "A ferramenta oferece A6, A5, A4, A3, A2 e A1 com dimensões oficiais convertidas de milímetros para pontos PDF."],
  ["Qual é a diferença entre A4 e A5?", "O A4 mede 210 × 297 mm. O A5 mede 148 × 210 mm e corresponde aproximadamente à metade de uma folha A4."],
  ["O conteúdo do PDF será cortado?", "Ajustar página inteira não corta. Preencher e Manter tamanho original podem cortar bordas; a prévia e os avisos indicam esse risco."],
  ["Como manter todo o conteúdo visível?", "Escolha Ajustar página inteira. O conteúdo é redimensionado proporcionalmente dentro da área disponível, podendo criar margens."],
  ["Posso alterar a orientação?", "Sim. Você pode manter a orientação individual de cada página ou forçar retrato ou paisagem."],
  ["Posso adicionar margens?", "Sim. Há margens de 0, 5, 10 e 20 mm, além de valores personalizados para cada lado."],
  ["O PDF perde qualidade?", "Textos, vetores e imagens são incorporados como conteúdo PDF, sem rasterizar a página inteira. Ampliações grandes podem evidenciar limitações de imagens de baixa resolução."],
  ["Posso redimensionar apenas algumas páginas?", "Sim. Selecione páginas nas miniaturas ou use intervalos como 1-5, 1,3,7 ou 2-4,8. As demais páginas são preservadas com o tamanho original."],
  ["PDFs com páginas diferentes são compatíveis?", "Sim. A ferramenta detecta tamanhos mistos, mostra um aviso e calcula o ajuste de cada página separadamente."],
  ["A ferramenta funciona no celular?", "Sim. Upload, configurações, seleção de páginas, prévia e download se adaptam a telas menores."],
  ["Qual é o tamanho máximo permitido?", "É aceito um PDF por vez, com até 25 MB e no máximo 100 páginas."],
  ["O arquivo final continuará sendo PDF?", "Sim. O resultado é um novo arquivo PDF válido, com a ordem das páginas preservada."],
] as const;

const schema = [
  { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Redimensionar PDF", applicationCategory: "UtilitiesApplication", operatingSystem: "Qualquer sistema com navegador moderno", url: "https://www.kivai.com.br/ferramentas/redimensionar-pdf", description: "Redimensionador online de páginas PDF para os formatos A6, A5, A4, A3, A2 e A1.", offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" } },
  { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: "https://www.kivai.com.br" }, { "@type": "ListItem", position: 2, name: "PDF", item: "https://www.kivai.com.br/ferramentas/pdfs" }, { "@type": "ListItem", position: 3, name: "Redimensionar PDF", item: "https://www.kivai.com.br/ferramentas/redimensionar-pdf" }] },
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) },
];

const formats = ["A6 para cartões, convites e materiais pequenos", "A5 para agendas, apostilas e flyers", "A4 para documentos e impressão comum", "A3 para cartazes, tabelas e projetos", "A2 para pôsteres e apresentações visuais", "A1 para plantas, exposições e materiais grandes"];

export default function RedimensionarPdfPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\u003c") }} /><RedimensionarPdfClient /><section className="border-t border-border bg-muted/10 py-12 sm:py-16"><div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Como redimensionar um PDF</h2><ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-muted-foreground"><li>Selecione o arquivo PDF.</li><li>Escolha o tamanho desejado.</li><li>Defina a orientação.</li><li>Escolha como o conteúdo será ajustado.</li><li>Confira a pré-visualização.</li><li>Clique em <strong className="text-foreground">Redimensionar PDF</strong>.</li><li>Baixe o novo arquivo.</li></ol></article>
    <div className="grid gap-6 lg:grid-cols-2"><article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Qual tamanho escolher</h2><ul className="mt-4 space-y-3 text-sm text-muted-foreground">{formats.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{item}</li>)}</ul></article><article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">O conteúdo será cortado?</h2><p className="mt-4 leading-7 text-muted-foreground">Ajustar página inteira preserva toda a página e pode criar margens. Preencher ocupa a área e pode cortar bordas. Esticar ocupa todo o formato, mas altera a proporção. Manter tamanho original centraliza sem ampliar nem reduzir e pode cortar quando o novo papel for menor.</p></article></div>
    <div className="grid gap-6 lg:grid-cols-2"><article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">O PDF perde qualidade?</h2><p className="mt-4 leading-7 text-muted-foreground">O redimensionamento incorpora a página como conteúdo PDF e preserva textos, vetores e imagens sem converter toda a página em uma fotografia. Imagens de baixa resolução podem parecer menos nítidas quando ampliadas para formatos grandes.</p></article><article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">De A4 para A3 ou de A3 para A4</h2><p className="mt-4 leading-7 text-muted-foreground">Um A4 pode ser ampliado para A3 e um A3 pode ser reduzido para A4. No modo proporcional, a escala é calculada a partir da área disponível depois das margens, mantendo o conteúdo centralizado.</p></article></div>
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Perguntas frequentes</h2><div className="mt-5 space-y-3">{faq.map(([question, answer]) => <details key={question} className="rounded-lg border border-border p-4"><summary className="cursor-pointer font-medium">{question}</summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p></details>)}</div></article>
    <nav aria-label="Ferramentas relacionadas" className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Ferramentas relacionadas</h2><div className="mt-4 flex flex-wrap gap-3"><LinkCard href="/ferramentas/editar-pdf">Editar PDF</LinkCard><LinkCard href="/ferramentas/girar-pdf">Girar PDF</LinkCard><LinkCard href="/ferramentas/dividir-pdf">Dividir PDF</LinkCard><LinkCard href="/ferramentas/unir-pdfs">Unir PDFs</LinkCard><LinkCard href="/ferramentas/compactar-pdf">Compactar PDF</LinkCard><LinkCard href="/ferramentas/imagens-para-pdf">Imagens para PDF</LinkCard><LinkCard href="/ferramentas/pdf-para-imagens">PDF para Imagens</LinkCard></div></nav>
  </div></section></>;
}

function LinkCard({ href, children }: { href: string; children: React.ReactNode }) { return <Link href={href} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary">{children}</Link>; }
