import { notFound } from "next/navigation";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { getToolMetadataAsync } from "@/lib/seo";
import { getToolOverride } from "@/lib/site-cms/repository";
import { duplexEditorial, readPrinters } from "@/lib/duplex-print/catalog";
import DuplexClient from "./print-client";

export const generateMetadata = () => getToolMetadataAsync("imprimir-frente-e-verso");
export default async function Page() {
  const content = await getToolOverride("imprimir-frente-e-verso");
  if (content && content.status !== "published") notFound();
  const visible = content?.customData.blockVisibility ?? {};
  return <ToolPageShell title={content?.title ?? "Imprimir Frente e Verso"} description={visible.summary === false ? "" : content?.shortDescription ?? "Prepare seu PDF e descubra como recolocar as folhas para imprimir dos dois lados."} showHeader={visible.hero !== false} categoryName="PDFs" categoryHref="/ferramentas/pdfs" complementaryContent={visible.content !== false ? <article className="prose prose-invert max-w-none space-y-4 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:leading-7" dangerouslySetInnerHTML={{ __html: content?.contentHtml ?? duplexEditorial }} /> : null}><DuplexClient printers={readPrinters(content?.customData.printers)} /></ToolPageShell>;
}
