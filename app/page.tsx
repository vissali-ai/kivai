import { AdSlot } from "@/components/ads/AdSlot";
import { Hero } from "@/components/marketing/hero";
import { FeaturedToolsSection } from "@/components/marketing/featured-tools-section";
import { ToolsSection } from "@/components/marketing/tools-section";
import { Footer } from "@/components/marketing/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />

      <FeaturedToolsSection />

      <ToolsSection />

      <section
        aria-label="Área de publicidade"
        className="border-t border-white/5 bg-background py-6 sm:py-8"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AdSlot variant="banner" />
        </div>
      </section>

      <Footer />
    </main>
  );
}