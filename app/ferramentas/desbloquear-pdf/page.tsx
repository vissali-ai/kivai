import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { getToolMetadata } from "@/lib/seo";
import DesbloquearPdfClient from "./desbloquear-pdf-client";

export const metadata = getToolMetadata("desbloquear-pdf");

const faq = [
  ["Como desbloquear um PDF?", "Selecione o PDF, informe a senha correta quando ela for exigida e clique em Desbloquear PDF. Ao concluir, baixe a nova cópia."],
  ["Preciso saber a senha do arquivo?", "Sim, quando o documento exige senha para abertura ou processamento. A ferramenta não tenta descobrir senhas."],
  ["Posso desbloquear PDF sem senha?", "A ferramenta não tenta descobrir ou quebrar senhas. Quando o documento exige uma senha para abertura ou processamento, você deverá informar a senha correta."],
  ["O que acontece se eu digitar a senha errada?", "A tentativa é recusada e uma mensagem orienta a conferir a senha. Cada nova tentativa depende de uma ação manual sua."],
  ["O arquivo original é alterado?", "Não. A ferramenta gera uma nova cópia em PDF e mantém o arquivo selecionado intacto no seu dispositivo."],
  ["O PDF desbloqueado continuará com as mesmas páginas?", "Sim. A quantidade e a ordem das páginas são verificadas antes de liberar o resultado."],
  ["Imagens e textos serão preservados?", "O documento é regravado sem rasterização geral, preservando os objetos originais sempre que o formato de proteção for compatível."],
  ["Posso usar um PDF que pertence à minha empresa?", "Sim, desde que você tenha autorização para remover a proteção e tratar o conteúdo do documento."],
  ["O que significa PDF protegido?", "É um PDF que utiliza criptografia para exigir senha ou aplicar restrições de acesso e determinadas operações."],
  ["Qual a diferença entre senha e restrições?", "A senha de abertura impede visualizar o documento sem autenticação. Restrições podem limitar operações como impressão, cópia ou edição."],
  ["Por que alguns PDFs não podem ser desbloqueados?", "Arquivos danificados ou tipos de criptografia não compatíveis podem impedir uma conversão segura e verificável."],
  ["O arquivo final continuará sendo PDF?", "Sim. A saída é um novo arquivo PDF, com nome terminado em -desbloqueado.pdf."],
  ["Posso utilizar a ferramenta no celular?", "Sim. Upload, senha e download se adaptam a navegadores móveis modernos."],
  ["Qual o tamanho máximo permitido?", "O limite é de 25 MB, até 100 páginas e um PDF por processamento."],
  ["Posso proteger novamente o arquivo depois?", "Sim, utilizando uma ferramenta de proteção compatível e uma senha segura sob sua responsabilidade."],
] as const;

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "SoftwareApplication", name: "Desbloquear PDF", applicationCategory: "UtilitiesApplication", operatingSystem: "Qualquer sistema com navegador moderno", url: "https://www.kivai.com.br/ferramentas/desbloquear-pdf", description: "Remova a proteção de PDFs utilizando a senha correta e gere uma nova cópia sem senha de abertura.", offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: "https://www.kivai.com.br" }, { "@type": "ListItem", position: 2, name: "PDF", item: "https://www.kivai.com.br/ferramentas/pdfs" }, { "@type": "ListItem", position: 3, name: "Desbloquear PDF", item: "https://www.kivai.com.br/ferramentas/desbloquear-pdf" }] },
    { "@type": "FAQPage", mainEntity: faq.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) },
  ],
};

export default function DesbloquearPdfPage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><DesbloquearPdfClient /><section className="border-t border-border bg-muted/10 py-12 sm:py-16"><div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">O que é desbloquear PDF?</h2><div className="mt-4 space-y-4 leading-7 text-muted-foreground"><p>Alguns PDFs são protegidos por senha para controlar quem pode abrir ou modificar o documento. Quando você possui a senha e precisa criar uma versão que possa ser aberta sem digitá-la novamente, a ferramenta gera uma nova cópia sem essa proteção, quando o formato de segurança é compatível.</p><p>O processo não descobre senhas nem contorna controles de acesso. Ele utiliza somente a senha informada manualmente pelo responsável autorizado.</p></div></article>
    <div className="grid gap-6 lg:grid-cols-2"><Info title="Quando utilizar"><p>Use em documentos próprios, relatórios empresariais, contratos autorizados, apostilas, arquivos de trabalho, formulários e materiais administrativos cuja proteção deixou de ser necessária.</p></Info><Info title="Principais vantagens"><ul className="list-disc space-y-2 pl-5"><li>Nova cópia sem senha de abertura.</li><li>Páginas preservadas sem rasterização geral.</li><li>Validação clara de senha incorreta.</li><li>Arquivo original permanece inalterado.</li></ul></Info></div>
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Como desbloquear um PDF</h2><ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{["Selecione o PDF.", "Aguarde a verificação da proteção.", "Informe a senha correta, se solicitada.", "Clique em Desbloquear PDF.", "Baixe e confira a nova cópia."].map((step, index) => <li key={step} className="rounded-lg border border-border p-4 text-sm leading-6 text-muted-foreground"><span className="mb-3 flex size-7 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{index + 1}</span>{step}</li>)}</ol></article>
    <div className="grid gap-6 lg:grid-cols-2"><Info title="Exemplo prático"><p>Imagine que você tenha protegido um relatório com senha antes de enviá-lo e agora precise disponibilizar uma cópia interna sem exigir a senha a cada abertura. Envie o documento, informe a senha atual e gere a nova versão.</p><p className="mt-3">Um arquivo arquivado também pode continuar protegido depois que a restrição deixou de ser necessária. Com senha e autorização, você pode preparar uma cópia para uso cotidiano.</p></Info><Info title="Senha de abertura e restrições"><h3 className="font-semibold text-foreground">Senha de abertura</h3><p className="mt-1">Impede que o documento seja visualizado sem a senha correta.</p><h3 className="mt-4 font-semibold text-foreground">Restrições</h3><p className="mt-1">Podem limitar impressão, cópia, edição, preenchimento ou comentários, dependendo de como o PDF foi criado.</p></Info></div>
    <div className="grid gap-6 lg:grid-cols-2"><Info title="Preservação do documento"><p>A ferramenta regrava a estrutura do PDF, buscando manter páginas, textos, imagens, vetores, links, dimensões, rotação, ordem, metadados e formulários compatíveis. O conteúdo não é transformado em imagens como solução padrão.</p></Info><Info title="Segurança e limites"><p>São aceitos PDFs de até 25 MB e 100 páginas. O arquivo e a senha são transmitidos por HTTPS ao serviço de processamento. A senha não é persistida, registrada ou usada em tentativas automáticas.</p></Info></div>
    <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Perguntas frequentes</h2><div className="mt-5 space-y-3">{faq.map(([question, answer]) => <details key={question} className="rounded-lg border border-border p-4"><summary className="cursor-pointer font-medium">{question}</summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p></details>)}</div></article>
    <nav aria-label="Ferramentas relacionadas" className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Ferramentas relacionadas</h2><div className="mt-4 flex flex-wrap gap-3"><Related href="/ferramentas/editar-pdf">Editar PDF</Related><Related href="/ferramentas/compactar-pdf">Compactar PDF</Related><Related href="/ferramentas/dividir-pdf">Dividir PDF</Related><Related href="/ferramentas/unir-pdfs">Unir PDFs</Related><Related href="/ferramentas/girar-pdf">Girar PDF</Related><Related href="/ferramentas/redimensionar-pdf">Redimensionar PDF</Related><Related href="/ferramentas/pdf-para-word">PDF para Word</Related></div></nav>
  </div></section></>;
}

function Info({ title, children }: { title: string; children: React.ReactNode }) { return <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><CheckCircle2 className="size-5 text-primary" aria-hidden="true" /><h2 className="mt-4 text-xl font-semibold">{title}</h2><div className="mt-3 leading-7 text-muted-foreground">{children}</div></article>; }
function Related({ href, children }: { href: string; children: React.ReactNode }) { return <Link href={href} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary">{children}</Link>; }
