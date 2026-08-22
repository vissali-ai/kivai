import Link from "next/link";
import { AlertTriangle, Archive, CheckCircle2 } from "lucide-react";
import { ProjectMaintenancePanel } from "@/components/admin/project-maintenance-panel";
import { SiteContentMaintenancePanel, type SiteMaintenanceItem } from "@/components/admin/site-content-maintenance-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAllPosts, listCategories, listMedia } from "@/lib/blog/repository";
import { listNewsSources, listRecentAgentRuns } from "@/lib/news-agent/repository";
import { listManagedSiteContents, listSiteHubs } from "@/lib/site-cms/repository";
import { listManagedSiteServices } from "@/lib/site-cms/service-repository";

export const dynamic = "force-dynamic";

async function currentTimestamp() {
  return Date.now();
}

export default async function MaintenancePage() {
  const [posts, media, categories, sources, runs, siteContents, siteHubs, siteServices] = await Promise.all([
    listAllPosts(),
    listMedia(),
    listCategories(),
    listNewsSources(),
    listRecentAgentRuns(50),
    listManagedSiteContents(),
    listSiteHubs(),
    listManagedSiteServices(),
  ]);
  const now = await currentTimestamp();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const staleDrafts = posts.filter((post) => post.status === "draft" && new Date(post.updatedAt).getTime() < thirtyDaysAgo);
  const archived = posts.filter((post) => post.status === "archived");
  const missingCovers = posts.filter((post) => post.status === "published" && !post.coverMediaId && !post.ogImage);
  const orphanMedia = media.filter((item) => !posts.some((post) =>
    post.coverMediaId === item.id || post.ogImage === item.url || post.content.includes(item.url),
  ));
  const unusedCategories = categories.filter((category) => !posts.some((post) => post.categoryId === category.id));
  const failedRuns = runs.filter((run) => run.status === "failed" && new Date(run.startedAt).getTime() >= thirtyDaysAgo);
  const disabledSources = sources.filter((source) => !source.enabled);
  const hubIds = new Set(siteHubs.map((hub) => hub.id));
  const siteContentReviews: SiteMaintenanceItem[] = siteContents.flatMap((item) => {
    const findings: SiteMaintenanceItem["findings"] = [];
    if (item.contentType === "tool" && item.technicalStatus === "pending") findings.push({ category: "technical", label: "Implementação técnica pendente no Codex/ChatGPT" });
    if (item.contentType === "tool" && (!item.hubId || !hubIds.has(item.hubId))) findings.push({ category: "hub", label: "Hub não definido ou removido" });
    if (!item.seoTitle.trim()) findings.push({ category: "seo", label: "Título SEO não preenchido" });
    if (item.seoDescription.trim().length < 70) findings.push({ category: "seo", label: "Descrição SEO ausente ou curta" });
    if (!item.existingToolSlug && item.contentHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().length < 500) findings.push({ category: "editorial", label: "Conteúdo editorial precisa ser desenvolvido" });
    return findings.length ? [{ id: `content:${item.id}`, title: item.title, path: item.path, kind: "content" as const, editHref: `/admin/site/conteudos/${encodeURIComponent(item.id)}`, updatedAt: item.updatedAt, findings }] : [];
  });
  const hubReviews: SiteMaintenanceItem[] = siteHubs.flatMap((hub) => {
    const findings: SiteMaintenanceItem["findings"] = [];
    if (!hub.description.trim()) findings.push({ category: "hub", label: "Descrição do hub não preenchida" });
    if (!hub.seoTitle.trim()) findings.push({ category: "seo", label: "Título SEO do hub não preenchido" });
    if (hub.seoDescription.trim().length < 70) findings.push({ category: "seo", label: "Descrição SEO do hub ausente ou curta" });
    return findings.length ? [{ id: `hub:${hub.id}`, title: hub.name, path: hub.path, kind: "hub" as const, editHref: "/admin/site", updatedAt: hub.updatedAt, findings }] : [];
  });
  const serviceReviews: SiteMaintenanceItem[] = siteServices.flatMap((service) => {
    const findings: SiteMaintenanceItem["findings"] = [];
    if (!service.serviceType.trim()) findings.push({ category: "editorial", label: "Tipo do serviço não preenchido" });
    if (!service.audience.trim()) findings.push({ category: "editorial", label: "Público indicado não preenchido" });
    if (service.contentHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().length < 500) findings.push({ category: "editorial", label: "Conteúdo do serviço precisa ser desenvolvido" });
    if (!service.seoTitle.trim()) findings.push({ category: "seo", label: "Título SEO do serviço não preenchido" });
    if (service.seoDescription.trim().length < 70) findings.push({ category: "seo", label: "Descrição SEO do serviço ausente ou curta" });
    return findings.length ? [{ id: `service:${service.id}`, title: service.title, path: service.path, kind: "service" as const, editHref: `/admin/site/servicos/${encodeURIComponent(service.id)}`, updatedAt: service.updatedAt, findings }] : [];
  });
  const siteMaintenanceItems = [...siteContentReviews, ...hubReviews, ...serviceReviews];
  const reviewCount = staleDrafts.length + missingCovers.length + orphanMedia.length + failedRuns.length + siteContentReviews.length + hubReviews.length + serviceReviews.length;
  const checks = [
    { label: "Rascunhos sem edição há 30 dias", value: staleDrafts.length, href: "/admin/blog?status=draft", detail: "Revise ou arquive o que não será aproveitado." },
    { label: "Publicações sem imagem de capa", value: missingCovers.length, href: "/admin/blog?status=published", detail: "A capa melhora apresentação e compartilhamento." },
    { label: "Mídias possivelmente sem uso", value: orphanMedia.length, href: "/admin/blog/midias?unused=1", detail: "Abre somente os arquivos sem referência detectada. Confirme a imagem antes de excluir." },
    { label: "Falhas do agente em 30 dias", value: failedRuns.length, href: "/admin/blog/agente", detail: "Confira a origem e a mensagem da execução." },
    { label: "Categorias sem matérias", value: unusedCategories.length, href: "/admin/blog/categorias", detail: "Podem ser mantidas se fizerem parte do plano editorial." },
    { label: "Fontes monitoradas pausadas", value: disabledSources.length, href: "/admin/blog/agente", detail: "Fonte pausada não participa das próximas coletas." },
    { label: "Conteúdo do site para revisar", value: siteMaintenanceItems.length, href: "#conteudo-site", detail: "Veja abaixo cada ferramenta, página, material, serviço ou hub e o motivo exato da atenção." },
  ];

  return <main>
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Saúde do projeto</p><h1 className="mt-1 text-3xl font-semibold">Manutenção</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Diagnóstico somente leitura do conteúdo, mídia e automações. Nada é excluído automaticamente.</p></div><Badge variant="outline" className={reviewCount ? "border-amber-400/40 text-amber-300" : "border-emerald-400/40 text-emerald-300"}>{reviewCount ? `${reviewCount} ponto(s) para revisar` : "Tudo em ordem"}</Badge></header>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{checks.map(({ label, value, href, detail }) => <Card key={label}><CardHeader className="flex-row items-center justify-between gap-3"><CardTitle>{label}</CardTitle>{value ? <AlertTriangle className="size-4 shrink-0 text-amber-400" /> : <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />}</CardHeader><CardContent><p className="text-3xl font-semibold">{value}</p><p className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">{detail}</p><Button asChild variant="outline" size="sm" className="mt-3"><Link href={href}>Ver detalhes</Link></Button></CardContent></Card>)}</div>
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Archive className="size-4 text-primary" />Arquivo editorial</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{archived.length}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Matérias arquivadas continuam preservadas no banco e fora do blog público. Isso é intencional e não é tratado como sujeira.</p><Button asChild variant="outline" size="sm" className="mt-4"><Link href="/admin/blog?status=archived">Abrir arquivo</Link></Button></CardContent></Card>
      <ProjectMaintenancePanel />
    </div>
    <SiteContentMaintenancePanel items={siteMaintenanceItems} />
    <Card className="mt-6"><CardHeader><CardTitle>Cadência recomendada</CardTitle></CardHeader><CardContent className="grid gap-4 text-sm md:grid-cols-3"><div><p className="font-medium">Semanal</p><p className="mt-1 text-muted-foreground">Falhas do agente e pautas acumuladas.</p></div><div><p className="font-medium">Mensal</p><p className="mt-1 text-muted-foreground">Rascunhos antigos, mídia sem uso e arquivo editorial.</p></div><div><p className="font-medium">Trimestral</p><p className="mt-1 text-muted-foreground">Auditoria do repositório e dependências.</p></div></CardContent></Card>
  </main>;
}
