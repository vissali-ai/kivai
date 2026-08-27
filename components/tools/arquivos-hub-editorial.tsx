import { getSiteHubBySlug } from "@/lib/site-cms/repository";

export async function ArquivosHubEditorial() {
  const managedHub = await getSiteHubBySlug("arquivos", true);
  if (managedHub?.contentHtml) return <section className="border-t border-border bg-muted/10 py-14 sm:py-18"><article className="cms-public-content mx-auto max-w-6xl px-4 sm:px-6 lg:px-8" dangerouslySetInnerHTML={{ __html: managedHub.contentHtml }} /></section>;
  return (
    <section
      aria-labelledby="arquivos-editorial-title"
      className="border-t border-border bg-muted/10 py-14 sm:py-18"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">
          Guia de organização de arquivos
        </p>
        <h2
          id="arquivos-editorial-title"
          className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight"
        >
          Escolha entre compactar, extrair ou organizar arquivos em lote
        </h2>

        <div className="mt-6 max-w-4xl space-y-4 leading-8 text-muted-foreground">
          <p>
            Arquivos podem exigir operações diferentes conforme o objetivo. Compactar reúne vários itens em um único pacote ZIP e pode facilitar armazenamento ou compartilhamento. Extrair faz o caminho inverso, abrindo pacotes ZIP ou RAR para recuperar o conteúdo. Já as ferramentas em lote ajudam a padronizar nomes sem alterar o conteúdo dos arquivos.
          </p>
          <p>
            ZIP e RAR são formatos distintos, por isso a compatibilidade depende do arquivo e da operação escolhida. Em tarefas de organização, renomear em lote substitui o nome segundo um padrão definido, enquanto adicionar prefixo ou sufixo preserva o nome existente e apenas acrescenta informação antes ou depois dele. Para materiais importantes, mantenha uma cópia do conjunto original antes de processar.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <article className="rounded-xl border border-border bg-background p-5">
            <h3 className="text-lg font-semibold">Compactar ou extrair</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Use ZIP para reunir arquivos em um pacote ou extraia ZIP e RAR quando precisar acessar novamente os itens armazenados dentro do arquivo compactado.
            </p>
          </article>
          <article className="rounded-xl border border-border bg-background p-5">
            <h3 className="text-lg font-semibold">Renomear em lote</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Indicado para padronizar muitos nomes de uma vez, como fotos de produtos, documentos, relatórios ou arquivos exportados de sistemas, mantendo as extensões preservadas.
            </p>
          </article>
          <article className="rounded-xl border border-border bg-background p-5">
            <h3 className="text-lg font-semibold">Prefixo ou sufixo</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Útil quando o nome atual precisa ser mantido, mas é necessário acrescentar informações como categoria, data, campanha, versão, cliente ou código de identificação.
            </p>
          </article>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h3 className="text-xl font-semibold">Fluxo recomendado para organizar arquivos</h3>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
              <li>Separe os arquivos que realmente fazem parte da tarefa e mantenha uma cópia do conjunto original.</li>
              <li>Escolha entre compactar, extrair, renomear ou apenas acrescentar prefixo ou sufixo conforme o resultado desejado.</li>
              <li>Revise o padrão de nomes e a ordem dos arquivos antes de aplicar alterações em lote.</li>
              <li>Confira o resultado final e, em pacotes ZIP ou RAR, verifique se todos os arquivos esperados estão presentes.</li>
            </ol>
          </article>
          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h3 className="text-xl font-semibold">Privacidade, integridade e segurança</h3>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              O tipo de processamento pode variar entre as ferramentas do hub. Quando uma ferramenta informar que a operação ocorre localmente, os arquivos permanecem no dispositivo durante aquela tarefa. Independentemente do método utilizado, evite processar arquivos desconhecidos sem verificar a origem, preserve cópias de materiais importantes e confirme o conteúdo gerado antes de substituir os originais.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
