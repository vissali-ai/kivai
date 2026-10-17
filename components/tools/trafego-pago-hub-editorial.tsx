import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getToolHref } from "@/lib/tools";
import { getSiteHubBySlug } from "@/lib/site-cms/repository";

export async function TrafegoPagoHubEditorial() {
  const managedHub = await getSiteHubBySlug("trafego-pago", true);
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
      aria-labelledby="trafego-pago-editorial-title"
      className="border-t border-border bg-muted/10 py-14 sm:py-18"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">
          Guia de gestão de tráfego pago
        </p>
        <h2
          id="trafego-pago-editorial-title"
          className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight"
        >
          Analise campanhas e compare resultados com as metas do cliente
        </h2>

        <div className="mt-6 max-w-4xl space-y-4 leading-8 text-muted-foreground">
          <p>
            Uma análise de Google Ads começa pelas metas acordadas: orçamento, volume de
            conversões, custo por resultado e retorno esperado. Compare o desempenho do
            período com essas referências antes de sugerir ajustes em anúncios ou lances.
            A projeção proporcional de uma meta mensal é apenas uma referência linear,
            não uma previsão de entrega.
          </p>
          <p>
            O Analisador de Tráfego Pago permite conectar contas autorizadas do Google Ads
            ou importar relatórios de campanhas. Os diagnósticos automáticos apontam desvios
            de metas com base em regras matemáticas. Uma análise complementar com IA pode
            interpretar os dados selecionados mediante consentimento e uso de créditos beta.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <article className="rounded-xl border border-border bg-background p-5">
            <h3 className="text-lg font-semibold">Planejamento de metas</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Defina investimento, meta de leads, CPL aceitável e receita atribuída
              quando esses indicadores estiverem corretamente mensurados.
            </p>
          </article>
          <article className="rounded-xl border border-border bg-background p-5">
            <h3 className="text-lg font-semibold">Diagnóstico automático</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Compare custos, conversões e metas com regras reproduzíveis, sem consumir
              créditos por esses cálculos.
            </p>
          </article>
          <article className="rounded-xl border border-border bg-background p-5">
            <h3 className="text-lg font-semibold">Análise complementar com IA</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Acrescente relatórios para obter uma interpretação contextualizada.
              A análise é opcional e utiliza um crédito quando concluída.
            </p>
          </article>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h3 className="text-xl font-semibold">Fluxo recomendado para revisar campanhas</h3>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
              <li>Selecione a conta Google Ads ou importe um relatório do período correto.</li>
              <li>Informe as metas mensais e compare-as aos dias já concluídos.</li>
              <li>Examine os indicadores e confirme a definição das conversões.</li>
              <li>Investigue os pontos de atenção antes de alterar campanhas, lances ou orçamentos.</li>
            </ol>
          </article>
          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h3 className="text-xl font-semibold">Privacidade e limites da análise</h3>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              A integração consulta dados de contas que você autorizar, sem modificar campanhas.
              Relatórios locais são tratados no navegador quando indicado na ferramenta.
              A análise com IA envia apenas os dados e anexos selecionados após consentimento.
              Conversões não devem ser interpretadas automaticamente como leads ou vendas.
            </p>
          </article>
        </div>

        <div className="mt-10">
          <h3 className="text-lg font-semibold">Ferramentas relacionadas</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            As calculadoras permanecem em seu hub original, sem duplicação no catálogo de Tráfego Pago.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={getToolHref("calculadora-de-roas")}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium transition hover:border-primary/40 hover:text-primary"
            >
              Calculadora de ROAS <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href={getToolHref("calculadora-de-roi")}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium transition hover:border-primary/40 hover:text-primary"
            >
              Calculadora de ROI <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
