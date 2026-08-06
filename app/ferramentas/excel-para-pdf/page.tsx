import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { getToolMetadata } from "@/lib/seo";
import ExcelParaPdfClient from "./excel-para-pdf-client";

export const metadata = getToolMetadata("excel-para-pdf");

const faq = [
  ["Como converter Excel para PDF?", "Selecione o XLSX, escolha e ordene as abas, ajuste a página, confira a prévia e clique em Converter para PDF."],
  ["A ferramenta aceita arquivos XLSX?", "Sim. O formato aceito nesta versão é XLSX. Arquivos XLS devem ser salvos como XLSX antes do envio."],
  ["Posso escolher quais abas serão convertidas?", "Sim. Você pode selecionar, excluir e restaurar abas antes de preparar o PDF."],
  ["Posso alterar a ordem das abas?", "Sim. Use os botões de mover para cima e para baixo; essa será a ordem das páginas no PDF."],
  ["Como impedir que as colunas sejam cortadas?", "Use Ajustar todas as colunas em uma página, orientação paisagem e margens pequenas."],
  ["Posso usar orientação paisagem?", "Sim. Escolha paisagem manualmente ou deixe a orientação automática avaliar a largura da aba."],
  ["As fórmulas serão preservadas?", "O PDF mostra o resultado armazenado da fórmula, não a fórmula editável. Resultados não salvos no XLSX podem ficar em branco."],
  ["Os gráficos aparecerão no PDF?", "Gráficos e elementos avançados não têm fidelidade garantida nesta versão. A ferramenta apresenta um aviso quando detecta esses elementos."],
  ["As imagens da planilha serão mantidas?", "Imagens e objetos incorporados podem apresentar diferenças ou não ser posicionados como no Excel; confira sempre a prévia."],
  ["Posso converter Excel para PDF pelo celular?", "Sim, em navegadores modernos. Planilhas grandes podem exigir mais memória e funcionar melhor em um computador."],
  ["Qual é o tamanho máximo permitido?", "Cada arquivo pode ter até 25 MB, 20 abas, 50 mil células utilizadas e gerar até 100 páginas."],
  ["Posso incluir abas ocultas?", "Sim. Ative Incluir abas ocultas; por padrão elas ficam fora da conversão."],
  ["As linhas de grade aparecerão?", "Você pode mostrar, ocultar ou usar o modo automático, que exibe a grade quando a planilha não possui bordas próprias."],
  ["Por que o PDF ficou com muitas páginas?", "Isso pode ocorrer com muitas linhas, colunas largas ou tamanho original. Ajuste a escala, as margens ou selecione menos abas."],
  ["Posso imprimir o arquivo depois da conversão?", "Sim. O PDF gerado é adequado para leitura, compartilhamento, arquivamento e impressão."],
] as const;

const schema = [
  { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Excel para PDF", applicationCategory: "UtilitiesApplication", operatingSystem: "Qualquer sistema com navegador moderno", url: "https://kivai.com.br/ferramentas/excel-para-pdf", description: "Conversor online de planilhas XLSX para documentos PDF.", offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" } },
  { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: "https://kivai.com.br" }, { "@type": "ListItem", position: 2, name: "PDF", item: "https://kivai.com.br/ferramentas/pdfs" }, { "@type": "ListItem", position: 3, name: "Excel para PDF", item: "https://kivai.com.br/ferramentas/excel-para-pdf" }] },
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) },
];

const benefits = ["Escolha e ordene as abas", "Orientação automática ou manual", "A4, Carta e Ofício", "Escala e margens configuráveis", "Prévia das páginas", "PDF pronto para imprimir e compartilhar"];

export default function ExcelParaPdfPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><ExcelParaPdfClient /><section className="border-t border-border bg-muted/10 py-12 sm:py-16"><div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Por que converter Excel para PDF?</h2><p className="mt-4 leading-7 text-muted-foreground">O PDF cria uma versão fixa da planilha para compartilhar relatórios, enviar demonstrativos, apresentar resultados, evitar alterações acidentais, imprimir informações e arquivar documentos com uma leitura consistente.</p></article>
    <div className="grid gap-6 lg:grid-cols-2"><article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Como converter Excel para PDF</h2><ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-muted-foreground"><li>Selecione a planilha XLSX.</li><li>Escolha e ordene as abas.</li><li>Ajuste orientação, papel, escala e margens.</li><li>Confira a pré-visualização.</li><li>Clique em <strong className="text-foreground">Converter para PDF</strong>.</li><li>Baixe o documento gerado.</li></ol></article><article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Recursos disponíveis</h2><ul className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">{benefits.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{item}</li>)}</ul></article></div>
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">O layout será preservado?</h2><p className="mt-4 leading-7 text-muted-foreground">A conversão busca manter textos, números, resultados armazenados de fórmulas, cores, alinhamentos, bordas, células mescladas e dimensões principais. Planilhas com gráficos, imagens, áreas de impressão, objetos ou recursos exclusivos do Excel podem apresentar diferenças; use a prévia para conferir o resultado.</p></article>
    <div className="grid gap-6 lg:grid-cols-2"><article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Como evitar colunas cortadas</h2><p className="mt-4 leading-7 text-muted-foreground">Escolha orientação paisagem, ajuste todas as colunas em uma página e teste margens pequenas. Também ajuda converter somente as abas necessárias e remover áreas vazias ou colunas sem uso no arquivo original.</p></article><article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Fórmulas e edição</h2><p className="mt-4 leading-7 text-muted-foreground">O PDF exibe os resultados que estavam calculados e armazenados no XLSX, mas não mantém fórmulas editáveis. O documento final é voltado para leitura, compartilhamento e impressão, não para continuar os cálculos.</p></article></div>
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Planilhas com gráficos e imagens</h2><p className="mt-4 leading-7 text-muted-foreground">Gráficos, imagens e elementos avançados podem não conservar a mesma posição ou aparência do Microsoft Excel nesta conversão local. Quando esses objetos são detectados, a ferramenta avisa antes de gerar o PDF para que você possa revisar a prévia.</p></article>
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Perguntas frequentes</h2><div className="mt-5 space-y-3">{faq.map(([question, answer]) => <details key={question} className="rounded-lg border border-border p-4"><summary className="cursor-pointer font-medium">{question}</summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p></details>)}</div></article>
    <nav aria-label="Ferramentas relacionadas" className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Ferramentas relacionadas</h2><div className="mt-4 flex flex-wrap gap-3"><LinkCard href="/ferramentas/pdf-para-excel">PDF para Excel</LinkCard><LinkCard href="/ferramentas/pdf-para-word">PDF para Word</LinkCard><LinkCard href="/ferramentas/word-para-pdf">Word para PDF</LinkCard><LinkCard href="/ferramentas/pdf-para-powerpoint">PDF para PowerPoint</LinkCard><LinkCard href="/ferramentas/powerpoint-para-pdf">PowerPoint para PDF</LinkCard><LinkCard href="/ferramentas/pdf-para-imagens">PDF para Imagens</LinkCard><LinkCard href="/ferramentas/imagens-para-pdf">Imagens para PDF</LinkCard><LinkCard href="/ferramentas/compactar-pdf">Compactar PDF</LinkCard><LinkCard href="/ferramentas/dividir-pdf">Dividir PDF</LinkCard></div></nav>
  </div></section></>;
}

function LinkCard({ href, children }: { href: string; children: React.ReactNode }) { return <Link href={href} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary">{children}</Link>; }
