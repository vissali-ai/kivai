import type { Metadata } from "next";

import CompactarArquivosZipClient from "./compactar-arquivos-zip-client";
import { SITE_URL } from "@/lib/seo";

const title = "Compactar Arquivos em ZIP Online Grátis | Kivai";
const description =
  "Compacte vários arquivos em um único ZIP online, escolha o nível de compactação e faça o download diretamente no navegador, sem enviar seus arquivos ao servidor do Kivai.";
const url = `${SITE_URL}/ferramentas/compactar-arquivos-zip`;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  keywords: [
    "compactar arquivos",
    "compactar zip",
    "criar zip online",
    "juntar arquivos em zip",
    "compactador zip online",
  ],
  alternates: { canonical: url },
  openGraph: {
    title,
    description,
    url,
    siteName: "Kivai",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

const faq = [
  {
    question: "Os arquivos são enviados para o servidor do Kivai?",
    answer:
      "Não. A compactação desta ferramenta acontece localmente no navegador e o ZIP é gerado no seu próprio dispositivo.",
  },
  {
    question: "Compactar em ZIP sempre reduz o tamanho?",
    answer:
      "Não. Imagens, vídeos, PDFs e outros formatos que já usam compressão podem apresentar pouca redução ou até um pequeno aumento no tamanho final do ZIP.",
  },
  {
    question: "Posso colocar vários arquivos no mesmo ZIP?",
    answer:
      "Sim. Você pode selecionar vários arquivos e reuni-los em um único pacote ZIP dentro dos limites informados pela ferramenta.",
  },
];

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "Compactar Arquivos em ZIP",
      url,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
      description,
    },
    {
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />

      <CompactarArquivosZipClient />

      <section className="border-t border-border bg-muted/10 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Guia de compactação ZIP
          </p>
          <h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight">
            O que acontece quando você compacta arquivos em ZIP
          </h2>

          <div className="mt-6 max-w-4xl space-y-4 leading-8 text-muted-foreground">
            <p>
              Um arquivo ZIP funciona como um pacote que reúne vários itens em um único arquivo.
              Isso facilita organização, envio, backup e armazenamento, além de poder reduzir o
              tamanho total dependendo dos tipos de arquivo selecionados.
            </p>
            <p>
              Nesta ferramenta, os arquivos são adicionados ao pacote e processados diretamente
              no navegador. O ZIP resultante é gerado no dispositivo e disponibilizado para
              download sem a necessidade de enviar os arquivos ao servidor do Kivai.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <article className="rounded-xl border border-border bg-background p-5">
              <h3 className="text-lg font-semibold">Quando usar</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Use quando precisar reunir documentos, imagens, planilhas ou outros arquivos em
                um único pacote para compartilhar, arquivar ou organizar.
              </p>
            </article>
            <article className="rounded-xl border border-border bg-background p-5">
              <h3 className="text-lg font-semibold">Nível de compactação</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                A opção rápida prioriza velocidade. A equilibrada serve para a maioria dos casos.
                A máxima pode gastar mais processamento e nem sempre gera diferença relevante.
              </p>
            </article>
            <article className="rounded-xl border border-border bg-background p-5">
              <h3 className="text-lg font-semibold">Tamanho final</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Nem todo arquivo fica menor dentro de um ZIP. Formatos que já são comprimidos,
                como muitos vídeos e imagens, costumam ter pouca redução adicional.
              </p>
            </article>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
              <h3 className="text-xl font-semibold">Como compactar arquivos em ZIP</h3>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                <li>Selecione ou arraste os arquivos que deseja reunir.</li>
                <li>Defina o nome do pacote ZIP.</li>
                <li>Escolha o nível de compactação.</li>
                <li>Clique em Compactar em ZIP e aguarde a geração.</li>
                <li>O download do arquivo .zip será iniciado pelo navegador.</li>
              </ol>
            </article>

            <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
              <h3 className="text-xl font-semibold">Privacidade e limites</h3>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                O processamento local reduz a necessidade de transferir seus arquivos pela internet,
                mas utiliza memória e processamento do próprio dispositivo. Pacotes maiores podem
                funcionar melhor em computadores com mais memória disponível.
              </p>
            </article>
          </div>

          <div className="mt-8 rounded-xl border border-border bg-background p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Perguntas frequentes</h2>
            <div className="mt-5 space-y-5 text-sm leading-7 text-muted-foreground">
              {faq.map((item) => (
                <div key={item.question}>
                  <h3 className="font-semibold text-foreground">{item.question}</h3>
                  <p className="mt-1">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
