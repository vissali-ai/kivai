import type { ReactNode } from "react";
import { ToolRatingSection } from "@/components/tools/tool-rating-section";

export default function ToolLayout({ children }: { children: ReactNode }) {
  return <>{children}<div className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8"><ToolRatingSection slug="imprimir-frente-e-verso" /></div></>;
}
