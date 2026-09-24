import { BusinessServicePage } from "@/components/marketing/business-service-page";
import { ecommerceConsultingService } from "@/lib/business-services";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Criação de E-commerce e Loja Virtual com Painel Administrativo",
  description:
    "Criação de e-commerce sob medida com catálogo, variações, kits, estoque, checkout, pagamentos, frete, clientes, pedidos, campanhas, SEO, Analytics e painel administrativo.",
  pathname: ecommerceConsultingService.pathname,
});

export default function ConsultoriaParaEcommercePage() {
  return (
    <>
      <BusinessServicePage
        config={ecommerceConsultingService}
        hideExperience
        hideProcess
      />

      <section className="border-t border-white/5 bg-[#07080d] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Clientes que aprovaram
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Projetos que confiam no nosso trabalho
            </h2>
          </div>

          <div className="relative mx-auto mt-10 max-w-5xl overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#07080d] to-transparent sm:w-24" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#07080d] to-transparent sm:w-24" />

            <div className="kivai-client-marquee flex w-max items-center gap-6 py-2">
              {[0, 1].map((group) => (
                <div key={group} className="flex items-center gap-6" aria-hidden={group === 1}>
                  <div className="flex h-44 w-72 shrink-0 items-center justify-center rounded-3xl border border-white/10 bg-white p-7 sm:w-80">
                    <img
                      src="/clients/sou-ofertas-online.svg"
                      alt={group === 0 ? "Sou Ofertas Online" : ""}
                      className="max-h-28 max-w-full object-contain"
                    />
                  </div>

                  <div className="flex h-44 w-72 shrink-0 items-center justify-center rounded-3xl border border-white/10 bg-white p-7 sm:w-80">
                    <img
                      src="https://http2.mlstatic.com/D_NQ_NP_861528-MLA81184928992_122024-O.webp"
                      alt={group === 0 ? "Panela de Ferro Mineira" : ""}
                      className="max-h-28 max-w-full object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes kivai-client-marquee {
            from { transform: translateX(0); }
            to { transform: translateX(calc(-50% - 0.75rem)); }
          }
          .kivai-client-marquee {
            animation: kivai-client-marquee 18s linear infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .kivai-client-marquee {
              animation: none;
            }
          }
        `}</style>
      </section>
    </>
  );
}
