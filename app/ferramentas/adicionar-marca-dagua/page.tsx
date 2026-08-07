import { WatermarkClient } from "@/components/tools/watermark-client";
import { getToolMetadata } from "@/lib/seo";
import { ImageToolEditorial } from "@/components/tools/image-tool-editorial";
export const metadata = getToolMetadata("adicionar-marca-dagua");
export default function AdicionarMarcaDaguaPage(){return <main><WatermarkClient/><ImageToolEditorial slug="adicionar-marca-dagua" /></main>}
