import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";

import ConversorHeicClient from "./conversor-heic-client";

export async function generateMetadata() { return getToolMetadataAsync("conversor-heic"); }

export default function ConversorHeicPage() {
  return (
    <>
      <ConversorHeicClient />
      <ImageToolEditorialV2 slug="conversor-heic" />
    </>
  );
}
