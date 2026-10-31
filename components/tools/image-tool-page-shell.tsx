import type { ReactNode } from "react";
import { ToolPageShell } from "@/components/tools/tool-page-shell";

type ImageToolPageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  showPrivacyNotice?: boolean;
  showCategoryEyebrow?: boolean;
};

export function ImageToolPageShell({ title, description, children, showPrivacyNotice, showCategoryEyebrow }: ImageToolPageShellProps) {
  return <ToolPageShell title={title} description={description} categoryName="Ferramentas de imagem" categoryHref="/ferramentas/imagens" showPrivacyNotice={showPrivacyNotice} showCategoryEyebrow={showCategoryEyebrow}>{children}</ToolPageShell>;
}
