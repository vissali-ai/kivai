import { AdSlot } from "@/components/ads/ad-slot";
import { Hero } from "@/components/marketing/hero";
import { Navbar } from "@/components/marketing/navbar";
import { FeaturedToolsSection } from "@/components/marketing/featured-tools-section";
import { ToolsSection } from "@/components/marketing/tools-section";
import { BenefitsSection } from "@/components/marketing/benefits-section";
import { PricingPreviewSection } from "@/components/marketing/pricing-preview-section";
import { Footer } from "@/components/marketing/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
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

      <BenefitsSection />
      <PricingPreviewSection />
      <Footer />
    </main>
  );
}