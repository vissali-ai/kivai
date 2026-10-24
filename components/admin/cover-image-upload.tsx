"use client";

import Image from "next/image";
import { MediaUploadActions } from "@/components/admin/media-upload-actions";
import type { Media } from "@/lib/blog/types";

export function CoverImageUpload({ media, onUploaded }: { media: Media | null; onUploaded: (media: Media) => void }) {
  return <div className="space-y-3">
    {media ? <div className="relative h-44 w-full overflow-hidden rounded-md bg-muted/60 sm:h-52"><Image src={media.url} alt={media.alt || "Imagem de capa"} fill sizes="(max-width: 640px) 100vw, 960px" className="object-contain" /></div> : <div className="flex h-28 w-full items-center justify-center rounded-md border border-dashed border-border bg-card text-xs text-muted-foreground sm:h-36">A matéria ainda está sem foto</div>}
    <MediaUploadActions onSelect={onUploaded} />
    <p className="text-xs leading-5 text-muted-foreground">JPG, PNG ou WebP, com no máximo 8 MB. Use apenas imagens próprias ou com licença adequada.</p>
  </div>;
}
