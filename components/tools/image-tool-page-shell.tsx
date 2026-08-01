import type { ReactNode } from "react";
import { ToolPageShell } from "@/components/tools/tool-page-shell";

type ImageToolPageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function ImageToolPageShell({ title, description, children }: ImageToolPageShellProps) {
  return <ToolPageShell title={title} description={description} categoryName="Ferramentas de imagem" categoryHref="/ferramentas/imagens">{children}</ToolPageShell>;
}
