import { getSiteHubBySlug } from "@/lib/site-cms/repository";

const content = {
  eyebrow: "Guia de documentos PDF",
  title: "Escolha a operação de acordo com o que precisa acontecer com o documento",
  introduction: [
    "Arquivos PDF podem ser convertidos, editados, reorganizados, compactados ou preparados para impressão, e cada operação resolve um problema diferente. Converter altera o tipo de arquivo ou transforma o conteúdo para outro formato; unir, dividir e girar reorganizam o documento; redimensionar muda o tamanho das páginas; compactar busca reduzir o peso; editar permite acrescentar elementos visuais; desbloquear remove a proteção somente quando há senha ou autorização para isso.",
    "Também é importante identificar como o PDF foi criado. Documentos digitais costumam conter texto selecionável, enquanto arquivos escaneados podem ser formados apenas por imagens. Ferramentas sem OCR não reconhecem automaticamente o texto de páginas digitalizadas. Em conversões para Word, Excel, PowerPoint ou HTML, fontes, tabelas, espaçamentos e outros elementos podem exigir revisão após o processamento.",
  ],
  guides: [
    {
      title: "Para converter e reutilizar conteúdo",
      text: "Use PDF para Word quando a prioridade for editar textos, PDF para Excel quando houver tabelas e dados estruturados, PDF para PowerPoint quando as páginas precisarem virar slides e PDF para HTML quando o conteúdo for reutilizado na web. Também é possível transformar imagens em PDF ou exportar páginas do PDF como JPG e PNG.",
    },
    {
      title: "Para organizar, editar e reduzir",
      text: "Unir combina documentos; dividir separa páginas; girar corrige orientação; editar adiciona textos, imagens, formas e marcações; redimensionar adapta o tamanho das páginas; compactar busca reduzir o arquivo. A melhor operação depende do resultado final, não apenas do tamanho do PDF original.",
    },
    {
      title: "Para impressão e compartilhamento",
      text: "Ao preparar um PDF para impressão, diferencie redimensionar páginas de montar o conteúdo em uma nova folha. A montagem permite posicionar e repetir materiais, como etiquetas e cartões. Antes de compartilhar, confira tamanho do arquivo, orientação, margens, legibilidade e se alguma proteção precisa ser mantida.",
    },
  ],
  workflowTitle: "Fluxo recomendado antes de finalizar um PDF",
  workflow: [
    "Mantenha uma cópia do arquivo original e defina se o objetivo é converter, editar, reorganizar, reduzir ou imprimir.",
    "Confira quantidade de páginas, tamanho, orientação, existência de senha e se o conteúdo é texto digital ou imagem escaneada.",
    "Faça primeiro as alterações estruturais, como dividir, unir, girar, editar ou redimensionar, e deixe a compactação para a etapa final quando fizer sentido.",
    "Abra o arquivo gerado e revise textos, tabelas, imagens, margens, paginação e qualidade antes de substituir, enviar ou imprimir a versão anterior.",
  ],
  noteTitle: "Privacidade, proteção e fidelidade",
  note: "O tipo de processamento pode variar entre as ferramentas do hub. Quando uma página informar que o processamento é local, o arquivo permanece no dispositivo durante aquela operação. PDFs protegidos só devem ser desbloqueados com a senha correta ou com autorização para modificar o documento. Conversões entre formatos podem alterar elementos de layout, portanto documentos importantes devem ser revisados antes do uso final e o arquivo original deve ser preservado em local seguro.",
};

export async function PdfHubEditorialContent() {
  const managedHub = await getSiteHubBySlug("pdfs", true);
  if (managedHub?.contentHtml) {
    return (
      <section className="border-t border-border bg-muted/10 py-14 sm:py-18">
        <article
          className="cms-public-content mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"
          dangerouslySetInnerHTML={{ __html: managedHub.contentHtml }}
        />
      </section>
    );
  }

  return (
    <section
      aria-labelledby="pdfs-editorial-title"
      className="border-t border-border bg-muted/10 py-14 sm:py-18"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">
          {content.eyebrow}
        </p>
        <h2
          id="pdfs-editorial-title"
          className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight"
        >
          {content.title}
        </h2>

        <div className="mt-6 max-w-4xl space-y-4 leading-8 text-muted-foreground">
          {content.introduction.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {content.guides.map((guide) => (
            <article key={guide.title} className="rounded-xl border border-border bg-background p-5">
              <h3 className="text-lg font-semibold">{guide.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{guide.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h3 className="text-xl font-semibold">{content.workflowTitle}</h3>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
              {content.workflow.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>

          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h3 className="text-xl font-semibold">{content.noteTitle}</h3>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{content.note}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
