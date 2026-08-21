import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { getToolMetadata } from "@/lib/seo";

import ConversorHeicClient from "./conversor-heic-client";

export const metadata = getToolMetadata("conversor-heic");

export default function ConversorHeicPage() {
  return (
    <>
      <ConversorHeicClient />
      <ImageToolEditorialV2 slug="conversor-heic" />
    </>
  );
}
