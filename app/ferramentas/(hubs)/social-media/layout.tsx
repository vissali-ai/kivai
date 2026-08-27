import { HubEditorialContent } from "@/components/tools/hub-editorial-content";
import { getCmsHubMetadata, getPageMetadata } from "@/lib/seo";

const baseMetadata = getPageMetadata({
  title: "Ferramentas para Social Media e Redes Sociais",
  description:
    "Planeje conteúdo, organize calendário editorial, visualize posts, calcule engajamento, gere relatórios, analise seguidores e acompanhe tendências para redes sociais.",
  pathname: "/ferramentas/social-media",
});
export async function generateMetadata() { return getCmsHubMetadata("social-media", baseMetadata); }

export default function SocialMediaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<HubEditorialContent hub="social-media" /></>;
}
