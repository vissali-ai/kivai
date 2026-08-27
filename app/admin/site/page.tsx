import { SiteCmsManager } from "@/components/admin/site-cms-manager";
import { getExistingHubEditorialHtml } from "@/lib/site-cms/hub-editorial-source";
import { listManagedSiteContents, listSiteHubs } from "@/lib/site-cms/repository";
import { listManagedSiteServices } from "@/lib/site-cms/service-repository";

function activityTimestamp(item: { updatedAt?: string | null; createdAt?: string | null; publishedAt?: string | null }) {
  const value = item.updatedAt || item.createdAt || item.publishedAt || "";
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function newestActivityFirst<T extends { updatedAt?: string | null; createdAt?: string | null; publishedAt?: string | null }>(items: T[]) {
  return [...items].sort((a, b) => activityTimestamp(b) - activityTimestamp(a));
}

export default async function SiteCmsPage() {
  const [contents, hubs, services] = await Promise.all([listManagedSiteContents(), listSiteHubs(), listManagedSiteServices()]);
  const editableHubs = hubs.map((hub) => ({
    ...hub,
    contentHtml: hub.contentHtml || getExistingHubEditorialHtml(hub.slug),
  }));

  return <main><header className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Site inteiro</p><h1 className="mt-1 text-3xl font-semibold">Conteúdos, serviços, ferramentas e hubs</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Edite o conteúdo público completo, organize ferramentas e serviços, e decida separadamente se cada URL pode ser indexada e aparecer no sitemap. As publicações são ordenadas pela atividade mais recente: criação ou última edição.</p></header><SiteCmsManager initialContents={newestActivityFirst(contents)} initialHubs={newestActivityFirst(editableHubs)} initialServices={newestActivityFirst(services)} /></main>;
}
