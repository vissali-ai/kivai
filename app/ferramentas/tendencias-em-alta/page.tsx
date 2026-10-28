import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { getToolMetadataAsync } from "@/lib/seo";
import { getBrazilTrends } from "@/lib/google-trends-rss";
import { TrendsClient } from "./trends-client";

export async function generateMetadata() {
  return getToolMetadataAsync("tendencias-em-alta");
}

export default async function TrendsPage() {
  let data: Awaited<ReturnType<typeof getBrazilTrends>> | null = null;
  try {
    data = await getBrazilTrends();
  } catch (error) {
    console.error("[trends-rss] Feed indisponível:", error instanceof Error ? error.message : "erro desconhecido");
  }
  return (
    <ToolPageShell
      title="Tendências em Alta no Brasil"
      description="Consulte os assuntos em alta nas pesquisas do Google Brasil, os volumes aproximados e as notícias relacionadas. Dados do feed RSS oficial do Google Trends."
      categoryName="Social Media"
      categoryHref="/ferramentas/social-media"
      processingMode="server"
      privacyMessage="As tendências são consultadas no servidor a partir do feed público do Google Trends, com cache de aproximadamente 10 minutos. Nenhuma conta Google é necessária."
    >
      <TrendsClient topics={data?.topics ?? []} fetchedAt={data?.fetchedAt ?? null} unavailable={!data} />
      <section className="mt-10 space-y-4 border-t border-border pt-7 text-sm leading-7 text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground">Como interpretar as tendências</h2>
        <p>Os assuntos representam pesquisas em alta no Google, não tendências medidas diretamente no Instagram, TikTok ou outras redes sociais. O volume é uma faixa aproximada informada pelo Google, não uma contagem exata.</p>
        <p>Esta ferramenta apresenta apenas os tópicos disponibilizados pelo RSS público para o Brasil. O feed pode conter menos itens que a página Em alta, não oferece gráficos históricos, categorias detalhadas ou filtros por períodos anteriores.</p>
        <h2 className="text-lg font-semibold text-foreground">Como usar no planejamento de conteúdo</h2>
        <p>Pesquise entre os assuntos da lista, observe a data de início e consulte notícias relacionadas para entender o contexto antes de produzir uma publicação. Verifique as informações em fontes confiáveis e respeite os direitos autorais.</p>
        <p>Fonte: <a className="text-primary underline underline-offset-4" href="https://trends.google.com/trending?geo=BR" target="_blank" rel="noopener noreferrer">Google Trends Brasil</a>. O conteúdo é de terceiros e pode mudar a qualquer momento.</p>
      </section>
    </ToolPageShell>
  );
}
