import { MediaManager } from "@/components/admin/media-manager";
import { listMedia, listMediaUsage } from "@/lib/blog/repository";

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ unused?: string }> }) {
  const showUnused = (await searchParams).unused === "1";
  const media = await listMedia();
  const usage = await listMediaUsage(media);
  const unusedIds = new Set(usage.filter((item) => item.count === 0).map((item) => item.mediaId));
  const visibleMedia = showUnused ? media.filter((item) => unusedIds.has(item.id)) : media;
  return <main className="media-library min-w-0"><header className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Acervo</p><h1 className="mt-1 text-3xl font-semibold">{showUnused ? "Mídias possivelmente sem uso" : "Biblioteca de mídia"}</h1><p className="mt-2 text-sm text-muted-foreground">{showUnused ? "Esta visualização mostra somente arquivos sem referência em capas ou no conteúdo das matérias. Confirme a imagem antes de excluir." : "Envie imagens, registre direitos e veja onde cada arquivo está sendo utilizado."}</p></header><MediaManager initialMedia={visibleMedia} usage={usage} unusedOnly={showUnused} /></main>;
}
