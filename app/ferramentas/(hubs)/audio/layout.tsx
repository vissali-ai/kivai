import Link from "next/link";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Ferramentas de Áudio Online",
  description:
    "Prepare arquivos MP3, WAV, M4A, AAC e FLAC para publicar no YouTube. Transforme áudio em vídeo com capa diretamente no navegador.",
  pathname: "/ferramentas/audio",
});

export default function AudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <section className="border-t border-border bg-background py-14 sm:py-18">
        <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-wider text-primary">Guia de preparação de áudio</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Prepare seu áudio para publicar no YouTube</h2>
            <p className="mt-4 leading-7 text-muted-foreground">Um arquivo de áudio pode ser publicado no YouTube quando é apresentado dentro de um vídeo. A ferramenta desta categoria combina uma faixa de áudio com uma imagem de capa e gera um arquivo de vídeo para você revisar antes de enviar à plataforma.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-border p-5">
              <h3 className="text-lg font-semibold">Como transformar áudio em vídeo</h3>
              <ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-6 text-muted-foreground">
                <li>Escolha o arquivo de áudio no dispositivo.</li><li>Adicione uma imagem de capa que represente o conteúdo.</li><li>Gere o vídeo e confira a reprodução e a duração.</li><li>Baixe o resultado e revise antes de publicar no YouTube.</li>
              </ol>
            </article>
            <article className="rounded-2xl border border-border p-5">
              <h3 className="text-lg font-semibold">Formatos de áudio aceitos</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">A ferramenta Áudio para YouTube trabalha com WAV, MP3, M4A, AAC e FLAC. A extensão não é o único fator importante: confira se o arquivo toca corretamente e se a faixa escolhida é a versão final que você pretende publicar.</p>
            </article>
          </div>
          <div className="rounded-2xl bg-muted/50 p-5 sm:p-6">
            <h3 className="text-lg font-semibold">Cuidados antes de publicar</h3>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">Use uma imagem de capa nítida, mantenha a faixa em volume consistente e escute o vídeo completo ou faça uma revisão por trechos antes de publicar. Verifique também se você tem os direitos necessários sobre a gravação, a composição e a imagem utilizada. O arquivo exportado deve ser conferido no próprio YouTube antes de compartilhar o link.</p>
            <Link href="/ferramentas/audio-para-youtube" className="mt-4 inline-flex font-medium text-primary underline-offset-4 hover:underline">Abrir Áudio para YouTube</Link>
          </div>
        </div>
      </section>
    </>
  );
}
