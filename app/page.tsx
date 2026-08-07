import { Hero } from "@/components/marketing/hero";
import { FeaturedToolsSection } from "@/components/marketing/featured-tools-section";
import { ToolsSection } from "@/components/marketing/tools-section";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />

      <FeaturedToolsSection />

      <ToolsSection />
    </main>
  );
}
