import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { getToolMetadata } from "@/lib/seo";
import PdfParaWordClient from "./pdf-para-word-client";

export const metadata = getToolMetadata("pdf-para-word");

const faq = [
  ["Como converter PDF para Word gratuitamente?", "Selecione um ou mais PDFs, clique em Converter para Word e aguarde. O DOCX é baixado automaticamente quando estiver pronto."],
  ["O arquivo Word fica editável?", "Sim. Textos reconhecidos no PDF são inseridos em um documento DOCX editável, incluindo títulos, parágrafos e listas quando identificados."],
  ["A formatação original é mantida?", "A ferramenta procura preservar hierarquia, tamanho do texto, negrito, itálico, alinhamento, recuos, listas e quebras de página. PDFs complexos podem exigir pequenos ajustes."],
  ["Posso converter vários PDFs ao mesmo tempo?", "Sim. Ao enviar vários PDFs, cada um é convertido em um DOCX e os resultados são reunidos em um arquivo ZIP."],
  ["Qual é o limite de tamanho?", "Cada arquivo PDF pode ter até 20 MB, seguindo o limite padrão das ferramentas de documentos do Kivai."],
  ["Meus arquivos são enviados para algum servidor?", "Não. O processamento acontece localmente no navegador, mantendo os documentos no seu dispositivo."],
  ["PDF digitalizado pode ser convertido?", "PDFs compostos apenas por imagens precisam de OCR para reconhecer o texto. Esta versão converte o texto já presente no arquivo PDF."],
  ["PDF protegido por senha funciona?", "Não. Remova a senha ou a restrição do PDF antes de realizar a conversão."],
  ["Funciona no celular?", "Sim, em navegadores modernos. Para arquivos grandes, um computador pode oferecer mais memória e melhor desempenho."],
] as const;

const schema = [
  { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "PDF para Word", applicationCategory: "UtilitiesApplication", operatingSystem: "Qualquer sistema com navegador moderno", url: "https://www.kivai.com.br/ferramentas/pdf-para-word", description: "Conversor online de PDF para documentos editáveis do Word em formato DOCX.", offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" } },
  { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: "https://www.kivai.com.br" }, { "@type": "ListItem", position: 2, name: "PDF", item: "https://www.kivai.com.br/ferramentas/pdfs" }, { "@type": "ListItem", position: 3, name: "PDF para Word", item: "https://www.kivai.com.br/ferramentas/pdf-para-word" }] },
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) },
];

const benefits = ["Documento DOCX realmente editável", "Conversão de vários PDFs de uma vez", "Processamento local e privado", "Preservação de títulos, listas e estilos", "Download automático ao finalizar", "Uso online sem instalar programas"];

export default function PdfParaWordPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><PdfParaWordClient /><section className="border-t border-border bg-muted/10 py-12 sm:py-16"><div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">O que é PDF para Word?</h2><p className="mt-4 leading-7 text-muted-foreground">PDF para Word é uma ferramenta que transforma o conteúdo de um arquivo PDF em um documento Microsoft Word no formato DOCX. O resultado permite editar textos, reorganizar parágrafos, corrigir informações e reutilizar o conteúdo sem recriar o documento do zero.</p></article>
    <div className="grid gap-6 lg:grid-cols-2"><article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Quando utilizar</h2><p className="mt-4 leading-7 text-muted-foreground">Use o conversor para atualizar contratos e relatórios, reaproveitar trabalhos acadêmicos, revisar propostas, extrair conteúdo de manuais ou recuperar um documento quando o arquivo original do Word não estiver disponível.</p></article><article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Principais vantagens</h2><ul className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">{benefits.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{item}</li>)}</ul></article></div>
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Como converter PDF em Word</h2><ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-muted-foreground"><li>Clique na área de upload ou arraste um ou vários arquivos PDF.</li><li>Confira nome, tamanho e quantidade de páginas de cada documento.</li><li>Clique em <strong className="text-foreground">Converter para Word</strong> e acompanhe o progresso.</li><li>O DOCX — ou ZIP, no caso de vários arquivos — será baixado automaticamente.</li><li>Abra o resultado no Microsoft Word, LibreOffice ou editor compatível e revise o conteúdo.</li></ol></article>
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Dicas para manter a formatação</h2><p className="mt-4 leading-7 text-muted-foreground">Prefira PDFs com texto selecionável e fontes incorporadas. Documentos com colunas, tabelas irregulares, formulários, escrita manual ou páginas digitalizadas podem precisar de revisão. Depois da conversão, confira especialmente quebras de página, recuos, cabeçalhos, células e fontes que não estejam instaladas no dispositivo.</p></article>
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Perguntas frequentes</h2><div className="mt-5 space-y-3">{faq.map(([question, answer]) => <details key={question} className="rounded-lg border border-border p-4"><summary className="cursor-pointer font-medium">{question}</summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p></details>)}</div></article>
    <nav aria-label="Ferramentas relacionadas" className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Ferramentas relacionadas</h2><div className="mt-4 flex flex-wrap gap-3"><LinkCard href="/ferramentas/word-para-pdf">Word para PDF</LinkCard><LinkCard href="/ferramentas/pdf-para-imagens">PDF para Imagens</LinkCard><LinkCard href="/ferramentas/unir-pdfs">Unir PDF</LinkCard><LinkCard href="/ferramentas/dividir-pdf">Dividir PDF</LinkCard><LinkCard href="/ferramentas/compactar-pdf">Compactar PDF</LinkCard><LinkCard href="/ferramentas/girar-pdf">Girar PDF</LinkCard></div></nav>
  </div></section></>;
}

function LinkCard({ href, children }: { href: string; children: React.ReactNode }) { return <Link href={href} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary">{children}</Link>; }
