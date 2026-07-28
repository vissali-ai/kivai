import { SvgPngClient } from "@/components/tools/svg-png-client";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("conversor-svg-png");
export default function ConversorSvgPngPage(){return <SvgPngClient/>}
