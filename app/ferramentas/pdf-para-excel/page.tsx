import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { getToolMetadata } from "@/lib/seo";
import PdfParaExcelClient from "./pdf-para-excel-client";

export const metadata = getToolMetadata("pdf-para-excel");

const faq = [
  ["Como converter PDF para Excel gratuitamente?", "Selecione um PDF, escolha as páginas, clique em Analisar PDF, revise as tabelas encontradas e use Converter para Excel para gerar o arquivo XLSX."],
  ["O resultado fica editável?", "Sim. As células podem ser editadas na prévia e o arquivo XLSX pode ser aberto no Microsoft Excel, LibreOffice Calc e aplicativos compatíveis."],
  ["A ferramenta reconhece qualquer tabela?", "Ela identifica tabelas a partir da posição dos textos no PDF. Layouts regulares costumam produzir resultados melhores; documentos complexos podem exigir ajustes na prévia."],
  ["PDF digitalizado funciona?", "Não nesta versão. PDFs formados apenas por imagens precisam de OCR, recurso que ainda não faz parte desta ferramenta."],
  ["Qual é o limite de tamanho do PDF?", "O arquivo pode ter até 25 MB."],
  ["Quantas páginas podem ser analisadas?", "A ferramenta aceita PDFs com até 50 páginas e permite selecionar somente as páginas necessárias."],
  ["Existe limite de dados extraídos?", "Sim. Para manter o navegador estável, a conversão é limitada a 50.000 células."],
  ["Posso escolher páginas específicas?", "Sim. Selecione miniaturas individualmente ou informe intervalos como 1-5 e listas como 1,3,7."],
  ["Posso excluir uma tabela encontrada?", "Sim. Cada tabela possui um controle para ser incluída ou ignorada no arquivo final."],
  ["É possível corrigir os dados antes de baixar?", "Sim. Você pode editar células, remover linhas vazias, excluir linhas e colunas e restaurar os dados detectados."],
  ["Cada tabela vira uma planilha?", "Você escolhe entre criar uma aba para cada tabela ou reunir todas as tabelas em uma única planilha."],
  ["Datas, moedas e porcentagens são reconhecidas?", "A detecção automática tenta converter esses valores com segurança. Se preferir, você pode manter todo o conteúdo como texto."],
  ["Números com zero à esquerda são preservados?", "Sim. Identificadores como CEP, CPF, CNPJ e códigos com zero inicial são mantidos como texto para evitar perda de informação."],
  ["Posso baixar em CSV?", "Sim, quando apenas uma tabela estiver selecionada, a página também oferece o download em CSV."],
  ["PDF protegido por senha pode ser usado?", "Não. Remova a senha ou a proteção antes de analisar o documento."],
] as const;

const schema = [
  { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "PDF para Excel", applicationCategory: "UtilitiesApplication", operatingSystem: "Qualquer sistema com navegador moderno", url: "https://kivai.com.br/ferramentas/pdf-para-excel", description: "Conversor online de tabelas em PDF para planilhas Excel no formato XLSX.", offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" } },
  { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: "https://kivai.com.br" }, { "@type": "ListItem", position: 2, name: "PDF", item: "https://kivai.com.br/ferramentas/pdfs" }, { "@type": "ListItem", position: 3, name: "PDF para Excel", item: "https://kivai.com.br/ferramentas/pdf-para-excel" }] },
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) },
];

const benefits = ["Prévia editável antes da exportação", "Seleção de páginas e tabelas", "Uma aba por tabela ou planilha única", "Detecção segura de números e datas", "Preservação de códigos e identificadores", "Download em XLSX e CSV para uma tabela"];

export default function PdfParaExcelPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><PdfParaExcelClient /><section className="border-t border-border bg-muted/10 py-12 sm:py-16"><div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">O que é PDF para Excel?</h2><p className="mt-4 leading-7 text-muted-foreground">PDF para Excel é uma ferramenta que localiza textos organizados como tabelas em documentos PDF digitais e os transforma em células de uma planilha XLSX. Antes de exportar, você pode conferir e corrigir os dados encontrados.</p></article>
    <div className="grid gap-6 lg:grid-cols-2"><article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Quando utilizar</h2><p className="mt-4 leading-7 text-muted-foreground">Use para reaproveitar extratos, inventários, listas de produtos, demonstrativos, relatórios financeiros, tabelas acadêmicas ou administrativas que chegaram em PDF e precisam ser filtradas, calculadas ou reorganizadas.</p></article><article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Recursos da conversão</h2><ul className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">{benefits.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{item}</li>)}</ul></article></div>
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Como converter PDF em Excel</h2><ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-muted-foreground"><li>Envie um arquivo PDF de até 25 MB e confira suas páginas.</li><li>Selecione todas as páginas ou informe apenas os intervalos que contêm tabelas.</li><li>Clique em <strong className="text-foreground">Analisar PDF</strong> para localizar os dados estruturados.</li><li>Edite células, nomes das abas, linhas e colunas na prévia.</li><li>Escolha as opções de cabeçalho, organização e formatação numérica.</li><li>Clique em <strong className="text-foreground">Converter para Excel</strong> e baixe o XLSX.</li></ol></article>
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Formatação dos dados</h2><p className="mt-4 leading-7 text-muted-foreground">A detecção automática diferencia números, moedas, porcentagens e datas, mas preserva como texto códigos com zeros à esquerda e identificadores como CPF, CNPJ e CEP. Células iniciadas por caracteres de fórmula são neutralizadas para que o conteúdo seja aberto com segurança na planilha.</p></article>
    <div className="grid gap-6 lg:grid-cols-2"><article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Limitação para PDFs digitalizados</h2><p className="mt-4 leading-7 text-muted-foreground">Esta versão trabalha com texto existente dentro do PDF. Se uma página for apenas uma fotografia ou digitalização, será necessário usar OCR antes da conversão.</p></article><article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Como melhorar o resultado</h2><p className="mt-4 leading-7 text-muted-foreground">Prefira documentos com texto selecionável, colunas alinhadas e cabeçalhos claros. Analise somente as páginas úteis e revise especialmente tabelas com células mescladas, textos sobrepostos, várias colunas de página ou linhas quebradas.</p></article></div>
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Perguntas frequentes</h2><div className="mt-5 space-y-3">{faq.map(([question, answer]) => <details key={question} className="rounded-lg border border-border p-4"><summary className="cursor-pointer font-medium">{question}</summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p></details>)}</div></article>
    <nav aria-label="Ferramentas relacionadas" className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Ferramentas relacionadas</h2><div className="mt-4 flex flex-wrap gap-3"><LinkCard href="/ferramentas/excel-para-pdf">Excel para PDF</LinkCard><LinkCard href="/ferramentas/pdf-para-word">PDF para Word</LinkCard><LinkCard href="/ferramentas/word-para-pdf">Word para PDF</LinkCard><LinkCard href="/ferramentas/pdf-para-powerpoint">PDF para PowerPoint</LinkCard><LinkCard href="/ferramentas/powerpoint-para-pdf">PowerPoint para PDF</LinkCard><LinkCard href="/ferramentas/pdf-para-imagens">PDF para Imagens</LinkCard><LinkCard href="/ferramentas/dividir-pdf">Dividir PDF</LinkCard><LinkCard href="/ferramentas/compactar-pdf">Compactar PDF</LinkCard></div></nav>
  </div></section></>;
}

function LinkCard({ href, children }: { href: string; children: React.ReactNode }) { return <Link href={href} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary">{children}</Link>; }
