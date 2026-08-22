import { SiteServiceEditor } from "@/components/admin/site-service-editor";
import type { ManagedSiteService } from "@/lib/site-cms/types";

const item: ManagedSiteService = { id: "new", slug: "", path: "", title: "", shortDescription: "", contentHtml: "<h2>Sobre o serviço</h2><p>Explique com clareza o problema atendido e a proposta do serviço.</p><h2>O que pode ser entregue</h2><p>Descreva escopo, etapas e limites.</p><h2>Perguntas frequentes</h2><h3>Como funciona a contratação?</h3><p>Explique o processo comercial.</p>", seoTitle: "", seoDescription: "", canonicalUrl: "", badge: "", serviceType: "", audience: "", ctaLabel: "Solicitar orçamento", ctaUrl: "/contato", coverImageUrl: "", existingServiceSlug: null, status: "draft", indexable: false, includeInSitemap: false, showInServicesIndex: true, displayOrder: 100, publishedAt: null, createdAt: "", updatedAt: "" };
export default function NewServicePage() { return <SiteServiceEditor initialService={item} />; }
