import type { Metadata } from "next";

import DescompactarZipClient from "./descompactar-zip-client";
import { SITE_URL } from "@/lib/seo";

const title = "Descompactar ZIP Online Grátis | Kivai";
const description =
  "Descompacte arquivos ZIP online, visualize o conteúdo e baixe os arquivos diretamente no navegador, sem enviar o ZIP para o servidor do Kivai.";
const url = `${SITE_URL}/ferramentas/descompactar-zip`;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  keywords: [
    "descompactar zip",
    "abrir zip online",
    "extrair zip",
    "descompactar arquivo zip",
    "abrir arquivo zip",
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

export default function Page() {
  return (
    <>
      <DescompactarZipClient />

      <section className="border-t border-border bg-muted/10 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Guia de arquivos ZIP
          </p>
          <h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight">
            O que acontece quando você descompacta um arquivo ZIP
          </h2>

          <div className="mt-6 max-w-4xl space-y-4 leading-8 text-muted-foreground">
            <p>
              Um arquivo ZIP funciona como um pacote que pode reunir documentos, imagens,
              planilhas, pastas e outros tipos de arquivo. Descompactar significa abrir esse
              pacote e recuperar os itens armazenados nele para uso normal.
            </p>
            <p>
              Nesta ferramenta, a leitura e a extração acontecem no próprio navegador. O
              arquivo selecionado não precisa ser enviado ao servidor do Kivai para que seu
              conteúdo seja listado ou extraído.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <article className="rounded-xl border border-border bg-background p-5">
              <h3 className="text-lg font-semibold">Quando usar</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Use para abrir pacotes ZIP recebidos por e-mail, downloads, sistemas,
                marketplaces ou serviços de armazenamento sem instalar um descompactador.
              </p>
            </article>
            <article className="rounded-xl border border-border bg-background p-5">
              <h3 className="text-lg font-semibold">Arquivos protegidos</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                ZIPs protegidos por senha ou criados com métodos de compressão não
                compatíveis podem não ser abertos no navegador. O arquivo original não é
                alterado.
              </p>
            </article>
            <article className="rounded-xl border border-border bg-background p-5">
              <h3 className="text-lg font-semibold">Arquivos muito grandes</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                A extração utiliza memória do seu dispositivo. Pacotes grandes ou com muitos
                itens podem exigir mais recursos e funcionar melhor em um computador.
              </p>
            </article>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
              <h3 className="text-xl font-semibold">Como descompactar um ZIP</h3>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
                <li>Selecione um arquivo com extensão .zip.</li>
                <li>Aguarde a leitura da estrutura do pacote.</li>
                <li>Confira os arquivos e pastas encontrados.</li>
                <li>Baixe somente os itens de que precisa.</li>
              </ol>
            </article>

            <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
              <h3 className="text-xl font-semibold">Privacidade e segurança</h3>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                O processamento desta ferramenta ocorre localmente no navegador. Ainda assim,
                não abra arquivos desconhecidos sem verificar sua origem e mantenha seu
                antivírus e sistema operacional atualizados. Descompactar não torna um arquivo
                interno seguro automaticamente.
              </p>
            </article>
          </div>

          <div className="mt-8 rounded-xl border border-border bg-background p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Perguntas frequentes</h2>
            <div className="mt-5 space-y-5 text-sm leading-7 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground">O arquivo ZIP é enviado para o Kivai?</h3>
                <p className="mt-1">Não. A leitura e a extração são executadas localmente no navegador.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">A ferramenta também abre RAR?</h3>
                <p className="mt-1">Não nesta página. O suporte a RAR será disponibilizado em uma ferramenta própria do Hub Arquivos.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">O ZIP original é modificado?</h3>
                <p className="mt-1">Não. A ferramenta apenas lê o pacote e gera downloads dos arquivos selecionados.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
