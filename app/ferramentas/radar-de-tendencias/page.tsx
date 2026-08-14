import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { getPageMetadata, SITE_URL } from "@/lib/seo";
import { RadarDeTendenciasClient } from "./radar-de-tendencias-client";

const pathname = "/ferramentas/radar-de-tendencias";
const title = "Radar de Notícias e Tendências";
const description = "Encontre notícias recentes de marketing, inteligência artificial e e-commerce em uma seleção rápida de fontes especializadas.";

export const metadata = getPageMetadata({ title, description, pathname });

const faq = [
  ["O Radar publica as matérias completas?", "Não. O Kivai mostra título, fonte, data, uma descrição curta e o link para a publicação original."],
  ["As notícias são atualizadas automaticamente?", "A busca começa quando você seleciona um tema e usa o botão. Resultados coletados recentemente podem ser reutilizados por alguns minutos."],
  ["Por que aparecem menos de dez notícias?", "O Radar não inclui conteúdo antigo apenas para completar a lista. Em horários com poucas publicações recentes, o resultado pode ser menor."],
  ["Como as notícias são organizadas?", "A seleção considera horário de publicação, prioridade das fontes, diversidade e a presença do mesmo acontecimento em mais de uma fonte."],
  ["O Radar usa inteligência artificial para resumir textos?", "Não nesta versão piloto. A descrição fornecida pela fonte é utilizada quando está disponível."],
  ["Quais dados são guardados durante o piloto?", "O Kivai registra somente totais agregados de buscas, resultados, falhas e cliques por categoria e dia. O Radar não precisa de conta nem armazena o seu endereço IP nas métricas."],
] as const;

const schema = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: title,
    applicationCategory: "NewsApplication",
    operatingSystem: "Qualquer sistema com navegador moderno",
    url: `${SITE_URL}${pathname}`,
    description,
    offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ferramentas", item: `${SITE_URL}/ferramentas` },
      { "@type": "ListItem", position: 2, name: "Social Media", item: `${SITE_URL}/ferramentas/social-media` },
      { "@type": "ListItem", position: 3, name: title, item: `${SITE_URL}${pathname}` },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(([name, text]) => ({
      "@type": "Question",
      name,
      acceptedAnswer: { "@type": "Answer", text },
    })),
  },
];

export default function RadarDeTendenciasPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <ToolPageShell
        title={title}
        description={description}
        categoryName="Social Media"
        categoryHref="/ferramentas/social-media"
        processingMode="server"
        privacyMessage="A coleta acontece no servidor. Registramos métricas agregadas por categoria e dia. Para limitar abuso, o IP vira um identificador irreversível e temporário; o endereço não é salvo em texto."
      >
        <RadarDeTendenciasClient />
      </ToolPageShell>
      <section className="border-t border-border bg-muted/10 py-12">
        <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
          <article className="border border-border bg-background p-5 sm:p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">Piloto de 30 dias</p>
            <h2 className="mt-2 text-2xl font-semibold">Uma seleção curta para acompanhar o mercado digital</h2>
            <p className="mt-4 leading-7 text-muted-foreground">O Radar foi criado para reduzir o tempo gasto abrindo vários sites. Em vez de reproduzir matérias, ele consulta fontes especializadas, remove resultados repetidos e leva você até a publicação original. Esta primeira versão cobre Marketing, Inteligência Artificial e E-commerce.</p>
          </article>

          <div className="grid gap-6 lg:grid-cols-2">
            <article className="border border-border bg-background p-5 sm:p-6">
              <h2 className="text-2xl font-semibold">Como funciona</h2>
              <ol className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                <li>1. Você escolhe uma das três categorias do piloto.</li>
                <li>2. O Kivai verifica se já existe uma coleta recente.</li>
                <li>3. Quando necessário, consulta as fontes configuradas no servidor.</li>
                <li>4. Notícias repetidas são agrupadas e as mais recentes recebem prioridade.</li>
                <li>5. Até dez resultados levam diretamente aos sites de origem.</li>
              </ol>
            </article>
            <article className="border border-border bg-background p-5 sm:p-6">
              <h2 className="text-2xl font-semibold">O que significa “em alta”</h2>
              <p className="mt-4 leading-7 text-muted-foreground">O selo aparece quando títulos suficientemente semelhantes sobre um acontecimento são encontrados em fontes diferentes. Ele indica cobertura simultânea, não uma avaliação editorial absoluta nem uma garantia de popularidade em redes sociais.</p>
              <p className="mt-4 leading-7 text-muted-foreground">A ordem também favorece recência e diversidade para evitar que uma única publicação domine toda a lista.</p>
            </article>
          </div>

          <article className="border border-border bg-background p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Limites desta versão</h2>
            <p className="mt-4 leading-7 text-muted-foreground">O Radar depende das datas e descrições fornecidas pelas fontes. Uma publicação pode demorar a aparecer, uma fonte pode ficar temporariamente indisponível e diferentes veículos podem registrar horários distintos. Conteúdo sem data verificável não entra na seleção das últimas 24 horas.</p>
          </article>

          <article className="border border-border bg-background p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Perguntas frequentes</h2>
            <div className="mt-5 space-y-3">{faq.map(([question, answer]) => (
              <details key={question} className="border border-border p-4">
                <summary className="cursor-pointer font-medium">{question}</summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p>
              </details>
            ))}</div>
          </article>

          <nav aria-label="Ferramentas e conteúdos relacionados" className="border border-border bg-background p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Continue planejando seu conteúdo</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Related href="/ferramentas/planejador-de-conteudo-social-media">Planejador de Conteúdo</Related>
              <Related href="/ferramentas/calendario-editorial-redes-sociais">Calendário Editorial</Related>
              <Related href="/blog">Blog do Kivai</Related>
            </div>
          </nav>
        </div>
      </section>
    </>
  );
}

function Related({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary">{children}<ArrowRight className="size-4" aria-hidden="true" /></Link>;
}
