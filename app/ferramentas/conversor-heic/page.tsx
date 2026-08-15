import { getToolMetadata } from "@/lib/seo";
import { ImageToolEditorial } from "@/components/tools/image-tool-editorial";

import ConversorHeicClient from "./conversor-heic-client";

export const metadata = getToolMetadata("conversor-heic");

export default function ConversorHeicPage() {
  return (
    <>
      <ConversorHeicClient />
      <ImageToolEditorial slug="conversor-heic" />
    </>
  );
}
