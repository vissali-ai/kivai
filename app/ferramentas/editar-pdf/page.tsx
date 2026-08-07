import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { getToolMetadata } from "@/lib/seo";
import EditarPdfClient from "./editar-pdf-client";

export const metadata = getToolMetadata("editar-pdf");

const faq = [
  ["Como editar um PDF?", "Selecione o PDF, abra o editor, adicione elementos sobre as páginas e baixe o novo documento."],
  ["Posso escrever em qualquer página?", "Sim. Selecione a página e use Texto para adicionar e formatar uma nova caixa de texto."],
  ["Posso alterar o texto original do PDF?", "Não nesta versão. O conteúdo original permanece como fundo e novos elementos são adicionados em uma camada sobre ele."],
  ["Posso inserir imagens?", "Sim. É possível adicionar PNG, JPG e WebP de até 10 MB, mover, redimensionar, girar e ajustar a opacidade."],
  ["Posso desenhar no documento?", "Sim. A ferramenta de desenho livre funciona com mouse ou toque e permite ajustar cor, espessura e opacidade."],
  ["Posso destacar uma parte do PDF?", "Sim. O destaque insere um retângulo translúcido que pode ser movido e redimensionado."],
  ["Posso adicionar formas e setas?", "Sim. O editor possui retângulos, elipses, linhas e setas com propriedades de cor, borda e estilo."],
  ["Posso assinar o PDF?", "Sim. Você pode inserir uma assinatura visual digitada, desenhada ou enviada como imagem."],
  ["A assinatura possui validade digital?", "Não. A assinatura desta ferramenta é apenas visual e não possui certificação digital."],
  ["Posso ocultar informações?", "Sim. A ferramenta Ocultar conteúdo adiciona uma cobertura visual branca, preta ou colorida."],
  ["O conteúdo ocultado é removido definitivamente?", "Não necessariamente. A cobertura é visual e não equivale à remoção segura dos dados internos do PDF."],
  ["Posso reorganizar as páginas?", "Sim. Use arrastar e soltar ou os botões de mover para alterar a ordem das páginas."],
  ["Posso excluir páginas?", "Sim. A página é removida do arquivo final após confirmação e pode ser restaurada pelo histórico ou pela ordem original."],
  ["Posso adicionar uma página em branco?", "Sim. Escolha posição e tamanho, incluindo A4 e Carta em retrato ou paisagem."],
  ["Posso usar pelo celular?", "Sim. As ferramentas são roláveis, os painéis se reorganizam e os elementos aceitam interação por toque."],
  ["Qual é o tamanho máximo permitido?", "O PDF pode ter até 25 MB e 50 páginas. Também há limites de 200 elementos e 20 imagens."],
  ["Posso desfazer uma alteração?", "Sim. O editor mantém um histórico de até 50 ações com desfazer e refazer."],
  ["O arquivo final continuará sendo PDF?", "Sim. A exportação gera um novo PDF válido, preservando as páginas originais e incorporando as novas camadas."],
  ["Por que algumas fontes ficam diferentes?", "A exportação utiliza fontes PDF compatíveis, como Helvetica, Times e Courier. Fontes equivalentes do navegador podem sofrer pequenas diferenças."],
  ["Posso continuar editando depois de gerar o PDF?", "Sim. Depois da exportação, use Continuar editando para voltar ao documento sem perder a sessão atual."],
] as const;

const schema = [
  { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Editar PDF", applicationCategory: "UtilitiesApplication", operatingSystem: "Qualquer sistema com navegador moderno", url: "https://www.kivai.com.br/ferramentas/editar-pdf", description: "Editor visual online para adicionar textos, imagens, formas, desenhos e marcações a documentos PDF.", offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" } },
  { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: "https://www.kivai.com.br" }, { "@type": "ListItem", position: 2, name: "PDF", item: "https://www.kivai.com.br/ferramentas/pdfs" }, { "@type": "ListItem", position: 3, name: "Editar PDF", item: "https://www.kivai.com.br/ferramentas/editar-pdf" }] },
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) },
];

const capabilities = ["Texto e assinatura visual", "PNG, JPG e WebP", "Formas, linhas e setas", "Desenho livre e destaque", "Organização e rotação de páginas", "Histórico, cópia e camadas"];

export default function EditarPdfPage() { return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><EditarPdfClient /><section className="border-t border-border bg-muted/10 py-12 sm:py-16"><div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
  <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Como editar um PDF</h2><ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-muted-foreground"><li>Selecione o arquivo PDF.</li><li>Abra o editor visual.</li><li>Escolha uma ferramenta.</li><li>Adicione textos, imagens, formas ou desenhos.</li><li>Ajuste posição, tamanho, rotação e aparência.</li><li>Clique em <strong className="text-foreground">Baixar PDF editado</strong>.</li></ol></article>
  <div className="grid gap-6 lg:grid-cols-2"><article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">O que é possível editar</h2><p className="mt-4 leading-7 text-muted-foreground">Você pode adicionar novos elementos sobre cada página, organizar o documento e gerar uma nova versão. O conteúdo original funciona como plano de fundo e continua preservado no arquivo.</p></article><article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Recursos do editor</h2><ul className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">{capabilities.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{item}</li>)}</ul></article></div>
  <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Posso alterar o texto original?</h2><p className="mt-4 leading-7 text-muted-foreground">A primeira versão não reconstrói nem substitui diretamente textos internos. Para escrever em um PDF, use uma nova caixa de texto, escolha fonte, tamanho, cor e alinhamento e posicione-a sobre a área desejada.</p></article>
  <div className="grid gap-6 lg:grid-cols-2"><article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Imagens, destaques e desenhos</h2><p className="mt-4 leading-7 text-muted-foreground">Envie uma imagem compatível e ajuste posição, proporção, rotação e opacidade. Para chamar atenção a um trecho, use o marcador translúcido; para anotações manuais, escolha o desenho livre.</p></article><article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Como ocultar informações</h2><p className="mt-4 leading-7 text-muted-foreground">A cobertura visual posiciona um retângulo opaco sobre a página. Ela não remove necessariamente o conteúdo interno e não deve ser usada como redação segura de informações sensíveis.</p></article></div>
  <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Como assinar um PDF</h2><p className="mt-4 leading-7 text-muted-foreground">Insira uma assinatura digitada, desenhe com mouse ou toque ou envie uma imagem. O resultado é incorporado visualmente ao PDF, mas não constitui assinatura digital certificada.</p></article>
  <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Perguntas frequentes</h2><div className="mt-5 space-y-3">{faq.map(([question, answer]) => <details key={question} className="rounded-lg border border-border p-4"><summary className="cursor-pointer font-medium">{question}</summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p></details>)}</div></article>
  <nav aria-label="Ferramentas relacionadas" className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Ferramentas relacionadas</h2><div className="mt-4 flex flex-wrap gap-3"><LinkCard href="/ferramentas/girar-pdf">Girar PDF</LinkCard><LinkCard href="/ferramentas/dividir-pdf">Dividir PDF</LinkCard><LinkCard href="/ferramentas/unir-pdfs">Unir PDFs</LinkCard><LinkCard href="/ferramentas/compactar-pdf">Compactar PDF</LinkCard><LinkCard href="/ferramentas/adicionar-marca-dagua">Adicionar Marca d’Água</LinkCard><LinkCard href="/ferramentas/pdf-para-word">PDF para Word</LinkCard><LinkCard href="/ferramentas/pdf-para-imagens">PDF para Imagens</LinkCard></div></nav>
</div></section></>; }

function LinkCard({ href, children }: { href: string; children: React.ReactNode }) { return <Link href={href} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary">{children}</Link>; }
