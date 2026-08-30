import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { listAdminCustomers } from "@/lib/admin/customer-users";
import { EmailMarketingEditor } from "./email-marketing-editor";

export const dynamic = "force-dynamic";

export default async function EmailMarketingPage() {
  const users = await listAdminCustomers();
  const counts = {
    all: users.filter((user) => Boolean(user.email)).length,
    free: users.filter((user) => Boolean(user.email) && user.planCode === "free").length,
    pro: users.filter((user) => Boolean(user.email) && user.planCode === "pro").length,
    agency: users.filter((user) => Boolean(user.email) && user.planCode === "agency").length,
    active: users.filter((user) => Boolean(user.email) && user.subscriptionStatus === "active").length,
    trial: users.filter((user) => Boolean(user.email) && (user.testAccess || user.lifecycleStage === "trial")).length,
  };

  return <div className="space-y-6">
    <section className="border border-white/10 bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div><Link href="/admin/marketing" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" />Voltar para Marketing</Link><p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">E-mail marketing</p><h1 className="mt-2 text-3xl font-semibold">Editor de campanhas</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Crie campanhas no padrão visual do Kivai, visualize antes do disparo e envie para sua base cadastrada com segmentação e descadastro automático.</p></div>
        <Mail className="size-8 text-primary" />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="border border-white/10 p-4"><p className="text-xs text-muted-foreground">Cadastros com e-mail</p><p className="mt-1 text-2xl font-semibold">{counts.all}</p></div><div className="border border-white/10 p-4"><p className="text-xs text-muted-foreground">Limite por disparo</p><p className="mt-1 text-2xl font-semibold text-primary">100</p></div><div className="border border-white/10 p-4"><p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" />Proteção de marketing</p><p className="mt-1 text-sm font-semibold">Opt-out respeitado automaticamente</p></div></div>
    </section>
    <EmailMarketingEditor counts={counts} />
  </div>;
}
