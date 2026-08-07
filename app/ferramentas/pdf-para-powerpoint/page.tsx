import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { getToolMetadata } from "@/lib/seo";
import PdfParaPowerPointClient from "./pdf-para-powerpoint-client";

export const metadata = getToolMetadata("pdf-para-powerpoint");

const faq = [
  ["Como converter PDF para PowerPoint?", "Selecione o PDF, confira as miniaturas, escolha e organize as páginas, ajuste formato e qualidade, converta e baixe o arquivo PPTX."],
  ["A ferramenta gera um arquivo PPTX?", "Sim. O resultado é uma apresentação PowerPoint válida no formato PPTX."],
  ["Cada página do PDF vira um slide?", "Sim. Cada página selecionada gera um slide na ordem definida na ferramenta."],
  ["Os textos ficarão editáveis?", "Não separadamente. Cada página é inserida como uma imagem para preservar melhor o visual do PDF."],
  ["Posso escolher quais páginas converter?", "Sim. É possível selecionar, desmarcar ou excluir páginas antes da conversão."],
  ["Posso mudar a ordem dos slides?", "Sim. Reordene arrastando as miniaturas ou usando os botões de subir e descer."],
  ["A ferramenta funciona no celular?", "A interface é responsiva e oferece botões de ordenação adequados para telas sensíveis ao toque. PDFs grandes podem exigir mais memória."],
  ["Qual é o tamanho máximo do PDF?", "O limite atual é de 25 MB por arquivo."],
  ["Existe limite de páginas?", "Sim. Cada PDF pode ter até 50 páginas. Para documentos maiores, use a ferramenta Dividir PDF."],
  ["PDFs protegidos podem ser convertidos?", "Não. Remova a proteção do arquivo antes de tentar a conversão."],
  ["A qualidade das páginas será mantida?", "A renderização preserva a aparência e oferece qualidade padrão ou alta. O resultado também depende da resolução do PDF original."],
  ["Posso editar a apresentação depois do download?", "Você pode reorganizar, duplicar e complementar os slides, mas o conteúdo original da página permanece como uma imagem única."],
] as const;

const schema = [
  { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "PDF para PowerPoint", applicationCategory: "UtilitiesApplication", operatingSystem: "Qualquer sistema com navegador moderno", url: "https://www.kivai.com.br/ferramentas/pdf-para-powerpoint", description: "Conversor online de páginas PDF para apresentações PowerPoint PPTX.", offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" } },
  { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: "https://www.kivai.com.br" }, { "@type": "ListItem", position: 2, name: "PDF", item: "https://www.kivai.com.br/ferramentas/pdfs" }, { "@type": "ListItem", position: 3, name: "PDF para PowerPoint", item: "https://www.kivai.com.br/ferramentas/pdf-para-powerpoint" }] },
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) },
];

export default function PdfParaPowerPointPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><PdfParaPowerPointClient /><section className="border-t border-border bg-muted/10 py-12 sm:py-16"><div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Como converter PDF para PowerPoint</h2><ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-muted-foreground"><li>Selecione o arquivo PDF.</li><li>Confira as páginas carregadas e escolha quais deseja converter.</li><li>Organize a ordem dos futuros slides.</li><li>Ajuste formato, encaixe e qualidade.</li><li>Clique em <strong className="text-foreground">Converter para PowerPoint</strong>.</li><li>Baixe a apresentação em PPTX.</li></ol></article>
    <div className="grid gap-6 lg:grid-cols-2"><Info title="O que acontece durante a conversão">Cada página selecionada é renderizada em alta resolução e inserida como imagem em um slide. Essa estratégia prioriza fidelidade visual e reduz o risco de quebra do layout.</Info><Info title="O PowerPoint será editável?">Os slides podem ser reorganizados, duplicados e complementados. Textos, tabelas e imagens da página original não ficam necessariamente editáveis como objetos separados.</Info></div>
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Quando usar PDF para PowerPoint</h2><p className="mt-4 leading-7 text-muted-foreground">A conversão é útil para apresentações comerciais, materiais de treinamento, apostilas, propostas, relatórios, portfólios, apresentações acadêmicas e documentos preparados para reuniões.</p></article>
    <div className="grid gap-6 lg:grid-cols-2"><Info title="Como melhorar o resultado">Prefira PDFs com boa resolução, páginas sem proteção, margens adequadas e quantidade moderada de páginas. Use Alta qualidade quando textos pequenos precisarem de maior nitidez.</Info><Info title="PDF para PowerPoint funciona no celular?">Sim, em navegadores modernos. A grade e os controles se adaptam ao celular, mas arquivos extensos podem funcionar melhor em dispositivos com mais memória.</Info></div>
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Perguntas frequentes</h2><div className="mt-5 space-y-3">{faq.map(([question, answer]) => <details key={question} className="rounded-lg border border-border p-4"><summary className="cursor-pointer font-medium">{question}</summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p></details>)}</div></article>
    <nav aria-label="Ferramentas relacionadas" className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Ferramentas relacionadas</h2><div className="mt-4 flex flex-wrap gap-3"><Related href="/ferramentas/powerpoint-para-pdf">PowerPoint para PDF</Related><Related href="/ferramentas/pdf-para-word">PDF para Word</Related><Related href="/ferramentas/word-para-pdf">Word para PDF</Related><Related href="/ferramentas/pdf-para-imagens">PDF para Imagens</Related><Related href="/ferramentas/imagens-para-pdf">Imagens para PDF</Related><Related href="/ferramentas/dividir-pdf">Dividir PDF</Related><Related href="/ferramentas/compactar-pdf">Compactar PDF</Related><Related href="/ferramentas/girar-pdf">Girar PDF</Related></div></nav>
  </div></section></>;
}

function Info({ title, children }: { title: string; children: React.ReactNode }) { return <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><CheckCircle2 className="size-5 text-primary" /><h2 className="mt-4 text-xl font-semibold">{title}</h2><p className="mt-3 leading-7 text-muted-foreground">{children}</p></article>; }
function Related({ href, children }: { href: string; children: React.ReactNode }) { return <Link href={href} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary">{children}</Link>; }
