import { AdSlot } from "@/components/ads/AdSlot";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import { excelParaPdfEditorialOverride } from "@/lib/excel-para-pdf-editorial-override";
import { pdfParaExcelEditorialOverride } from "@/lib/pdf-para-excel-editorial-override";
import {
  pdfOfficeToolEditorialContent,
  type PdfOfficeToolEditorialSlug,
} from "@/lib/pdf-office-tool-editorial-content";
import { buildToolPageSchema } from "@/lib/tool-page-schema";
import { getToolBySlug } from "@/lib/tools";

const schemaDescriptionOverrides: Partial<Record<PdfOfficeToolEditorialSlug, string>> = {
  "pdf-para-word":
    "Converta o texto de PDFs digitais em DOCX editável, reconstruindo títulos, parágrafos, listas e quebras de página no navegador.",
  "pdf-para-excel":
    "Identifique tabelas em PDFs digitais com texto selecionável, revise os dados reconhecidos e exporte para XLSX. Não inclui OCR e a detecção é baseada no posicionamento dos textos.",
  "excel-para-pdf":
    "Converta células de arquivos XLSX em páginas PDF configuráveis diretamente no navegador. Gráficos, imagens e objetos avançados não são incorporados nesta versão.",
};

export function PdfOfficeToolEditorialV2({ slug }: { slug: PdfOfficeToolEditorialSlug }) {
  const content = slug === "pdf-para-excel"
    ? pdfParaExcelEditorialOverride
    : slug === "excel-para-pdf"
      ? excelParaPdfEditorialOverride
      : pdfOfficeToolEditorialContent[slug];
  const tool = getToolBySlug(slug);

  if (!tool) return null;

  const schema = buildToolPageSchema({
    name: tool.name,
    slug,
    description: schemaDescriptionOverrides[slug] ?? tool.seoDescription ?? tool.description,
    breadcrumbs: [
      { name: "Início", href: "/" },
      { name: "Ferramentas", href: "/ferramentas" },
      { name: "PDFs", href: "/ferramentas/pdfs" },
      { name: tool.name, href: `/ferramentas/${slug}` },
    ],
    faqs: content.faqs,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />

      <ToolEditorialLayout
        slug={slug}
        overview={content.overview}
        useCases={content.useCases}
        steps={content.steps}
        specificationsTitle="Operação, formatos e resultado"
        specifications={content.specifications}
        privacy={content.privacy}
        limitations={content.limitations}
        faqs={content.faqs}
        relatedTools={content.related.filter((item) => item.href !== `/ferramentas/${slug}`)}
        afterFaq={<AdSlot placement="tool-bottom" variant="banner" />}
      />
    </>
  );
}
