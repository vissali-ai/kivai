import { Hero } from "@/components/marketing/hero";
import { FeaturedToolsSection } from "@/components/marketing/featured-tools-section";
import { ToolsSection } from "@/components/marketing/tools-section";
import { ManagedContentLinks } from "@/components/site-cms/managed-content-links";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />

      <FeaturedToolsSection />

      <ManagedContentLinks location="home" title="Conteúdos em destaque" />

      <ToolsSection />
    </main>
  );
}
