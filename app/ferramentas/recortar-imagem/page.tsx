import { CropImageClient } from "@/components/tools/crop-image-client";
import { getToolMetadata } from "@/lib/seo";
import { ImageToolEditorial } from "@/components/tools/image-tool-editorial";
export const metadata = getToolMetadata("recortar-imagem");
export default function RecortarImagemPage(){return <><CropImageClient/><ImageToolEditorial slug="recortar-imagem" /></>}
