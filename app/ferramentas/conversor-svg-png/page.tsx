import { SvgPngClient } from "@/components/tools/svg-png-client";
import { getToolMetadata } from "@/lib/seo";
import { ImageToolEditorial } from "@/components/tools/image-tool-editorial";
export const metadata = getToolMetadata("conversor-svg-png");
export default function ConversorSvgPngPage(){return <main><SvgPngClient/><ImageToolEditorial slug="conversor-svg-png" /></main>}
