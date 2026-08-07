import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { getToolMetadata } from "@/lib/seo";
import WordParaPdfClient from "./word-para-pdf-client";

export const metadata = getToolMetadata("word-para-pdf");

const faq = [
  ["Como converter Word para PDF?", "Selecione um documento DOCX, confira a pré-visualização, ajuste orientação e tamanho de página se desejar, clique em Converter para PDF e baixe o resultado."],
  ["A ferramenta Word para PDF é gratuita?", "Sim. A conversão pode ser feita gratuitamente pelo navegador, sem instalação de programas."],
  ["Meu documento será armazenado?", "Não. Nesta implementação, a leitura do DOCX e a geração do PDF acontecem localmente no navegador; o arquivo não é enviado ao Kivai."],
  ["A formatação do Word será mantida?", "A conversão busca preservar textos, títulos, listas, imagens, tabelas, cabeçalhos, rodapés e quebras de página. Elementos avançados e fontes indisponíveis podem apresentar diferenças."],
  ["Posso converter Word para PDF pelo celular?", "Sim, em navegadores modernos com memória suficiente. Documentos grandes ou com muitas imagens podem funcionar melhor em um computador."],
  ["Qual é o tamanho máximo do arquivo?", "O limite atual é de 20 MB para um documento DOCX por conversão."],
  ["A ferramenta aceita arquivos DOC antigos?", "Não. Arquivos DOC usam um formato antigo diferente. Abra o arquivo em um editor compatível, salve como DOCX e tente novamente."],
  ["Posso converter documentos com imagens e tabelas?", "Sim. Imagens e tabelas compatíveis são renderizadas nas páginas do PDF junto com o restante do documento."],
  ["Por que o PDF ficou diferente do Word?", "Fontes não instaladas, tabelas complexas, colunas, caixas de texto, equações e objetos incorporados podem ser interpretados de maneira diferente pelo navegador."],
  ["Posso editar o arquivo depois da conversão?", "O PDF é indicado para compartilhar e imprimir. Para alterar o conteúdo, edite o DOCX original e faça uma nova conversão."],
] as const;

const schema = [
  { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Word para PDF", applicationCategory: "UtilitiesApplication", operatingSystem: "Qualquer sistema com navegador moderno", url: "https://www.kivai.com.br/ferramentas/word-para-pdf", description: "Conversor online de documentos DOCX do Word para PDF.", offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" } },
  { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: "https://www.kivai.com.br" }, { "@type": "ListItem", position: 2, name: "PDF", item: "https://www.kivai.com.br/ferramentas/pdfs" }, { "@type": "ListItem", position: 3, name: "Word para PDF", item: "https://www.kivai.com.br/ferramentas/word-para-pdf" }] },
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) },
];

export default function WordParaPdfPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><WordParaPdfClient /><section className="border-t border-border bg-muted/10 py-12 sm:py-16"><div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Como converter Word para PDF</h2><ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-muted-foreground"><li>Selecione seu arquivo DOCX.</li><li>Confira o documento e a pré-visualização das páginas.</li><li>Ajuste orientação e tamanho da página, caso necessário.</li><li>Clique em <strong className="text-foreground">Converter para PDF</strong>.</li><li>Revise a prévia e baixe o arquivo gerado.</li></ol></article>
    <div className="grid gap-6 lg:grid-cols-2"><article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">O que é um arquivo DOCX?</h2><p className="mt-4 leading-7 text-muted-foreground">DOCX é o formato moderno utilizado pelo Microsoft Word e por diversos editores de documentos. Ele reúne textos, estilos, imagens, tabelas e configurações de página em um pacote estruturado que pode ser editado.</p></article><article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Por que transformar Word em PDF?</h2><p className="mt-4 leading-7 text-muted-foreground">O PDF facilita o compartilhamento, mantém a aparência mais estável entre dispositivos e é adequado para impressão. É útil para contratos, propostas, currículos, trabalhos acadêmicos e documentos comerciais.</p></article></div>
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">A formatação será preservada?</h2><p className="mt-4 leading-7 text-muted-foreground">Textos, títulos, parágrafos, listas, tabelas, imagens, alinhamentos e quebras de página tendem a ser mantidos. Fontes não disponíveis, notas, tabelas complexas, colunas, caixas de texto, gráficos e equações podem apresentar diferenças. Confira a pré-visualização antes de baixar.</p></article>
    <div className="grid gap-6 lg:grid-cols-3"><Info title="Word para PDF funciona no celular?">A interface é responsiva e funciona em navegadores modernos. Para documentos grandes ou com muitas imagens, um computador costuma oferecer mais memória.</Info><Info title="É seguro converter Word para PDF?">O processamento ocorre localmente no navegador. O conteúdo do documento não é enviado ao Kivai e é descartado ao fechar ou reiniciar a ferramenta.</Info><Info title="DOCX e DOC são a mesma coisa?">Não. DOC é um formato binário antigo. Esta versão aceita somente DOCX e informa claramente quando um arquivo DOC é selecionado.</Info></div>
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Perguntas frequentes</h2><div className="mt-5 space-y-3">{faq.map(([question, answer]) => <details key={question} className="rounded-lg border border-border p-4"><summary className="cursor-pointer font-medium">{question}</summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p></details>)}</div></article>
    <nav aria-label="Ferramentas relacionadas" className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Ferramentas relacionadas</h2><div className="mt-4 flex flex-wrap gap-3"><Related href="/ferramentas/pdf-para-word">PDF para Word</Related><Related href="/ferramentas/imagens-para-pdf">Imagens para PDF</Related><Related href="/ferramentas/pdf-para-imagens">PDF para Imagens</Related><Related href="/ferramentas/unir-pdfs">Unir PDF</Related><Related href="/ferramentas/dividir-pdf">Dividir PDF</Related><Related href="/ferramentas/compactar-pdf">Compactar PDF</Related><Related href="/ferramentas/girar-pdf">Girar PDF</Related></div></nav>
  </div></section></>;
}

function Info({ title, children }: { title: string; children: React.ReactNode }) { return <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><CheckCircle2 className="size-5 text-primary" /><h2 className="mt-4 text-xl font-semibold">{title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{children}</p></article>; }
function Related({ href, children }: { href: string; children: React.ReactNode }) { return <Link href={href} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary">{children}</Link>; }
