import Link from "next/link";
import { ArrowLeft, BellRing, FileText, Gift, Newspaper, Plus, Repeat2, Sparkles, UsersRound, Wrench } from "lucide-react";

const automaticOptions = [
  { title: "Novo cadastro", description: "Boas-vindas após criação da conta.", href: "/admin/marketing/onboarding/account_welcome", icon: UsersRound },
  { title: "Plano Pro ativado", description: "Enviado após ativação inicial do Plano Pro.", href: "/admin/marketing/onboarding/pro_welcome", icon: Sparkles },
  { title: "Plano Agency ativado", description: "Enviado após ativação inicial do Plano Agency.", href: "/admin/marketing/onboarding/agency_welcome", icon: Sparkles },
  { title: "Plano Pro teste liberado", description: "Enviado quando você libera os 7 dias de teste.", href: "/admin/marketing/onboarding/pro_test_welcome", icon: Gift },
  { title: "Último dia do Pro teste", description: "Aviso automático no último dia da cortesia.", href: "/admin/marketing/onboarding/pro_test_expiry", icon: BellRing },
  { title: "Nova publicação", description: "E-mail individual para novos posts quando não há lote grande.", href: "/admin/marketing/modelos/new_post", icon: Newspaper },
  { title: "Resumo do blog", description: "Usado quando existem mais de 3 novos posts pendentes.", href: "/admin/marketing/modelos/blog_digest", icon: FileText },
  { title: "Nova ferramenta", description: "Enviado quando uma ferramenta nova entra no catálogo.", href: "/admin/marketing/modelos/new_tool", icon: Wrench },
  { title: "Renovação", description: "Avisos próximos do vencimento do plano.", href: "/admin/marketing/modelos/renewal", icon: Repeat2 },
  { title: "Recuperação", description: "Fluxo de recuperação após vencimento, quando aplicável.", href: "/admin/marketing/modelos/winback", icon: Repeat2 },
];

export default function NewAutomaticEmailPage() {
  return <div className="space-y-6">
    <section className="border border-white/10 bg-card p-5 sm:p-6">
      <Link href="/admin/marketing" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" /> Voltar para Disparos</Link>
      <div className="mt-5 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Fluxo automático</p><h1 className="mt-2 text-3xl font-semibold">Criar e-mail automático</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Escolha o gatilho do envio. Cada gatilho mantém um modelo ativo para evitar disparos duplicados. Ao abrir, você pode editar assunto, conteúdo, botões e ativar ou desativar o envio.</p></div><Plus className="size-7 text-primary" /></div>
    </section>
    <section className="grid gap-4 md:grid-cols-2">
      {automaticOptions.map(({ title, description, href, icon: Icon }) => <Link key={href} href={href} className="border border-white/10 bg-card p-5 transition hover:border-primary/30 hover:bg-primary/[0.03]"><div className="flex items-start gap-3"><Icon className="mt-0.5 size-5 text-primary" /><div><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p><p className="mt-3 text-xs font-semibold text-primary">Configurar e-mail automático</p></div></div></Link>)}
    </section>
  </div>;
}
