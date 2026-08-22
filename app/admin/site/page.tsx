import { SiteCmsManager } from "@/components/admin/site-cms-manager";
import { listManagedSiteContents, listSiteHubs } from "@/lib/site-cms/repository";
import { listManagedSiteServices } from "@/lib/site-cms/service-repository";

export default async function SiteCmsPage() {
  const [contents, hubs, services] = await Promise.all([listManagedSiteContents(), listSiteHubs(), listManagedSiteServices()]);
  return <main><header className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Site inteiro</p><h1 className="mt-1 text-3xl font-semibold">Conteúdos, serviços, ferramentas e hubs</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Edite o conteúdo público completo, organize ferramentas e serviços, e decida separadamente se cada URL pode ser indexada e aparecer no sitemap. A parte funcional de uma nova ferramenta continua exigindo implementação e teste no código.</p></header><SiteCmsManager initialContents={contents} initialHubs={hubs} initialServices={services} /></main>;
}
