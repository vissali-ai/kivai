"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getToolBySlug, getToolsByCategory, toolCategories } from "@/lib/tools";

function getSlug(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  return parts.length === 2 && parts[0] === "ferramentas" ? parts[1] : null;
}

export function ToolPageEnhancements({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const slug = getSlug(pathname);
  const tool = slug ? getToolBySlug(slug) : undefined;

  // As ferramentas de vídeo possuem conteúdo editorial específico no próprio
  // componente. As demais recebem este padrão centralizado.
  if (!tool || tool.category === "video" || ["pdf-para-word", "word-para-pdf", "pdf-para-powerpoint"].includes(tool.slug)) return <>{children}</>;

  const category = toolCategories.find((item) => item.slug === tool.category);
  const relatedTools = getToolsByCategory(tool.category)
    .filter((item) => item.slug !== tool.slug && item.available)
    .slice(0, 3);
  const hasFileWorkflow = ["imagens", "pdf", "video"].includes(tool.category);
  const howToUse = hasFileWorkflow
    ? ["Envie ou arraste o arquivo na área indicada.", "Ajuste as opções da ferramenta conforme a necessidade.", "Execute o processamento e revise o resultado.", "Baixe o arquivo concluído ou inicie uma nova edição."]
    : ["Preencha os campos solicitados pela ferramenta.", "Revise os valores e selecione as opções desejadas.", "Execute o cálculo ou a análise.", "Use o resultado para orientar sua próxima decisão."];
  return (
    <>
      {children}

      <section className="border-t border-border bg-muted/10 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h2 className="text-xl font-semibold">Para que serve {tool.name}?</h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{tool.description} Use a ferramenta gratuitamente no navegador para concluir a tarefa sem instalar programas. {hasFileWorkflow ? "Quando aplicável, seus arquivos são processados localmente no dispositivo." : "Os dados informados servem apenas para gerar o resultado exibido na tela."}</p>
          </article>
        </div>
        <div className="mx-auto mt-6 grid w-full max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h2 className="text-xl font-semibold">Como utilizar {tool.name}</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
              {howToUse.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </article>
          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h2 className="text-xl font-semibold">Benefícios</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
              <li>Uso simples em desktop, tablet e celular.</li>
              <li>Resultado rápido, sem instalação de programas.</li>
              <li>Interface clara para revisar os dados antes de concluir.</li>
              {hasFileWorkflow && <li>Processamento local sempre que a tecnologia da ferramenta permitir.</li>}
            </ul>
          </article>
        </div>
        <div className="mx-auto mt-6 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h2 className="text-xl font-semibold">Perguntas frequentes</h2>
            <div className="mt-5 space-y-5 text-sm leading-6 text-muted-foreground">
              <div><h3 className="font-medium text-foreground">{tool.name} é gratuito?</h3><p className="mt-1">Sim. Você pode utilizar esta ferramenta diretamente no navegador.</p></div>
              <div><h3 className="font-medium text-foreground">Preciso instalar algum programa?</h3><p className="mt-1">Não. A ferramenta foi projetada para ser usada online, em dispositivos compatíveis.</p></div>
              <div><h3 className="font-medium text-foreground">Onde encontro outras opções?</h3><p className="mt-1">Veja as ferramentas relacionadas abaixo ou volte para o hub de {category?.name ?? "ferramentas"}.</p></div>
            </div>
          </article>
          {relatedTools.length > 0 && <div className="mt-6"><h2 className="text-xl font-semibold">Ferramentas relacionadas</h2><div className="mt-4 flex flex-wrap gap-3">{relatedTools.map((item) => <Link key={item.slug} href={`/ferramentas/${item.slug}`} className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary">{item.name}</Link>)}</div></div>}
        </div>
      </section>
    </>
  );
}
