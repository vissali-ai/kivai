import { AdSlot } from "@/components/ads/AdSlot";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import { buildToolPageSchema } from "@/lib/tool-page-schema";
import { getToolBySlug } from "@/lib/tools";

const slug = "radar-de-tendencias";

const faqs = [
  {
    question: "O Radar publica as matérias completas?",
    answer: "Não. O Kivai mostra título, fonte, data, uma descrição curta e o link para a publicação original.",
  },
  {
    question: "As notícias são atualizadas automaticamente?",
    answer: "A busca começa quando você seleciona um tema e usa o botão. Resultados coletados recentemente podem ser reutilizados por alguns minutos.",
  },
  {
    question: "Por que aparecem menos de dez notícias?",
    answer: "O Radar não inclui conteúdo antigo apenas para completar a lista. Em horários com poucas publicações recentes, o resultado pode ser menor.",
  },
  {
    question: "Como as notícias são organizadas?",
    answer: "A seleção considera horário de publicação, prioridade das fontes, diversidade e a presença do mesmo acontecimento em mais de uma fonte.",
  },
  {
    question: "O Radar usa inteligência artificial para resumir textos?",
    answer: "Não nesta versão piloto. A descrição fornecida pela fonte é utilizada quando está disponível.",
  },
  {
    question: "Quais dados são guardados durante o piloto?",
    answer: "O Kivai registra totais agregados de buscas, resultados, falhas e cliques por categoria e dia. Para limitar abuso, o endereço IP é transformado em um identificador irreversível e temporário e não é salvo em texto.",
  },
];

export function RadarToolEditorialV2() {
  const tool = getToolBySlug(slug);
  if (!tool) return null;

  const schema = buildToolPageSchema({
    name: tool.name,
    slug,
    description: tool.seoDescription ?? tool.description,
    applicationCategory: "NewsApplication",
    breadcrumbs: [
      { name: "Início", href: "/" },
      { name: "Ferramentas", href: "/ferramentas" },
      { name: "Social Media", href: "/ferramentas/social-media" },
      { name: tool.name, href: `/ferramentas/${slug}` },
    ],
    faqs,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />
      <ToolEditorialLayout
        slug={slug}
        overview={[
          "O Radar foi criado para reduzir o tempo gasto abrindo vários sites. Em vez de reproduzir matérias, ele consulta fontes especializadas, remove resultados repetidos e leva você até a publicação original.",
          "A versão atual cobre Marketing, Inteligência Artificial e E-commerce. O Radar prioriza conteúdo recente e diversidade de fontes. O termo “tendências” no nome se refere ao acompanhamento de temas e acontecimentos que aparecem na cobertura das fontes; a ferramenta não prevê tendências nem mede popularidade do mercado.",
        ]}
        useCases={[
          {
            title: "Pesquisar pautas recentes",
            description: "Use o Radar para encontrar acontecimentos recentes que podem inspirar pautas, análises e acompanhamento de mercado. Antes de publicar ou tomar uma decisão, confira a matéria na fonte original.",
          },
          {
            title: "Acompanhar o mercado digital",
            description: "Consulte fontes especializadas de Marketing, Inteligência Artificial e E-commerce sem precisar abrir vários sites manualmente.",
          },
          {
            title: "Identificar cobertura simultânea",
            description: "O selo em alta sinaliza quando títulos suficientemente semelhantes sobre um acontecimento aparecem em fontes diferentes. Ele representa cobertura simultânea entre as fontes consultadas, não volume de audiência ou tendência de mercado.",
          },
        ]}
        steps={[
          "Escolha uma das categorias disponíveis.",
          "Inicie a busca de notícias recentes.",
          "O Kivai verifica se já existe uma coleta recente e, quando necessário, consulta as fontes configuradas no servidor.",
          "Resultados repetidos são agrupados e a lista prioriza recência e diversidade.",
          "Abra a publicação desejada diretamente no site de origem.",
        ]}
        specificationsTitle="Coleta, critérios e resultado"
        specifications={[
          {
            label: "Processamento",
            value: "A coleta e organização dos resultados acontecem no servidor do Kivai.",
          },
          {
            label: "Conteúdo exibido",
            value: "Título, fonte, data, descrição curta quando disponível e link para a publicação original.",
          },
          {
            label: "Critérios de ordenação",
            value: "Recência, prioridade das fontes, diversidade e presença do mesmo acontecimento em mais de uma fonte.",
          },
          {
            label: "Selo em alta",
            value: "Indica cobertura simultânea em fontes diferentes. Não representa garantia de popularidade em redes sociais.",
          },
        ]}
        privacy="A coleta acontece no servidor. O Kivai registra métricas agregadas por categoria e dia. Para limitar abuso, o endereço IP é transformado em um identificador irreversível e temporário e não é salvo em texto. O Radar não exige conta nem acesso a perfis de redes sociais."
        limitations={[
          "O Radar depende das datas, títulos e descrições fornecidos pelas fontes consultadas.",
          "Uma publicação pode demorar a aparecer ou uma fonte pode ficar temporariamente indisponível.",
          "Diferentes veículos podem registrar horários distintos para o mesmo acontecimento.",
          "Conteúdo sem data verificável não entra na seleção das últimas 24 horas.",
          "O selo em alta indica cobertura simultânea, não uma avaliação editorial absoluta nem uma previsão de alcance.",
        ]}
        faqs={faqs}
        relatedTools={[
          { href: "/ferramentas/planejador-de-conteudo-social-media", label: "Planejador de Conteúdo" },
          { href: "/ferramentas/calendario-editorial-redes-sociais", label: "Calendário Editorial" },
          { href: "/ferramentas/gerador-de-relatorio-social-media", label: "Gerador de Relatório" },
        ]}
        relatedArticles={[{ href: "/blog", label: "Explorar o Blog do Kivai" }]}
        afterFaq={<AdSlot placement="tool-bottom" />}
      />
    </>
  );
}
