import { HubEditorialContent } from "@/components/tools/hub-editorial-content";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Ferramentas para PDF",
  description: "Ferramentas online para converter, organizar e editar documentos PDF.",
  pathname: "/ferramentas/pdfs",
});

export default function PdfsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<HubEditorialContent hub="pdfs" /></>;
}
