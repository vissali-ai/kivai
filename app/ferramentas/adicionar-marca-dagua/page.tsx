import { WatermarkClient } from "@/components/tools/watermark-client";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("adicionar-marca-dagua");
export default function AdicionarMarcaDaguaPage(){return <WatermarkClient/>}
