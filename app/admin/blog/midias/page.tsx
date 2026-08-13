import { MediaManager } from "@/components/admin/media-manager";
import { listMedia } from "@/lib/blog/repository";

export default async function MediaPage() {
  return <main><header className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Acervo</p><h1 className="mt-1 text-3xl font-semibold">Biblioteca de mídia</h1><p className="mt-2 text-sm text-muted-foreground">Envie imagens, registre direitos e reutilize arquivos sem duplicação.</p></header><MediaManager initialMedia={await listMedia()} /></main>;
}
