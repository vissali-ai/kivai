import { CropImageClient } from "@/components/tools/crop-image-client";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("recortar-imagem");
export default function RecortarImagemPage(){return <CropImageClient/>}
