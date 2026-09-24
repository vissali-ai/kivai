import Image from "next/image";
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

          <div className="mx-auto mt-10 flex max-w-3xl justify-center">
            <a
              href="https://www.souofertasonline.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-full max-w-md flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] px-8 py-8 text-center transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-white/[0.05]"
            >
              <div className="flex min-h-40 w-full items-center justify-center rounded-2xl bg-white p-5">
                <Image
                  src="/clients/sou-ofertas-online.svg"
                  alt="Sou Ofertas Online"
                  width={380}
                  height={235}
                  className="h-auto max-h-32 w-auto max-w-full"
                />
              </div>
              <span className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Cliente ativo
              </span>
              <span className="mt-2 text-base font-semibold text-foreground">
                Sou Ofertas Online
              </span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
