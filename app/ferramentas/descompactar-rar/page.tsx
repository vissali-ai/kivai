import type { Metadata } from "next";

import DescompactarRarClient from "./descompactar-rar-client";
import { getPageMetadata, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = getPageMetadata({
  title: "Descompactar RAR Online",
  description:
    "Abra e descompacte arquivos RAR online no navegador. Veja o conteúdo do RAR e baixe os arquivos extraídos sem enviar o documento para nossos servidores.",
  pathname: "/ferramentas/descompactar-rar",
});

const schema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Descompactar RAR Online",
  url: `${SITE_URL}/ferramentas/descompactar-rar`,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "BRL",
  },
  description:
    "Ferramenta online para abrir arquivos RAR e baixar o conteúdo extraído diretamente no navegador.",
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />
      <DescompactarRarClient />

      <section className="border-t border-border bg-muted/5 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
            <article>
              <h2 className="text-2xl font-semibold tracking-tight">
                Como descompactar um arquivo RAR online
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Selecione o arquivo RAR, informe a senha apenas se o pacote estiver protegido e
                clique em abrir. O Kivai lista os arquivos encontrados e permite baixar cada item
                separadamente. A descompactação acontece no próprio navegador.
              </p>

              <h2 className="mt-10 text-2xl font-semibold tracking-tight">
                Qual é a diferença entre abrir e descompactar RAR?
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Abrir o RAR significa visualizar o que está armazenado dentro do pacote.
                Descompactar é recuperar um dos arquivos em seu formato original. Nesta ferramenta,
                você pode primeiro conferir a estrutura do RAR e depois extrair somente o que precisa.
              </p>

              <h2 className="mt-10 text-2xl font-semibold tracking-tight">
                Seus arquivos são enviados para o servidor?
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Não. O arquivo selecionado é processado localmente no navegador com WebAssembly.
                O conteúdo do RAR não é enviado ao servidor do Kivai para ser descompactado.
              </p>

              <h2 className="mt-10 text-2xl font-semibold tracking-tight">
                Limites e compatibilidade
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                O desempenho depende da memória disponível no computador ou celular e do tamanho dos
                arquivos internos. Pacotes multipartes, arquivos danificados ou variantes incomuns
                podem não ser processados. RAR protegido por senha pode ser aberto quando a senha
                correta for informada.
              </p>
            </article>

            <aside className="rounded-2xl border border-border bg-background p-6">
              <h2 className="text-lg font-semibold">Perguntas frequentes</h2>
              <div className="mt-5 space-y-6 text-sm leading-6 text-muted-foreground">
                <div>
                  <h3 className="font-medium text-foreground">A ferramenta cria arquivos RAR?</h3>
                  <p className="mt-1">
                    Não. Esta página é exclusivamente para abrir e descompactar RAR.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Funciona com RAR 5?</h3>
                  <p className="mt-1">
                    O mecanismo utilizado oferece suporte a arquivos RAR modernos, incluindo RAR 5,
                    desde que o pacote não use um recurso incompatível.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Posso usar no celular?</h3>
                  <p className="mt-1">
                    Sim, em navegadores compatíveis, mas arquivos grandes podem exigir mais memória
                    do que alguns celulares conseguem disponibilizar.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
