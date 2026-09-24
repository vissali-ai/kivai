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
      <BusinessServicePage config={ecommerceConsultingService} />

      <section className="border-t border-white/5 bg-[#07080d] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary/[0.12] via-white/[0.035] to-cyan-400/[0.06] p-7 sm:p-10 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                  Cliente e projeto atual
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Sou Ofertas Online
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
                  O Sou Ofertas Online é um e-commerce em evolução contínua usado como aplicação prática da estrutura oferecida neste serviço. O projeto reúne loja pública responsiva, catálogo, variações, kits, carrinho, checkout, pagamentos, frete, clientes, pedidos, campanhas, newsletter, SEO, analytics e um painel administrativo próprio para a operação.
                </p>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                  A experiência acumulada no projeto é utilizada como referência técnica e operacional para novos e-commerces, sempre adaptando arquitetura, integrações e regras ao negócio de cada cliente.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-6 sm:p-7">
                <h3 className="text-lg font-semibold">Recursos já aplicados no projeto</h3>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    "Catálogo e categorias",
                    "Produtos com variações",
                    "Kits de produtos",
                    "Estoque e alertas",
                    "Carrinho e checkout",
                    "Pix e cartão",
                    "Frete e Melhor Envio",
                    "Clientes e autenticação",
                    "Pedidos e remessas",
                    "Cupons e campanhas",
                    "Vitrines e banners",
                    "Importação por planilha",
                    "Newsletter",
                    "SEO técnico",
                    "Google Analytics",
                    "Painel administrativo",
                  ].map((item) => (
                    <div key={item} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground">
                      {item}
                    </div>
                  ))}
                </div>

                <a
                  href="https://www.souofertasonline.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
                >
                  Conhecer o Sou Ofertas Online
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
