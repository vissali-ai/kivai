import { SvgPngClient } from "@/components/tools/svg-png-client";
import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

export async function generateMetadata() { return getToolMetadataAsync("conversor-svg-png"); }

export default function ConversorSvgPngPage() {
  return (
    <>
      <SvgPngClient />
      <ImageToolEditorialV2 slug="conversor-svg-png" />
    </>
  );
}
