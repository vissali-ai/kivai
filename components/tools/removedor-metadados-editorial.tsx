import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

const siteUrl = "https://www.kivai.com.br";
const slug = "removedor-de-metadados";
const name = "Removedor de Metadados";

const content = {
  overview: [
    "Imagens podem carregar informações incorporadas além dos pixels visíveis. Dependendo do arquivo e do dispositivo que o criou, esses dados podem incluir modelo da câmera, data, coordenadas de localização, software utilizado e outros campos técnicos.",
    "O Removedor de Metadados do Kivai recria a imagem a partir dos pixels decodificados e gera um novo arquivo no mesmo formato. Dessa forma, os blocos de metadados herdados do original, como EXIF, GPS, XMP e IPTC quando presentes, não são copiados para a nova imagem.",
  ],
  useCases: [
    { title: "Compartilhar fotos com mais privacidade", description: "Crie uma nova cópia antes de enviar fotografias que possam conter localização, data ou dados do dispositivo." },
    { title: "Publicação em sites e redes sociais", description: "Prepare uma versão limpa de JPG, PNG ou WebP antes de publicar ou reutilizar a imagem em outros canais." },
    { title: "Arquivos recebidos de terceiros", description: "Recrie a imagem quando você não quiser manter os metadados incorporados no arquivo recebido." },
    { title: "Padronização de ativos", description: "Gere cópias com nome neutro e sem reutilizar os blocos de metadados do arquivo de origem." },
  ],
  steps: [
    "Selecione ou arraste uma imagem JPG, PNG ou WebP.",
    "Confira a prévia, o formato, as dimensões e o tamanho do arquivo.",
    "Clique em Remover metadados para recriar a imagem a partir dos pixels.",
    "Baixe a nova cópia com nome neutro e formato preservado.",
  ],
  specifications: [
    { label: "Formatos aceitos", value: "JPG/JPEG, PNG e WebP." },
    { label: "Limite por arquivo", value: "Até 40 MB e até 40 megapixels nesta versão." },
    { label: "Formato de saída", value: "O mesmo formato da entrada: JPG, PNG ou WebP." },
    { label: "Processamento", value: "Decodificação e nova codificação executadas localmente no navegador." },
  ],
  privacy: "O arquivo selecionado é processado localmente. Ele não precisa ser enviado ao servidor do Kivai para que a nova cópia seja gerada. O nome do download também é substituído por um nome neutro para não repetir o nome original do arquivo.",
  limitations: [
    "A ferramenta remove os metadados herdados do arquivo original, mas o navegador pode inserir informações técnicas próprias mínimas no arquivo exportado, como parâmetros de codificação ou resolução padrão.",
    "JPG e WebP usam compressão com perdas; recriar o arquivo pode produzir pequena diferença de tamanho ou qualidade mesmo mantendo as dimensões.",
    "A ferramenta não detecta nem remove informações visualmente presentes nos pixels, como placas, textos, rostos, marcas d'água ou localização visível na própria foto.",
    "Ela também não é uma ferramenta de detecção de esteganografia ou de limpeza de registros externos mantidos por aplicativos, sistemas operacionais ou plataformas onde a imagem já tenha sido enviada.",
  ],
  faqs: [
    { question: "A ferramenta remove localização GPS da foto?", answer: "Quando as coordenadas estiverem armazenadas como metadados incorporados no arquivo original, elas não são copiadas para a nova imagem gerada pelo Kivai." },
    { question: "Ela remove EXIF, XMP e IPTC?", answer: "A nova imagem é criada a partir dos pixels, sem reutilizar os blocos de metadados do arquivo original. Isso elimina os metadados herdados desses blocos quando presentes." },
    { question: "A imagem fica idêntica?", answer: "As dimensões são preservadas. PNG é exportado sem perda visual por compressão; JPG e WebP podem sofrer pequena recompressão porque precisam ser codificados novamente." },
    { question: "A ferramenta garante que não exista nenhum dado além dos pixels?", answer: "Não é correto prometer isso. O navegador pode adicionar metadados técnicos próprios mínimos ao arquivo novo. O objetivo é não carregar os metadados herdados da imagem original." },
    { question: "A imagem é enviada para o Kivai?", answer: "Não durante a operação normal desta ferramenta. A leitura, a recriação e o download acontecem localmente no navegador." },
  ],
  related: [
    { href: "/ferramentas/compressor-de-imagens", label: "Compressor de Imagens" },
    { href: "/ferramentas/redimensionar-imagem", label: "Redimensionar Imagem" },
    { href: "/ferramentas/conversor-de-imagens", label: "Conversor de Imagens" },
  ],
};

export function RemovedorMetadadosEditorial() {
  const url = `${siteUrl}/ferramentas/${slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Qualquer sistema com navegador moderno",
        url,
        description: "Remova metadados herdados de imagens JPG, PNG e WebP diretamente no navegador.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Ferramentas de imagens", item: `${siteUrl}/ferramentas/imagens` },
          { "@type": "ListItem", position: 3, name, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: content.faqs.map(({ question, answer }) => ({
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
            <div className="mt-4 space-y-4 leading-7 text-muted-foreground">{content.overview.map((item) => <p key={item}>{item}</p>)}</div>
          </article>
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
              <h2 className="text-2xl font-semibold">Quando utilizar</h2>
              <div className="mt-5 space-y-4">{content.useCases.map((item) => <div key={item.title}><h3 className="font-semibold">{item.title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p></div>)}</div>
            </article>
            <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
              <h2 className="text-2xl font-semibold">Como usar</h2>
              <ol className="mt-5 list-none space-y-3">{content.steps.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-6 text-muted-foreground"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span><span>{step}</span></li>)}</ol>
            </article>
          </div>
          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Formatos, controles e resultado</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">{content.specifications.map((item) => <div key={item.label} className="rounded-lg border border-border bg-muted/10 p-4"><dt className="text-sm font-semibold">{item.label}</dt><dd className="mt-2 text-sm leading-6 text-muted-foreground">{item.value}</dd></div>)}</dl>
          </article>
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Privacidade e processamento</h2><p className="mt-4 leading-7 text-muted-foreground">{content.privacy}</p></article>
            <article className="rounded-xl border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Limitações importantes</h2><ul className="mt-4 space-y-3">{content.limitations.map((item) => <li key={item} className="flex gap-2 text-sm leading-6 text-muted-foreground"><CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />{item}</li>)}</ul></article>
          </div>
          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Perguntas frequentes</h2>
            <div className="mt-5 space-y-3">{content.faqs.map((item) => <details key={item.question} className="rounded-lg border border-border p-4"><summary className="cursor-pointer font-medium">{item.question}</summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{item.answer}</p></details>)}</div>
          </article>
          <nav aria-label="Ferramentas de imagens relacionadas" className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Ferramentas relacionadas</h2>
            <div className="mt-4 flex flex-wrap gap-3">{content.related.map((item) => <Link key={item.href} href={item.href} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary">{item.label}</Link>)}</div>
          </nav>
        </div>
      </section>
    </>
  );
}
