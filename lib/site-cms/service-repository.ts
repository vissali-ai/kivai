import "server-only";

import { businessServices } from "@/lib/business-services";
import { plainText, sanitizePostHtml } from "@/lib/blog/sanitize";
import { slugify } from "@/lib/blog/slug";
import { supabaseRest } from "@/lib/blog/supabase";
import type { ManagedSiteService, SitePublicationStatus, SiteService, SiteServiceInput } from "@/lib/site-cms/types";

type ServiceRow = {
  id: string; slug: string; path: string; title: string; short_description: string; content_html: string;
  seo_title: string; seo_description: string; canonical_url: string; badge: string; service_type: string;
  audience: string; cta_label: string; cta_url: string; cover_image_url: string; existing_service_slug: string | null;
  status: SitePublicationStatus; indexable: boolean; include_in_sitemap: boolean; show_in_services_index: boolean;
  display_order: number; published_at: string | null; created_at: string; updated_at: string;
};

const specialServices = [
  { slug: "social-media", title: "Social Media", description: "Planejamento, criação e publicação de conteúdos para fortalecer a presença de empresas nas redes sociais.", badge: "Período de teste grátis", type: "Gestão de redes sociais", audience: "Empresas e profissionais" },
  { slug: "gestao-de-trafego", title: "Gestão de Tráfego Pago", description: "Estratégias em Google Ads e Meta Ads para gerar oportunidades, vendas e crescimento.", badge: "Mídia de performance", type: "Gestão de mídia paga", audience: "Empresas, lojas e profissionais" },
  { slug: "divulgacao-artistas", title: "Divulgação para Artistas e Bandas", description: "Divulgação de lançamentos, shows e projetos musicais em diferentes redes sociais.", badge: "Marketing musical", type: "Divulgação artística", audience: "Artistas, bandas e produtores" },
  { slug: "criacao-de-landing-pages", title: "Criação de Landing Pages", description: "Páginas modernas, rápidas e personalizadas para negócios, profissionais, eventos e projetos.", badge: "Serviço Premium", type: "Criação de páginas de conversão", audience: "Empresas, profissionais, eventos e artistas" },
];

function sectionsHtml(items: Array<{ title: string; description: string }>, heading: string) {
  return `<h2>${heading}</h2>${items.map((item) => `<h3>${item.title}</h3><p>${item.description}</p>`).join("")}`;
}

const serviceSources = [
  ...specialServices.map((item) => ({ ...item, html: `<h2>Sobre este serviço</h2><p>${item.description}</p><h2>Como o trabalho é organizado</h2><p>O escopo, as entregas, os prazos e as responsabilidades são definidos após uma análise inicial. Edite esta página para manter a proposta fiel ao serviço realmente oferecido.</p><h2>Perguntas frequentes</h2><h3>Como solicitar uma proposta?</h3><p>Envie o contexto, os objetivos e as necessidades do projeto pelo canal de contato.</p>` })),
  ...businessServices.map((service) => ({
    slug: service.pathname.split("/").pop() ?? "", title: service.name, description: service.introduction,
    badge: service.badge, type: service.serviceType, audience: service.audience,
    html: `${sectionsHtml(service.deliverables.items, "O que pode ser entregue")}<h2>Experiência aplicada</h2>${service.experience.paragraphs.map((text) => `<p>${text}</p>`).join("")}${sectionsHtml(service.process, "Como funciona o processo")}${sectionsHtml(service.seo.items, service.seo.title)}<h2>Perguntas frequentes</h2>${service.faqs.map((faq) => `<h3>${faq.question}</h3><p>${faq.answer}</p>`).join("")}`,
  })),
];

function fromRow(row: ServiceRow): SiteService {
  return { id: row.id, slug: row.slug, path: row.path, title: row.title, shortDescription: row.short_description,
    contentHtml: row.content_html, seoTitle: row.seo_title, seoDescription: row.seo_description, canonicalUrl: row.canonical_url,
    badge: row.badge, serviceType: row.service_type, audience: row.audience, ctaLabel: row.cta_label, ctaUrl: row.cta_url,
    coverImageUrl: row.cover_image_url, existingServiceSlug: row.existing_service_slug, status: row.status, indexable: row.indexable,
    includeInSitemap: row.include_in_sitemap, showInServicesIndex: row.show_in_services_index, displayOrder: row.display_order,
    publishedAt: row.published_at, createdAt: row.created_at, updatedAt: row.updated_at };
}

function clean(value: Partial<SiteServiceInput>): SiteServiceInput {
  const slug = slugify(String(value.slug ?? ""));
  const title = plainText(String(value.title ?? "")).slice(0, 180);
  if (!slug || title.length < 2) throw new Error("Informe um título e um slug válidos.");
  const status: SitePublicationStatus = ["draft", "published", "archived"].includes(String(value.status)) ? value.status as SitePublicationStatus : "draft";
  const published = status === "published";
  return { slug, path: `/servicos/${slug}`, title, shortDescription: plainText(String(value.shortDescription ?? "")).slice(0, 500),
    contentHtml: sanitizePostHtml(String(value.contentHtml ?? "")), seoTitle: plainText(String(value.seoTitle ?? "")).slice(0, 180),
    seoDescription: plainText(String(value.seoDescription ?? "")).slice(0, 320), canonicalUrl: plainText(String(value.canonicalUrl ?? "")).slice(0, 500),
    badge: plainText(String(value.badge ?? "")).slice(0, 100), serviceType: plainText(String(value.serviceType ?? "")).slice(0, 180),
    audience: plainText(String(value.audience ?? "")).slice(0, 240), ctaLabel: plainText(String(value.ctaLabel ?? "Solicitar orçamento")).slice(0, 80),
    ctaUrl: plainText(String(value.ctaUrl ?? "/contato")).slice(0, 500), coverImageUrl: plainText(String(value.coverImageUrl ?? "")).slice(0, 500),
    existingServiceSlug: value.existingServiceSlug ? slugify(value.existingServiceSlug) : null, status,
    indexable: published && Boolean(value.indexable), includeInSitemap: published && Boolean(value.indexable) && Boolean(value.includeInSitemap),
    showInServicesIndex: Boolean(value.showInServicesIndex), displayOrder: Math.max(0, Math.min(9999, Number(value.displayOrder) || 100)) };
}

function payload(input: SiteServiceInput) {
  return { slug: input.slug, path: input.path, title: input.title, short_description: input.shortDescription, content_html: input.contentHtml,
    seo_title: input.seoTitle, seo_description: input.seoDescription, canonical_url: input.canonicalUrl, badge: input.badge,
    service_type: input.serviceType, audience: input.audience, cta_label: input.ctaLabel, cta_url: input.ctaUrl,
    cover_image_url: input.coverImageUrl, existing_service_slug: input.existingServiceSlug, status: input.status,
    indexable: input.indexable, include_in_sitemap: input.includeInSitemap, show_in_services_index: input.showInServicesIndex,
    display_order: input.displayOrder, published_at: input.status === "published" ? new Date().toISOString() : null };
}

export async function listStoredSiteServices() {
  const rows = await supabaseRest<ServiceRow[]>("site_services?select=*&order=display_order.asc,title.asc", { allowMissingConfig: true });
  return rows.map(fromRow);
}

export async function listManagedSiteServices(): Promise<ManagedSiteService[]> {
  const stored = await listStoredSiteServices();
  const replaced = new Set(stored.flatMap((item) => item.existingServiceSlug ? [item.existingServiceSlug] : []));
  const virtual = serviceSources.filter((item) => !replaced.has(item.slug)).map((item, index): ManagedSiteService => ({
    id: `existing:${item.slug}`, slug: item.slug, path: `/servicos/${item.slug}`, title: item.title, shortDescription: item.description,
    contentHtml: item.html, seoTitle: item.title, seoDescription: item.description, canonicalUrl: "", badge: item.badge,
    serviceType: item.type, audience: item.audience, ctaLabel: "Solicitar orçamento", ctaUrl: "/contato", coverImageUrl: "",
    existingServiceSlug: item.slug, status: "published", indexable: true, includeInSitemap: true, showInServicesIndex: true,
    displayOrder: index + 1, publishedAt: null, createdAt: "", updatedAt: "", virtual: true,
  }));
  return [...stored, ...virtual].sort((a, b) => a.displayOrder - b.displayOrder || a.title.localeCompare(b.title, "pt-BR"));
}

export async function getSiteServiceById(id: string) {
  if (id.startsWith("existing:")) return (await listManagedSiteServices()).find((item) => item.id === id) ?? null;
  const rows = await supabaseRest<ServiceRow[]>(`site_services?select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function getPublishedSiteService(slug: string) {
  try { const rows = await supabaseRest<ServiceRow[]>(`site_services?select=*&or=(slug.eq.${encodeURIComponent(slug)},existing_service_slug.eq.${encodeURIComponent(slug)})&status=eq.published&limit=1`, { allowMissingConfig: true }); return rows[0] ? fromRow(rows[0]) : null; }
  catch { return null; }
}

export async function createSiteService(value: Partial<SiteServiceInput>) {
  const input = clean(value); const rows = await supabaseRest<ServiceRow[]>("site_services", { method: "POST", body: JSON.stringify(payload(input)) }); return fromRow(rows[0]);
}
export async function updateSiteService(id: string, value: Partial<SiteServiceInput>) {
  const input = clean(value); if (id.startsWith("existing:")) return createSiteService(input);
  const rows = await supabaseRest<ServiceRow[]>(`site_services?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload(input)) });
  if (!rows[0]) throw new Error("Serviço não encontrado."); return fromRow(rows[0]);
}
export async function deleteSiteService(id: string) {
  if (id.startsWith("existing:")) throw new Error("O serviço original faz parte do código.");
  await supabaseRest(`site_services?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function listPublishedSiteServices() {
  try { const rows = await supabaseRest<ServiceRow[]>("site_services?select=*&status=eq.published&show_in_services_index=eq.true&order=display_order.asc,title.asc", { allowMissingConfig: true }); return rows.map(fromRow); }
  catch { return []; }
}

export async function listSitemapSiteServices() {
  const rows = await supabaseRest<ServiceRow[]>("site_services?select=*&status=eq.published&indexable=eq.true&include_in_sitemap=eq.true", { allowMissingConfig: true });
  return rows.map(fromRow);
}
