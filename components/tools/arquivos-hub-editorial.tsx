export function ArquivosHubEditorial() {
  return (
    <section
      aria-labelledby="arquivos-editorial-title"
      className="border-t border-border bg-muted/10 py-14 sm:py-18"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">
          Guia de arquivos compactados
        </p>
        <h2
          id="arquivos-editorial-title"
          className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight"
        >
          Entenda quando compactar e quando descompactar arquivos
        </h2>

        <div className="mt-6 max-w-4xl space-y-4 leading-8 text-muted-foreground">
          <p>
            Compactar arquivos serve para reunir um ou mais itens em um único pacote e,
            dependendo do conteúdo, reduzir o tamanho total. Descompactar faz o caminho
            inverso: abre um pacote como ZIP ou RAR para recuperar os arquivos originais.
          </p>
          <p>
            ZIP e RAR têm finalidades semelhantes, mas são formatos diferentes. Por isso,
            a compatibilidade depende do tipo de arquivo e da operação escolhida. Antes de
            processar documentos importantes, mantenha sempre uma cópia do original.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <article className="rounded-xl border border-border bg-background p-5">
            <h3 className="text-lg font-semibold">Descompactar ZIP</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Indicado para abrir pacotes ZIP e recuperar os arquivos contidos neles.
            </p>
          </article>
          <article className="rounded-xl border border-border bg-background p-5">
            <h3 className="text-lg font-semibold">Descompactar RAR</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Indicado para abrir arquivos RAR e extrair o conteúdo para uso normal.
            </p>
          </article>
          <article className="rounded-xl border border-border bg-background p-5">
            <h3 className="text-lg font-semibold">Compactar em ZIP</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Útil para reunir vários arquivos em um único pacote ZIP para organizar,
              armazenar ou compartilhar.
            </p>
          </article>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h3 className="text-xl font-semibold">Boas práticas antes de começar</h3>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
              <li>Guarde uma cópia do arquivo original.</li>
              <li>Confira o formato e o tamanho antes de processar.</li>
              <li>Evite fechar ou atualizar a página durante a operação.</li>
              <li>Abra o resultado e confirme se todos os arquivos estão presentes.</li>
            </ol>
          </article>
          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h3 className="text-xl font-semibold">Privacidade e processamento</h3>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              As ferramentas deste hub serão desenvolvidas com prioridade para processamento
              local no navegador sempre que tecnicamente possível. Isso reduz dependência de
              servidores e evita o envio desnecessário dos arquivos ao Kivai.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
