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
        description="Encontre notícias recentes de marketing, inteligência artificial e e-commerce em uma seleção rápida de fontes especializadas."
        categoryName="Social Media"
        categoryHref="/ferramentas/social-media"
        processingMode="server"
        privacyMessage="A coleta acontece no servidor. Registramos métricas agregadas por categoria e dia. Para limitar abuso, o IP vira um identificador irreversível e temporário; o endereço não é salvo em texto."
      >
        <RadarDeTendenciasClient />
      </ToolPageShell>
      <RadarToolEditorialV2 />
    </>
  );
}
