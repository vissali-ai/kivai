import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { getToolMetadata } from "@/lib/seo";
import PowerPointParaPdfClient from "./powerpoint-para-pdf-client";

export const metadata = getToolMetadata("powerpoint-para-pdf");

const faq = [
  ["Como converter PowerPoint para PDF?", "Selecione o arquivo PPTX, confira as miniaturas, escolha e organize os slides, ajuste as configurações e clique em Converter para PDF."],
  ["A ferramenta funciona no celular?", "Sim. A interface funciona em navegadores modernos de celulares e tablets. Apresentações grandes podem exigir mais memória e funcionar melhor em um computador."],
  ["O layout será preservado?", "A ferramenta renderiza textos, imagens, formas, gráficos, cores e fundos antes de gerar o PDF. Fontes indisponíveis ou recursos muito específicos do PowerPoint podem apresentar pequenas diferenças."],
  ["Aceita apresentações grandes?", "Sim, dentro do limite de 25 MB e até 50 slides. Esse limite protege o navegador contra consumo excessivo de memória."],
  ["Posso escolher quais slides converter?", "Sim. Você pode selecionar todos, desmarcar slides ou remover páginas específicas da conversão."],
  ["Posso reorganizar a ordem?", "Sim. Arraste as miniaturas ou use os botões de mover. A opção Restaurar ordem retorna os slides à sequência original."],
  ["É gratuito?", "Sim. A conversão é gratuita e acontece diretamente no navegador, sem necessidade de instalar programas."],
  ["Qual é o tamanho máximo?", "O tamanho máximo aceito é 25 MB por arquivo PPTX, com até 50 slides."],
  ["Posso converter apresentações com imagens?", "Sim. Imagens incorporadas à apresentação são renderizadas junto com cada slide e incluídas no PDF."],
  ["Posso imprimir o PDF depois?", "Sim. O arquivo gerado é um PDF válido, adequado para download, compartilhamento e impressão."],
  ["Arquivos PPT antigos são aceitos?", "Não. Esta ferramenta aceita apenas PPTX. Abra o arquivo PPT em um editor compatível, salve como PPTX e tente novamente."],
] as const;

const schema = [
  { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "PowerPoint para PDF", applicationCategory: "UtilitiesApplication", operatingSystem: "Qualquer sistema com navegador moderno", url: "https://kivai.com.br/ferramentas/powerpoint-para-pdf", description: "Conversor online de apresentações PowerPoint PPTX para PDF.", offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" } },
  { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: "https://kivai.com.br" }, { "@type": "ListItem", position: 2, name: "PDF", item: "https://kivai.com.br/ferramentas/pdfs" }, { "@type": "ListItem", position: 3, name: "PowerPoint para PDF", item: "https://kivai.com.br/ferramentas/powerpoint-para-pdf" }] },
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) },
];

export default function PowerPointParaPdfPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><PowerPointParaPdfClient /><section className="border-t border-border bg-muted/10 py-12 sm:py-16"><div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Como converter PowerPoint para PDF</h2><ol className="mt-4 list-decimal space-y-2 pl-5 leading-7 text-muted-foreground"><li>Selecione uma apresentação no formato PPTX.</li><li>Confira as miniaturas e escolha os slides que deseja converter.</li><li>Arraste os slides ou use os controles para definir a ordem.</li><li>Escolha orientação, tamanho de página e qualidade.</li><li>Clique em <strong className="text-foreground">Converter para PDF</strong>.</li><li>Baixe o arquivo apresentação.pdf.</li></ol></article>
    <div className="grid gap-6 lg:grid-cols-2"><Info title="O que é um arquivo PPTX?">PPTX é o formato moderno de apresentações do Microsoft PowerPoint. Ele organiza slides, textos, imagens, formas, gráficos, temas e outros recursos em um pacote baseado no padrão Office Open XML.</Info><Info title="Vantagens de transformar PowerPoint em PDF">O PDF mantém uma aparência estável em diferentes dispositivos, é simples de compartilhar, pode ser aberto sem o PowerPoint e costuma ser a melhor opção para imprimir ou enviar uma versão final da apresentação.</Info></div>
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Quando utilizar PowerPoint para PDF</h2><p className="mt-4 leading-7 text-muted-foreground">Use a conversão para distribuir apresentações comerciais, propostas, materiais de aula, portfólios, relatórios e conteúdos de treinamento. O PDF também é útil quando você deseja preservar a sequência visual sem permitir alterações fáceis nos slides originais.</p></article>
    <div className="grid gap-6 lg:grid-cols-3"><Info title="Compatibilidade">A ferramenta aceita arquivos PPTX criados por versões modernas do PowerPoint e por editores compatíveis com Office Open XML. O formato antigo PPT não é processado.</Info><Info title="Dicas para apresentações">Use fontes comuns ou incorporadas, imagens com boa resolução e evite objetos externos. Revise as miniaturas antes da conversão para identificar diferenças de renderização.</Info><Info title="Boas práticas">Remova slides desnecessários, escolha Alta qualidade para detalhes pequenos e use o tamanho Automático quando quiser preservar a proporção original da apresentação.</Info></div>
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Perguntas frequentes</h2><div className="mt-5 space-y-3">{faq.map(([question, answer]) => <details key={question} className="rounded-lg border border-border p-4"><summary className="cursor-pointer font-medium">{question}</summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p></details>)}</div></article>
    <nav aria-label="Ferramentas relacionadas" className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Ferramentas relacionadas</h2><div className="mt-4 flex flex-wrap gap-3"><Related href="/ferramentas/pdf-para-powerpoint">PDF para PowerPoint</Related><Related href="/ferramentas/pdf-para-word">PDF para Word</Related><Related href="/ferramentas/word-para-pdf">Word para PDF</Related><Related href="/ferramentas/pdf-para-imagens">PDF para Imagens</Related><Related href="/ferramentas/imagens-para-pdf">Imagens para PDF</Related><Related href="/ferramentas/unir-pdfs">Unir PDF</Related><Related href="/ferramentas/dividir-pdf">Dividir PDF</Related><Related href="/ferramentas/compactar-pdf">Compactar PDF</Related></div></nav>
  </div></section></>;
}

function Info({ title, children }: { title: string; children: React.ReactNode }) { return <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><CheckCircle2 className="size-5 text-primary" /><h2 className="mt-4 text-xl font-semibold">{title}</h2><p className="mt-3 leading-7 text-muted-foreground">{children}</p></article>; }
function Related({ href, children }: { href: string; children: React.ReactNode }) { return <Link href={href} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary">{children}</Link>; }
