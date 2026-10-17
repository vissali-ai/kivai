import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";

const workflow = [
  {
    title: "Comece pelo plano mensal do cliente",
    text: "Registre a verba combinada, quantos leads ou vendas precisam ser gerados, o CPL ou CPA aceitável, a meta de ROAS e a receita atribuída esperada. Sem referência, o sistema consegue mostrar métricas, mas não concluir se o resultado está adequado ao negócio.",
  },
  {
    title: "Importe os relatórios do Google Ads",
    text: "A primeira versão recebe arquivos CSV de desempenho geral de campanhas e termos de pesquisa. O projeto prevê a conexão autorizada com Google Ads API e relatórios complementares para anúncios, palavras-chave, recursos, públicos, recomendações e mudanças.",
  },
  {
    title: "Identifique o que realmente exige atenção",
    text: "Compare gasto e resultados com as metas, considere o período analisado e verifique se há informações suficientes. Um relatório de poucos dias pode não justificar alteração de lances, anúncios ou público.",
  },
  {
    title: "Revise cada recomendação antes de aplicar",
    text: "Uma sugestão deve trazer o motivo, a evidência disponível, o risco da alteração e a ação indicada. Corrigir anúncios recusados ou problemas de mensuração pode ser urgente; trocar o texto de um anúncio com poucos dados pode ser prematuro.",
  },
];

const capabilities = [
  {
    title: "Orçamento, leads, CPL, CPA e ROAS",
    text: "O plano mensal serve como referência para identificar gasto acima do previsto, resultado abaixo da meta e oportunidades para realocar o orçamento. A estimativa depende de datas corretas e da definição das conversões acompanhadas.",
  },
  {
    title: "Recomendações disponíveis no Google Ads",
    text: "A integração deverá trazer recomendações oficiais da plataforma e explicar quais são adequadas aos objetivos do cliente. Uma recomendação do Google não deve ser aplicada automaticamente sem verificar custos, estratégia, metas e possíveis consequências.",
  },
  {
    title: "Anúncios, títulos e descrições",
    text: "A análise detalhada deverá considerar desempenho, força dos anúncios e evidências por recurso, quando disponíveis. Uma análise complementar com IA poderá sugerir variações de textos seguindo políticas publicitárias, mas a qualidade da proposta não comprova desempenho.",
  },
  {
    title: "Recursos e palavras-chave recusados",
    text: "Uma auditoria completa deverá detectar reprovações e limitações de veiculação, explicar a política relacionada e orientar revisão de anúncios, palavras-chave e recursos. A decisão deve respeitar as políticas do Google e evitar sugestões para contorná-las.",
  },
  {
    title: "Termos de pesquisa e novas palavras-chave",
    text: "Além de revisar possíveis negativas, o sistema deverá indicar buscas relevantes com conversões que mereçam estudo como novas palavras-chave. Antes de adicionar, será necessário conferir relevância, palavras existentes, correspondências e risco de canibalização.",
  },
  {
    title: "Públicos, regiões, dispositivos e horários",
    text: "A integração deverá comparar desempenhos por segmentos compatíveis com cada campanha. Públicos sobrepostos não devem ter suas conversões somadas indiscriminadamente, e pequenas amostras não justificam alterações agressivas.",
  },
  {
    title: "Performance Max, Shopping e Vídeo",
    text: "Cada modalidade exige métricas próprias. Performance Max utiliza grupos de recursos e relatórios específicos; Shopping requer leitura de produtos; Vídeo pode ter metas relacionadas a visualizações e engajamento, além de conversões.",
  },
  {
    title: "Informações do leilão e concorrentes",
    text: "Os relatórios detalhados de informações do leilão não estão disponíveis publicamente pela API comum. O recurso deverá permitir importação manual dos relatórios quando o usuário os possuir, sem inventar participação ou movimentações dos concorrentes.",
  },
];

const questions = [
  {
    q: "Como analisar uma campanha do Google Ads?",
    a: "Comece pela meta do cliente e pelo período avaliado. Verifique orçamento, impressões, cliques, conversões, custo por resultado, valor de conversão e estratégia de lances. Depois analise anúncios, palavras-chave, públicos ou grupos de recursos compatíveis com o tipo de campanha.",
  },
  {
    q: "O analisador funciona com campanhas Performance Max?",
    a: "A versão inicial importa métricas gerais dessas campanhas em CSV. A auditoria completa de Performance Max, incluindo grupos de recursos, ativos e insights de pesquisa, depende de relatórios específicos e será incorporada à integração com a Google Ads API.",
  },
  {
    q: "Quando é melhor não alterar uma campanha Google Ads?",
    a: "Quando a campanha é recente, houve mudança significativa há pouco tempo ou não existe volume suficiente para uma conclusão confiável, é prudente acompanhar a evolução antes de modificar lances, públicos ou anúncios. Problemas críticos de aprovação, mensuração e orçamento precisam ser verificados sem demora.",
  },
  {
    q: "Posso analisar termos de pesquisa e descobrir palavras-chave negativas?",
    a: "Sim. A versão inicial permite importar termos de pesquisa em CSV e separar consultas com custo e sem conversões para revisão. Esses termos não são negativados automaticamente, pois buscas sem conversão podem ser relevantes e ainda precisar de mais dados.",
  },
  {
    q: "O que são recomendações do Google Ads?",
    a: "São sugestões geradas pela própria plataforma relacionadas a orçamento, palavras-chave, anúncios, recursos e estratégias de lances, entre outros temas. Nem toda recomendação é adequada a qualquer negócio. A integração futura deverá confrontá-las com o plano mensal do cliente antes de recomendar uma ação.",
  },
  {
    q: "Como saber se estou gastando mais que o orçamento do cliente?",
    a: "Cadastre o orçamento mensal e importe um relatório acumulado desde o primeiro dia do mês. O analisador pode comparar o gasto até a data com uma referência proporcional, sem tratar essa referência como previsão exata de entrega.",
  },
  {
    q: "É possível analisar campanhas sem conectar a conta Google Ads?",
    a: "Sim. Os módulos básicos importam relatórios CSV no navegador. Se você optar pela análise complementar com IA e autorizar, o resumo de desempenho e trechos dos relatórios selecionados serão enviados ao serviço de IA do Google. Dados ausentes não são considerados conhecidos.",
  },
  {
    q: "Qual a diferença entre CPL, CPA e ROAS?",
    a: "CPL indica quanto custa gerar um lead. CPA representa o custo por uma ação ou aquisição definida. ROAS compara o valor de conversão atribuído aos anúncios com o gasto publicitário. Essas métricas respondem a perguntas diferentes e precisam estar alinhadas ao objetivo da campanha.",
  },
];

export function GoogleAdsAnalyzerEditorial() {
  return (
    <article className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-8" aria-labelledby="guia-analisador-google-ads">
      <div className="border-t border-white/10 pt-14">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <BookOpen className="size-4" aria-hidden="true" /> Guia de análise de campanhas
        </p>
        <h2 id="guia-analisador-google-ads" className="mt-3 max-w-4xl text-2xl font-semibold tracking-tight sm:text-3xl">
          Como analisar campanhas de tráfego pago no Google Ads e escolher as otimizações certas
        </h2>
        <p className="mt-5 max-w-4xl text-sm leading-7 text-muted-foreground sm:text-base">
          Uma boa auditoria de Google Ads começa por uma pergunta simples: a campanha está entregando
          o resultado que o cliente contratou? Impressões e cliques, isoladamente, não demonstram
          eficiência comercial. É necessário relacionar o investimento aos objetivos de cada conta,
          observar o histórico e decidir se existe evidência para agir agora ou se a campanha precisa
          de mais tempo e dados. O Analisador de Tráfego Pago Google Ads do Kivai foi projetado para
          organizar essa rotina com análises explicadas, acessíveis e progressivamente automatizadas.
        </p>
      </div>

      <section className="mt-10" aria-labelledby="como-utilizar">
        <h3 id="como-utilizar" className="text-xl font-semibold">Como utilizar a ferramenta</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {workflow.map((item, index) => (
            <section key={item.title} className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
              <p className="text-xs font-semibold text-primary">Etapa {index + 1}</p>
              <h4 className="mt-2 font-semibold">{item.title}</h4>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.text}</p>
            </section>
          ))}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="analises-possiveis">
        <h3 id="analises-possiveis" className="text-xl font-semibold">O que pode ser avaliado em uma auditoria completa</h3>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Os relatórios necessários variam entre Pesquisa, Performance Max, Display, Shopping,
          Vídeo, Demand Gen e outras modalidades. Os tópicos abaixo representam o escopo de evolução
          do analisador. Nesta primeira versão, a leitura automatizada cobre apenas indicadores gerais
          de campanhas e revisão preliminar de termos por CSV.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {capabilities.map((item) => (
            <section key={item.title} className="rounded-xl border border-white/10 p-5">
              <h4 className="flex items-start gap-2 text-sm font-semibold">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                {item.title}
              </h4>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.text}</p>
            </section>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-xl border border-white/10 bg-white/[0.025] p-6" aria-labelledby="quando-nao-otimizar">
        <h3 id="quando-nao-otimizar" className="text-xl font-semibold">Otimizar também significa saber quando não mexer</h3>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Uma alteração feita sem fundamento pode prejudicar campanhas que estavam começando a entregar
          resultados. Por isso, o analista deve considerar a data de início, alterações recentes,
          tipo de estratégia, número de conversões, diferenças entre períodos, atrasos de atribuição e
          a qualidade dos dados. Não existe um número universal de dias que torne qualquer campanha
          pronta para receber alterações. O prazo depende do aprendizado, do volume de resultados e
          do contexto do anunciante. Recomendações de manutenção e observação fazem parte da análise.
        </p>
      </section>

      <section className="mt-12" aria-labelledby="faq-google-ads">
        <h3 id="faq-google-ads" className="text-xl font-semibold">Perguntas frequentes sobre análise de Google Ads</h3>
        <div className="mt-5 space-y-3">
          {questions.map((item) => (
            <details key={item.q} className="group rounded-xl border border-white/10 bg-white/[0.025] p-4">
              <summary className="cursor-pointer text-sm font-semibold leading-6">{item.q}</summary>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-12 rounded-xl border border-primary/20 bg-primary/[0.045] p-6">
        <h3 className="text-lg font-semibold">Ferramentas relacionadas</h3>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          Precisa de cálculos rápidos antes de avaliar uma campanha? O Kivai mantém calculadoras
          independentes para retorno de investimento, além das ferramentas de análise deste hub.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link href="/ferramentas/calculadora-de-roas" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Calculadora de ROAS <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link href="/ferramentas/calculadora-de-roi" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Calculadora de ROI <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link href="/ferramentas/trafego-pago" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Hub Tráfego Pago <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
