import type { ManagedSiteContent } from "@/lib/site-cms/types";

export const creditsContent: ManagedSiteContent = {
  id: "existing:creditos", contentType: "page", slug: "creditos", path: "/creditos",
  title: "Créditos para ferramentas inteligentes",
  shortDescription: "Use primeiro os créditos mensais incluídos no seu plano. A compra avulsa é opcional, disponível também para contas gratuitas, e não cria uma assinatura.",
  contentHtml: '<h2>IA incluída no plano</h2><p>Contas gratuitas recebem 10 créditos por mês; Pro inclui 100 e Agency inclui 300. O uso dentro da franquia não tem cobrança adicional. Os créditos do plano renovam no dia 1º de cada mês, no horário de Brasília, e não acumulam. Planos anuais também recebem a franquia mensalmente enquanto estiverem ativos.</p><h2>Quanto custa cada recurso?</h2><p>Planejador de Conteúdo: 1 crédito para sugerir mensagem, gancho, roteiro e CTA. Calendário Editorial: 1 crédito para gerar até 7 sugestões com legendas. No Relatório Social Media, a análise e a importação CSV/Excel custam 1 crédito; prints ou PDF custam 2 créditos.</p><p>Revisar, aplicar, editar e exportar resultados não consome novos créditos. Cada nova geração solicitada consome a quantidade informada antes do envio. As solicitações também estão sujeitas a limites de disponibilidade.</p><h2>Créditos avulsos</h2><p>Os créditos comprados não expiram e são usados depois da franquia mensal. A compra avulsa não altera seu plano nem gera mensalidade. O saldo só é liberado após a confirmação do pagamento pelo servidor.</p><h2>Se a IA não concluir</h2><p>Solicitações com falha detectada têm a reserva devolvida. Em interrupções, a devolução pode depender da recuperação automática. Consulte o saldo antes de tentar novamente.</p>',
  seoTitle: "Créditos de IA | Kivai", seoDescription: "Conheça os créditos incluídos no Pro e Agency e os pacotes avulsos para as ferramentas de IA do Kivai.",
  canonicalUrl: "", hubId: null, existingToolSlug: null, toolMode: "informational", technicalStatus: "not_applicable", displayLocation: "direct", showInMostUsed: false, displayOrder: 21,
  status: "published", indexable: false, includeInSitemap: false, publishedAt: null, createdAt: "", updatedAt: "", virtual: true,
  customData: { originalFields: [] },
};
