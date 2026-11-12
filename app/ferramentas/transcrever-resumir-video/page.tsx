import type { Metadata } from "next";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { AdSlot } from "@/components/ads/AdSlot";
import YoutubeVideoPreviewClient from "./preview-client";

export const metadata: Metadata = {
  title: "Teste | Transcrever e Resumir Vídeo com IA | Kivai",
  description: "Prévia privada para testar resumo e transcrição de vídeos do YouTube com Gemini.",
  robots: { index: false, follow: false },
};

export default function VideoYoutubePreviewPage() {
  return (
    <>
      <ToolPageShell
        title="Transcrever e Resumir Vídeo com IA"
        description="Versão experimental. Teste o processamento de links públicos do YouTube antes da publicação no Kivai."
        categoryName="Vídeos"
        categoryHref="/ferramentas/videos"
        showPrivacyNotice={false}
      >
        <YoutubeVideoPreviewClient />
      </ToolPageShell>
      <div className="mx-auto max-w-5xl px-4 pb-8"><AdSlot placement="page-footer" /></div>
    </>
  );
}
