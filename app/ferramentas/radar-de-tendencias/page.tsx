import { ToolAiContent } from "@/components/tools/tool-ai-content";
import { RadarToolEditorialV2 } from "@/components/tools/radar-tool-editorial-v2";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { getToolMetadataAsync } from "@/lib/seo";
import { RadarDeTendenciasClient } from "./radar-de-tendencias-client";

export async function generateMetadata() { return getToolMetadataAsync("radar-de-tendencias"); }

export default function RadarDeTendenciasPage() {
  return (
    <>
      <ToolPageShell
        title="Radar de Notícias e Tendências"
        description="Acompanhe notícias recentes de marketing, inteligência artificial e e-commerce em uma seleção de fontes especializadas."
        categoryName="Social Media"
        categoryHref="/ferramentas/social-media"
        showPrivacyNotice={false}
      >
        <ToolAiContent slug="radar-de-tendencias"><RadarDeTendenciasClient /></ToolAiContent>
      </ToolPageShell>
      <RadarToolEditorialV2 />
    </>
  );
}
