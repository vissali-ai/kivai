import { HubEditorialContent } from "@/components/tools/hub-editorial-content";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Ferramentas para Social Media",
  description: "Ferramentas online para criar, revisar e formatar conteúdos para redes sociais.",
  pathname: "/ferramentas/social-media",
});

export default function SocialMediaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<HubEditorialContent hub="social-media" /></>;
}
