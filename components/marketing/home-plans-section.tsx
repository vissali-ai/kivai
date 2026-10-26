import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { planPriceDisplay, withHomePlanFields } from "@/lib/billing/home-plan-content";
import { plansContent } from "@/lib/billing/plans-content";
import { getPublishedSiteContentByPath } from "@/lib/site-cms/repository";

const cards = [
  { code: "free", name: "Grátis", caption: "Para começar sem compromisso.", action: "Criar conta grátis", href: "/conta/cadastro?next=%2Fconta" },
  { code: "pro", name: "Pro", caption: "Para quem cria e acompanha resultados.", action: "Conhecer o Pro", href: "/planos#plano-pro" },
  { code: "agency", name: "Agency", caption: "Para quem trabalha com clientes.", action: "Conhecer o Agency", href: "/planos#plano-agency" },
] as const;

export async function HomePlansSection() {
  // A mesma página de planos já é gerenciada pelo CMS. Não existe cadastro paralelo.
  const stored = await getPublishedSiteContentByPath("/planos");
  const fields = withHomePlanFields((stored ?? plansContent).customData.originalFields);
  const field = (key: string) => fields.find(item => item.key === key)?.value;

  if (field("home-plans-enabled") === false || field("home-plans-enabled") === "false") return null;

  const title = String(field("home-plans-title") ?? "").trim() || "Um Kivai para cada necessidade";
  const description = String(field("home-plans-description") ?? "").trim();
  return (
    <section id="planos-kivai" aria-labelledby="home-plans-heading" className="border-t border-[#D8DEE6] bg-[#ECEFF3] py-12 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 max-w-3xl">
          <h2 id="home-plans-heading" className="text-2xl font-semibold tracking-tight text-[#202938] sm:text-3xl">{title}</h2>
          {description ? <p className="mt-3 text-sm leading-7 text-[#566375] sm:text-base">{description}</p> : null}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map(card => {
            const highlights = String(field(`home-${card.code}-features`) ?? "").split(/\r?\n/).map(line => line.trim()).filter(Boolean).slice(0, 4);
            const price = planPriceDisplay[card.code];
            return <article key={card.code} className={`flex min-w-0 flex-col rounded-xl border bg-[#F9FAFC] p-5 sm:p-6 ${card.code === "pro" ? "border-[#978AD0]" : "border-[#D8DEE6]"}`}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-[#202938]">{card.name}</h3>
                {card.code === "pro" ? <span className="rounded-full bg-[#EBE9F7] px-2.5 py-1 text-xs font-medium text-[#5847AD]">Para evoluir</span> : null}
              </div>
              <p className="mt-1 text-sm text-[#566375]">{card.caption}</p>
              <p className="mt-5 text-3xl font-semibold tracking-tight text-[#202938]">{price.monthly}{card.code !== "free" ? <span className="ml-1 text-sm font-normal text-[#566375]">/mês</span> : null}</p>
              {card.code !== "free" ? <p className="mt-1 text-xs text-[#657286]">Ou {price.annual}</p> : <p className="mt-1 text-xs text-[#657286]">Sem mensalidade</p>}
              <ul className="my-6 flex-1 space-y-3" aria-label={`Benefícios do plano ${card.name}`}>
                {highlights.map((item,index) => <li key={index} className="flex items-start gap-2.5 text-sm leading-6 text-[#4D5A6C]"><Check className="mt-1.5 size-4 shrink-0 text-[#5847AD]" aria-hidden="true" /><span>{item}</span></li>)}
              </ul>
              <Link href={card.href} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5847AD] ${card.code === "pro" ? "border-[#5847AD] bg-[#5847AD] text-white hover:bg-[#483994]" : "border-[#C8CDDA] bg-white text-[#43368D] hover:border-[#5847AD] hover:bg-[#F1EFFA]"}`}>
                {card.action}<ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </article>;
          })}
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-xs leading-5 text-[#657286]">A assinatura amplia os recursos da conta. As ferramentas gratuitas continuam disponíveis. O uso de IA segue os créditos de cada plano.</p>
          <Link href="/planos" className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-semibold text-[#5847AD] hover:underline">Comparar todos os benefícios <ArrowRight className="size-4" aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  );
}
