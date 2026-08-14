"use client";

import Image from "next/image";
import { MediaUploadActions } from "@/components/admin/media-upload-actions";
import type { Media } from "@/lib/blog/types";

export function CoverImageUpload({ media, onUploaded }: { media: Media | null; onUploaded: (media: Media) => void }) {
  return <div className="space-y-3">
    {media ? <div className="relative aspect-video overflow-hidden bg-white/5"><Image src={media.url} alt={media.alt || "Imagem de capa"} fill sizes="340px" className="object-cover" /></div> : <div className="flex aspect-video items-center justify-center border border-dashed border-white/15 bg-white/[0.025] text-xs text-muted-foreground">A matéria ainda está sem foto</div>}
    <MediaUploadActions onSelect={onUploaded} />
    <p className="text-xs leading-5 text-muted-foreground">JPG, PNG ou WebP, com no máximo 8 MB. Use apenas imagens próprias ou com licença adequada.</p>
  </div>;
}
