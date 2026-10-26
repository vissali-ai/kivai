import { Hero } from "@/components/marketing/hero";
import { FeaturedToolsSection } from "@/components/marketing/featured-tools-section";
import { ToolsSection } from "@/components/marketing/tools-section";
import { HomePlansSection } from "@/components/marketing/home-plans-section";
import { ManagedContentLinks } from "@/components/site-cms/managed-content-links";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#ECEFF3] text-[#202938]">
      <Hero />

      <FeaturedToolsSection />
      <ToolsSection />
      <HomePlansSection />

      <ManagedContentLinks location="home" title="Conteúdos em destaque" />
    </main>
  );
}
