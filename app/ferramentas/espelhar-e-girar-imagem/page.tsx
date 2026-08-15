import { TransformImageClient } from "@/components/tools/transform-image-client";
import { getToolMetadata } from "@/lib/seo";
import { ImageToolEditorial } from "@/components/tools/image-tool-editorial";
export const metadata = getToolMetadata("espelhar-e-girar-imagem");
export default function EspelharEGirarImagemPage(){return <><TransformImageClient/><ImageToolEditorial slug="espelhar-e-girar-imagem" /></>}
