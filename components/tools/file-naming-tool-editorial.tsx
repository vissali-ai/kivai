import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { SITE_URL } from "@/lib/seo";

export type FileNamingToolSlug =
  | "renomear-arquivos-em-lote"
  | "adicionar-prefixo-sufixo-arquivos";

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
  { href: "/ferramentas/renomear-arquivos-em-lote", label: "Renomear Arquivos em Lote" },
  { href: "/ferramentas/adicionar-prefixo-sufixo-arquivos", label: "Adicionar Prefixo ou Sufixo" },
  { href: "/ferramentas/compactar-arquivos-zip", label: "Compactar Arquivos em ZIP" },
  { href: "/ferramentas/descompactar-zip", label: "Descompactar ZIP" },
];

const content: Record<FileNamingToolSlug, EditorialContent> = {
  "renomear-arquivos-em-lote": {
    name: "Renomear Arquivos em Lote",
    overview: [
      "Renomear arquivos em lote ajuda a padronizar grandes conjuntos de documentos, fotos, vídeos, planilhas e outros itens sem editar cada nome manualmente. A ferramenta aplica um nome base e uma sequência numérica mantendo a extensão original de cada arquivo.",
      "O Kivai mostra uma prévia do nome antigo e do novo nome antes de gerar o resultado. Como navegadores não devem alterar livremente os arquivos originais do computador, as cópias renomeadas são reunidas em um ZIP para download.",
    ],
    useCases: [
      { title: "Fotos de produtos", description: "Transforme nomes de câmera em sequências como produto-camiseta-01.jpg, produto-camiseta-02.jpg e assim por diante." },
      { title: "Documentos organizados", description: "Padronize contratos, comprovantes, relatórios ou outros arquivos antes de arquivar e compartilhar." },
      { title: "Conteúdo em lote", description: "Organize arquivos de campanhas, redes sociais, clientes ou projetos usando um padrão de nome consistente." },
    ],
    steps: [
      "Selecione ou arraste os arquivos que deseja renomear.",
      "Defina o nome base que será aplicado a todos os itens.",
      "Escolha o separador, o número inicial e a quantidade de dígitos.",
      "Confira a prévia dos nomes gerados.",
      "Baixe o ZIP com as cópias renomeadas.",
    ],
    specifications: [
      { label: "Quantidade de arquivos", value: "Até 1.000 arquivos por operação nesta versão." },
      { label: "Tamanho total", value: "Até 300 MB de arquivos selecionados." },
      { label: "Extensões", value: "As extensões originais são preservadas, como .jpg, .pdf, .xlsx, .mp4 e outras." },
      { label: "Resultado", value: "Arquivo ZIP contendo as cópias com os novos nomes." },
    ],
    privacy: "A leitura, a geração dos nomes e a criação do ZIP acontecem localmente no navegador. Os arquivos selecionados não são enviados ao servidor do Kivai para serem renomeados.",
    limitations: [
      "A ferramenta não altera os arquivos originais armazenados no computador ou celular; ela gera cópias renomeadas para download.",
      "Caracteres inválidos para nomes de arquivo são removidos do nome base para melhorar compatibilidade entre sistemas.",
      "Operações com muitos arquivos ou arquivos grandes consomem memória do dispositivo durante a geração do ZIP.",
    ],
    faqs: [
      { question: "Os arquivos originais são modificados?", answer: "Não. O Kivai cria cópias com os novos nomes e reúne essas cópias em um ZIP para download." },
      { question: "A extensão do arquivo é mantida?", answer: "Sim. A ferramenta preserva a extensão original de cada item, como .jpg, .pdf, .xlsx ou .mp4." },
      { question: "Posso escolher por qual número começar?", answer: "Sim. Você pode definir o número inicial e também escolher entre um, dois, três ou quatro dígitos na sequência." },
      { question: "Meus arquivos são enviados para o servidor?", answer: "Não. O processamento é executado localmente no navegador." },
    ],
  },
  "adicionar-prefixo-sufixo-arquivos": {
    name: "Adicionar Prefixo ou Sufixo em Lote",
    overview: [
      "Adicionar um prefixo ou sufixo em lote permite complementar nomes existentes sem substituir a parte principal do arquivo. É útil para identificar clientes, canais, versões, marketplaces, datas ou outras classificações.",
      "A ferramenta preserva o nome original e a extensão do arquivo, aplicando somente o texto configurado antes ou depois do nome. O resultado é entregue em ZIP para manter ampla compatibilidade com navegadores.",
    ],
    useCases: [
      { title: "Marketplaces", description: "Adicione identificadores como shopee-, mercado-livre- ou -amazon a conjuntos de imagens e documentos." },
      { title: "Clientes e projetos", description: "Inclua o nome de um cliente, campanha ou projeto sem apagar os nomes atuais dos arquivos." },
      { title: "Controle de versões", description: "Acrescente marcadores como -final, -revisado ou -2026 antes da extensão dos arquivos." },
    ],
    steps: [
      "Selecione ou arraste os arquivos.",
      "Digite o prefixo, o sufixo ou os dois.",
      "Confira a prévia com os novos nomes.",
      "Baixe o ZIP contendo as cópias modificadas.",
    ],
    specifications: [
      { label: "Quantidade de arquivos", value: "Até 1.000 arquivos por operação nesta versão." },
      { label: "Tamanho total", value: "Até 300 MB de arquivos selecionados." },
      { label: "Extensões", value: "A extensão permanece no final do arquivo e não recebe o sufixo depois dela." },
      { label: "Resultado", value: "Arquivo ZIP com cópias contendo prefixo e/ou sufixo." },
    ],
    privacy: "O processamento e a criação do ZIP acontecem no navegador. Os arquivos não são enviados ao servidor do Kivai para que os nomes sejam alterados.",
    limitations: [
      "Os arquivos originais permanecem inalterados no dispositivo.",
      "Caracteres incompatíveis com nomes de arquivo são removidos do prefixo e do sufixo.",
      "Operações grandes dependem da memória disponível no navegador e no dispositivo.",
    ],
    faqs: [
      { question: "Posso usar prefixo e sufixo ao mesmo tempo?", answer: "Sim. Você pode preencher somente um dos campos ou combinar prefixo e sufixo na mesma operação." },
      { question: "O sufixo é colocado depois da extensão?", answer: "Não. O sufixo é inserido antes da extensão. Por exemplo, foto.jpg com sufixo -shopee vira foto-shopee.jpg." },
      { question: "O nome original é preservado?", answer: "Sim. A ferramenta mantém o nome atual e apenas adiciona os textos configurados." },
      { question: "Os arquivos são enviados para o Kivai?", answer: "Não. A operação é executada localmente no navegador." },
    ],
  },
};

export function FileNamingToolEditorial({ slug }: { slug: FileNamingToolSlug }) {
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
