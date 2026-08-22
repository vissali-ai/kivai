import { HubEditorialContent } from "@/components/tools/hub-editorial-content";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Ferramentas para Social Media e Redes Sociais",
  description:
    "Planeje conteúdo, crie calendário editorial, visualize posts, calcule engajamento, gere relatórios e organize publicações para redes sociais.",
  pathname: "/ferramentas/social-media",
});

export default function SocialMediaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<HubEditorialContent hub="social-media" /></>;
}
