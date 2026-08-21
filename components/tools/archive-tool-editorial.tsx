import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { SITE_URL } from "@/lib/seo";

export type ArchiveToolEditorialSlug =
  | "descompactar-zip"
  | "descompactar-rar"
  | "compactar-arquivos-zip";

type EditorialContent = {
  name: string;
  overview: string[];
  useCases: { title: string; description: string }[];
  steps: string[];
  specifications: { label: string; value: string }[];
  privacy: string;
  limitations: string[];
  faqs: { question: string; answer: string }[];
};

const related = [
  { href: "/ferramentas/descompactar-zip", label: "Descompactar ZIP" },
  { href: "/ferramentas/descompactar-rar", label: "Descompactar RAR" },
  { href: "/ferramentas/compactar-arquivos-zip", label: "Compactar Arquivos em ZIP" },
];

const content: Record<ArchiveToolEditorialSlug, EditorialContent> = {
  "descompactar-zip": {
    name: "Descompactar ZIP",
    overview: [
      "Um arquivo ZIP funciona como um pacote que pode reunir documentos, imagens, planilhas, pastas e outros tipos de arquivo. Descompactar significa abrir esse pacote e recuperar os itens armazenados nele para uso normal.",
      "Nesta ferramenta, a leitura e a extração acontecem no próprio navegador. O arquivo selecionado não precisa ser enviado ao servidor do Kivai para que seu conteúdo seja listado ou extraído.",
    ],
    useCases: [
      { title: "Downloads e anexos", description: "Abra pacotes ZIP recebidos por e-mail, downloads, sistemas ou serviços de armazenamento sem instalar outro programa." },
      { title: "Conferir o conteúdo", description: "Visualize arquivos e pastas antes de decidir quais itens deseja baixar." },
      { title: "Extração pontual", description: "Baixe apenas os arquivos necessários, sem alterar o ZIP original." },
    ],
    steps: [
      "Selecione um arquivo com extensão .zip.",
      "Aguarde a leitura da estrutura do pacote.",
      "Confira os arquivos e pastas encontrados.",
      "Baixe individualmente os itens de que precisa.",
    ],
    specifications: [
      { label: "Formato aceito", value: "Arquivo ZIP (.zip)." },
      { label: "Limite do pacote", value: "Até 200 MB por ZIP nesta versão." },
      { label: "Quantidade de itens", value: "Até 3.000 entradas entre arquivos e pastas." },
      { label: "Resultado", value: "Lista do conteúdo e download individual dos arquivos encontrados." },
    ],
    privacy: "A leitura e a extração são executadas localmente no navegador. O ZIP não é enviado ao servidor do Kivai para processamento.",
    limitations: [
      "ZIPs protegidos por senha ou criados com métodos de compressão incompatíveis podem não ser abertos.",
      "Pacotes grandes ou com muitos itens usam memória do dispositivo e podem funcionar melhor em computador.",
      "Descompactar um arquivo não torna o conteúdo interno seguro; verifique a origem antes de abrir arquivos desconhecidos.",
    ],
    faqs: [
      { question: "O arquivo ZIP é enviado para o Kivai?", answer: "Não. A leitura e a extração são executadas localmente no navegador." },
      { question: "A ferramenta também abre RAR?", answer: "Não nesta página. Para RAR, use a ferramenta Descompactar RAR do Hub Arquivos." },
      { question: "O ZIP original é modificado?", answer: "Não. A ferramenta apenas lê o pacote e gera downloads dos arquivos selecionados." },
      { question: "Posso baixar todos os arquivos de uma vez?", answer: "Nesta versão, os arquivos internos são baixados individualmente para manter compatibilidade e controle de memória no navegador." },
    ],
  },
  "descompactar-rar": {
    name: "Descompactar RAR",
    overview: [
      "RAR é um formato de arquivo compactado usado para reunir um ou vários itens em um único pacote. A ferramenta permite abrir o RAR, visualizar sua estrutura e extrair arquivos individualmente.",
      "O processamento utiliza WebAssembly e acontece localmente no navegador. O arquivo RAR selecionado não é enviado ao servidor do Kivai para ser descompactado.",
    ],
    useCases: [
      { title: "Abrir um pacote RAR", description: "Confira os arquivos e pastas armazenados antes de fazer qualquer extração." },
      { title: "RAR protegido por senha", description: "Informe a senha quando o pacote exigir autenticação para leitura ou extração." },
      { title: "Extrair somente o necessário", description: "Baixe um arquivo por vez para reduzir o uso de memória do navegador." },
    ],
    steps: [
      "Selecione um arquivo com extensão .rar.",
      "Informe a senha somente se o pacote estiver protegido.",
      "Clique em Abrir RAR para listar o conteúdo.",
      "Escolha o arquivo desejado e faça o download.",
    ],
    specifications: [
      { label: "Formato aceito", value: "Arquivo RAR (.rar), incluindo RAR modernos compatíveis com o mecanismo utilizado." },
      { label: "Limite do pacote", value: "Até 120 MB por arquivo RAR nesta versão." },
      { label: "Quantidade de itens", value: "Até 3.000 entradas no pacote." },
      { label: "Extração individual", value: "Até 350 MB por arquivo interno para reduzir risco de travamento do navegador." },
    ],
    privacy: "O RAR é processado localmente com WebAssembly. O conteúdo do pacote não é enviado ao servidor do Kivai durante a abertura ou extração.",
    limitations: [
      "Pacotes multipartes, danificados ou criados com recursos incompatíveis podem não ser processados.",
      "Arquivos grandes dependem da memória disponível no computador ou celular.",
      "Esta ferramenta apenas abre e descompacta RAR; ela não cria arquivos no formato RAR.",
    ],
    faqs: [
      { question: "A ferramenta cria arquivos RAR?", answer: "Não. Esta página é exclusivamente para abrir e descompactar arquivos RAR." },
      { question: "Funciona com RAR 5?", answer: "O mecanismo utilizado oferece suporte a arquivos RAR modernos, incluindo RAR 5, desde que o pacote não use um recurso incompatível." },
      { question: "Posso usar no celular?", answer: "Sim, em navegadores compatíveis. Arquivos grandes, porém, podem exigir mais memória do que alguns celulares conseguem disponibilizar." },
      { question: "Meu arquivo RAR é enviado para o servidor?", answer: "Não. A leitura e a extração são realizadas localmente no navegador." },
    ],
  },
  "compactar-arquivos-zip": {
    name: "Compactar Arquivos em ZIP",
    overview: [
      "Um arquivo ZIP reúne vários itens em um único pacote, facilitando organização, envio, backup e armazenamento. Dependendo dos formatos selecionados, a compactação também pode reduzir o tamanho total.",
      "Nesta ferramenta, os arquivos são adicionados ao pacote e processados diretamente no navegador. O ZIP resultante é gerado no dispositivo e disponibilizado para download sem enviar os arquivos ao servidor do Kivai.",
    ],
    useCases: [
      { title: "Organizar vários arquivos", description: "Reúna documentos, imagens, planilhas e outros itens em um único pacote." },
      { title: "Compartilhar um conjunto", description: "Crie um único arquivo ZIP para facilitar envio por e-mail, mensageiros ou armazenamento." },
      { title: "Preparar backups", description: "Agrupe arquivos relacionados antes de arquivar ou transferir para outro local." },
    ],
    steps: [
      "Selecione ou arraste os arquivos que deseja reunir.",
      "Defina o nome do pacote ZIP.",
      "Escolha entre compactação rápida, equilibrada ou máxima.",
      "Clique em Compactar em ZIP e aguarde a geração.",
      "O navegador inicia o download do arquivo .zip concluído.",
    ],
    specifications: [
      { label: "Formato de saída", value: "Arquivo ZIP (.zip)." },
      { label: "Quantidade de arquivos", value: "Até 1.000 arquivos por operação nesta versão." },
      { label: "Tamanho total", value: "Até 300 MB de arquivos selecionados." },
      { label: "Níveis disponíveis", value: "Rápida, equilibrada e máxima. Maior nível pode consumir mais processamento sem garantir redução proporcional." },
    ],
    privacy: "A compactação acontece localmente no navegador. Os arquivos selecionados permanecem no dispositivo e não são enviados ao servidor do Kivai para gerar o ZIP.",
    limitations: [
      "Imagens, vídeos, PDFs e outros formatos já comprimidos podem apresentar pouca redução ou até pequeno aumento no ZIP final.",
      "Operações maiores consomem mais memória e processamento do dispositivo.",
      "Nomes duplicados são ajustados automaticamente dentro do pacote para evitar sobrescrita silenciosa.",
    ],
    faqs: [
      { question: "Os arquivos são enviados para o servidor do Kivai?", answer: "Não. A compactação acontece localmente no navegador e o ZIP é gerado no próprio dispositivo." },
      { question: "Compactar em ZIP sempre reduz o tamanho?", answer: "Não. Formatos que já usam compressão podem apresentar pouca redução ou até um pequeno aumento no tamanho final." },
      { question: "Posso colocar vários arquivos no mesmo ZIP?", answer: "Sim. Você pode reunir vários arquivos em um único pacote dentro dos limites informados pela ferramenta." },
      { question: "A ferramenta cria RAR?", answer: "Não. A saída desta ferramenta é exclusivamente ZIP." },
    ],
  },
};

export function ArchiveToolEditorial({ slug }: { slug: ArchiveToolEditorialSlug }) {
  const current = content[slug];
  const url = `${SITE_URL}/ferramentas/${slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: current.name,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Qualquer sistema com navegador moderno",
        url,
        offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Arquivos", item: `${SITE_URL}/ferramentas/arquivos` },
          { "@type": "ListItem", position: 3, name: current.name, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: current.faqs.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <section className="border-t border-border bg-muted/10 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Sobre esta ferramenta</h2>
            <div className="mt-4 space-y-4 leading-7 text-muted-foreground">{current.overview.map((item) => <p key={item}>{item}</p>)}</div>
          </article>
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
              <h2 className="text-2xl font-semibold">Quando utilizar</h2>
              <div className="mt-5 space-y-4">{current.useCases.map((item) => <div key={item.title}><h3 className="font-semibold">{item.title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p></div>)}</div>
            </article>
            <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
              <h2 className="text-2xl font-semibold">Como usar</h2>
              <ol className="mt-5 list-none space-y-3">{current.steps.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-6 text-muted-foreground"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span><span>{step}</span></li>)}</ol>
            </article>
          </div>
          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Formatos, limites e resultado</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">{current.specifications.map((item) => <div key={item.label} className="rounded-lg border border-border bg-muted/10 p-4"><dt className="text-sm font-semibold">{item.label}</dt><dd className="mt-2 text-sm leading-6 text-muted-foreground">{item.value}</dd></div>)}</dl>
          </article>
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Privacidade e processamento</h2><p className="mt-4 leading-7 text-muted-foreground">{current.privacy}</p></article>
            <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Limitações importantes</h2><ul className="mt-4 space-y-3">{current.limitations.map((item) => <li key={item} className="flex gap-2 text-sm leading-6 text-muted-foreground"><CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />{item}</li>)}</ul></article>
          </div>
          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Perguntas frequentes</h2>
            <div className="mt-5 space-y-3">{current.faqs.map((item) => <details key={item.question} className="rounded-lg border border-border p-4"><summary className="cursor-pointer font-medium">{item.question}</summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{item.answer}</p></details>)}</div>
          </article>
          <nav aria-label="Ferramentas relacionadas" className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Ferramentas relacionadas</h2>
            <div className="mt-4 flex flex-wrap gap-3">{related.filter((item) => item.href !== `/ferramentas/${slug}`).map((item) => <Link key={item.href} href={item.href} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary">{item.label}</Link>)}</div>
          </nav>
        </div>
      </section>
    </>
  );
}
