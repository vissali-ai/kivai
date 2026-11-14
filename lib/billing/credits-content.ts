import type { ManagedSiteContent } from "@/lib/site-cms/types";

export const creditsContent: ManagedSiteContent = {
  id: "existing:creditos", contentType: "page", slug: "creditos", path: "/creditos",
  title: "Créditos para ferramentas inteligentes",
  shortDescription: "Use os recursos de IA com créditos iniciais da conta ou compre créditos adicionais. A compra é avulsa e não gera assinatura. Todas as ferramentas sem IA são gratuitas e não exigem cadastro.",
  contentHtml: '<h2>Como funcionam os créditos</h2><p>Ao entrar na sua conta e confirmar o e-mail, você recebe 5 créditos iniciais de IA uma única vez. Eles não se renovam mensalmente. Créditos adicionais podem ser comprados e ajudam a cobrir os custos de manutenção da plataforma. Todas as demais ferramentas são gratuitas e podem ser usadas sem cadastro.</p><h2>Quanto custa cada recurso?</h2><p>O custo em créditos é informado antes de cada solicitação de IA. Revisar, aplicar, editar e exportar resultados não consome novos créditos. As solicitações também estão sujeitas a limites de disponibilidade.</p><h2>Créditos comprados</h2><p>Os créditos comprados não expiram. A compra avulsa não cria assinatura nem altera o acesso às ferramentas. O saldo só é liberado após a confirmação do pagamento pelo servidor.</p><h2>Se a IA não concluir</h2><p>Solicitações com falha detectada têm a reserva devolvida. Em interrupções, a devolução pode depender da recuperação automática. Consulte o saldo antes de tentar novamente.</p>',
  seoTitle: "Créditos de IA | Kivai", seoDescription: "Use os créditos iniciais de IA ou compre créditos adicionais. Todas as ferramentas Kivai são gratuitas e funcionam sem cadastro.",
  canonicalUrl: "", hubId: null, existingToolSlug: null, toolMode: "informational", technicalStatus: "not_applicable", displayLocation: "direct", showInMostUsed: false, displayOrder: 21,
  status: "published", indexable: false, includeInSitemap: false, publishedAt: null, createdAt: "", updatedAt: "", virtual: true,
  customData: { originalFields: [] },
};
