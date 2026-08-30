import Image from "next/image";
import Link from "next/link";
import { BellRing, Gift, Mail, Pencil, Target } from "lucide-react";
import { listAdminCustomers } from "@/lib/admin/customer-users";
import { supabaseRest } from "@/lib/blog/supabase";
import { grantGracePeriod, queueManualCampaign } from "@/app/admin/usuarios/actions";
import { saveMarketingReminder, sendMarketingTemplateNow } from "@/app/admin/marketing/actions";
import { listCustomerMarketingTemplates } from "@/lib/marketing/templates";
import { listOnboardingTemplates } from "@/lib/marketing/onboarding-templates";

export const dynamic = "force-dynamic";

export default async function MarketingPage({ searchParams }: { searchParams: Promise<{ segment?: string }> }) {
  const params = await searchParams;
  const segment = params.segment ?? "all";
  const [users, templates, onboardingTemplates, reminders] = await Promise.all([
    listAdminCustomers(),
    listCustomerMarketingTemplates(),
    listOnboardingTemplates(),
    supabaseRest<Array<{ note: string }>>("admin_marketing_reminders?select=note&id=eq.1&limit=1"),
  ]);

  const now = Date.now();
  const filtered = users.filter((user) => {
    const end = user.periodEnd ? new Date(user.periodEnd).getTime() : null;
    const days = end ? Math.ceil((end - now) / 86400000) : null;
    if (segment === "free") return user.planCode === "free" && user.subscriptionStatus !== "past_due";
    if (segment === "active") return user.subscriptionStatus === "active" && !user.testAccess;
    if (segment === "expiring") return user.subscriptionStatus === "active" && days !== null && days <= 7 && days >= 0;
    if (segment === "expired") return user.subscriptionStatus === "past_due";
    if (segment === "trial") return user.testAccess || user.lifecycleStage === "trial";
    return true;
  });
  const counts = {
    free: users.filter((u) => u.planCode === "free" && u.subscriptionStatus !== "past_due").length,
    active: users.filter((u) => u.subscriptionStatus === "active").length,
    expiring: users.filter((u) => { const end = u.periodEnd ? new Date(u.periodEnd).getTime() : null; const days = end ? Math.ceil((end - now) / 86400000) : null; return u.subscriptionStatus === "active" && days !== null && days <= 7 && days >= 0; }).length,
    expired: users.filter((u) => u.subscriptionStatus === "past_due").length,
  };

  return <div className="space-y-6">
    <section className="border border-white/10 bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Relacionamento e retenção</p><h1 className="mt-2 text-3xl font-semibold">Marketing de usuários</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Gerencie onboardings automáticos, modelos de relacionamento, campanhas e histórico recente de comunicações.</p></div><Target className="size-7 text-primary" /></div>
      <form action={saveMarketingReminder} className="mt-5 grid gap-2 border border-primary/20 bg-primary/[0.04] p-4 md:grid-cols-[auto_1fr_auto]"><BellRing className="mt-2 size-5 text-primary" /><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Meu lembrete interno</p><textarea name="note" defaultValue={reminders[0]?.note ?? ""} rows={2} placeholder="Escreva aqui algo que você precisa lembrar..." className="mt-2 w-full border border-white/10 bg-background p-3 text-sm" /></div><button className="h-9 self-end border border-primary/30 bg-primary/10 px-4 text-xs font-semibold text-primary">Salvar lembrete</button></form>
      <div className="mt-5 grid gap-3 sm:grid-cols-4"><div className="border border-white/10 p-4"><p className="text-xs text-muted-foreground">Grátis</p><p className="mt-1 text-2xl font-semibold">{counts.free}</p></div><div className="border border-white/10 p-4"><p className="text-xs text-muted-foreground">Assinantes ativos</p><p className="mt-1 text-2xl font-semibold text-primary">{counts.active}</p></div><div className="border border-white/10 p-4"><p className="text-xs text-muted-foreground">Próximos da renovação</p><p className="mt-1 text-2xl font-semibold">{counts.expiring}</p></div><div className="border border-white/10 p-4"><p className="text-xs text-muted-foreground">Vencidos</p><p className="mt-1 text-2xl font-semibold">{counts.expired}</p></div></div>
    </section>

    <section className="border border-primary/25 bg-primary/[0.035] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Onboarding automático</p><h2 className="mt-1 text-xl font-semibold">E-mails automáticos da conta</h2></div><Mail className="size-6 text-primary" /></div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">{onboardingTemplates.map((item) => <article key={item.template_key} className="border border-white/10 bg-background/35 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Automático</p><h3 className="mt-1 font-semibold">{item.title}</h3></div><Link href={`/admin/marketing/onboarding/${item.template_key}`} className="inline-flex h-8 items-center gap-1 border border-white/10 px-2 text-xs font-semibold text-muted-foreground hover:text-primary"><Pencil className="size-3.5" /> Editar</Link></div><p className="mt-3 text-xs font-semibold">Assunto: {item.subject}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p><p className="mt-3 text-xs text-muted-foreground">Status: {item.enabled ? "ativo" : "desativado"}</p></article>)}</div>
    </section>

    <section className="border border-white/10 bg-card p-5 sm:p-6">
      <div className="flex items-center gap-3"><Image src="/logo.png" alt="Kivai" width={28} height={28} /><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Remarketing e nutrição</p><h2 className="mt-1 text-xl font-semibold">Modelos por situação do cliente</h2></div></div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">O botão de WhatsApp não fica mais no Admin. Ele é incluído dentro do e-mail recebido pelo cliente, ao lado do CTA principal do modelo.</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">{templates.map((item) => <article key={item.flow_key} className="border border-white/10 bg-background/35 p-4"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><Image src="/logo.png" alt="Kivai" width={20} height={20} /><h3 className="font-semibold">{item.title}</h3></div><Link href={`/admin/marketing/modelos/${item.flow_key}`} className="inline-flex h-8 items-center gap-1 border border-white/10 px-2 text-xs font-semibold text-muted-foreground hover:text-primary"><Pencil className="size-3.5" /> Editar</Link></div><p className="mt-3 text-xs font-semibold">Assunto: {item.subject}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>{item.flow_key === "new_post" ? <p className="mt-4 border border-primary/20 bg-primary/[0.05] p-3 text-xs leading-5 text-muted-foreground">Fluxo automático para todos os usuários cadastrados. O envio ocorre quando a publicação entra no ar, seja imediatamente ou por agendamento.</p> : <form action={sendMarketingTemplateNow} className="mt-4 grid gap-2"><input type="hidden" name="flowKey" value={item.flow_key} /><select name="userId" required defaultValue="" className="h-10 w-full border border-white/10 bg-background px-3 text-sm"><option value="" disabled>Selecionar usuário</option>{users.map((user) => <option key={user.id} value={user.id}>{user.fullName || user.email} · {user.email}</option>)}</select><button disabled={!item.enabled} className="h-9 bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50">{item.enabled ? "Enviar e-mail agora" : "Modelo desativado"}</button></form>}</article>)}</div>
    </section>

    <nav className="flex flex-wrap gap-2 border border-white/10 bg-card p-3">{[['all','Todos'],['free','Grátis'],['active','Ativos'],['expiring','Vence em até 7 dias'],['expired','Vencidos'],['trial','Teste/cortesia']].map(([value,label]) => <a key={value} href={`/admin/marketing?segment=${value}`} className={`border px-3 py-2 text-xs font-semibold ${segment === value ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground'}`}>{label}</a>)}</nav>

    <section className="space-y-3">{filtered.map((user) => <details key={user.id} className="border border-white/10 bg-card"><summary className="cursor-pointer list-none p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><span className="font-semibold">{user.fullName || user.email}</span><span className="ml-2 border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">{user.planCode.toUpperCase()}</span><p className="mt-1 text-xs text-muted-foreground">{user.email} {user.phone ? `· WhatsApp ${user.phone}` : "· sem WhatsApp"}</p></div><span className="text-xs text-muted-foreground">Clique para ações</span></div></summary><div className="grid gap-4 border-t border-white/10 p-4 lg:grid-cols-[1fr_220px]"><form action={queueManualCampaign} className="grid gap-2"><input type="hidden" name="userId" value={user.id} /><div className="grid gap-2 sm:grid-cols-2"><label className="text-xs text-muted-foreground">Canal<select name="channel" className="mt-1 h-9 w-full border border-white/10 bg-background px-2 text-sm"><option value="email">E-mail</option><option value="whatsapp">WhatsApp (somente preparar)</option><option value="internal">Aviso no painel</option></select></label><label className="text-xs text-muted-foreground">Oferta<select name="offerType" className="mt-1 h-9 w-full border border-white/10 bg-background px-2 text-sm"><option value="none">Sem benefício</option><option value="discount">Desconto</option><option value="credit">Crédito adicional</option><option value="grace">Dias grátis</option><option value="service_bonus">Benefício em outro serviço</option></select></label></div><input name="subject" placeholder="Assunto do e-mail" className="h-9 border border-white/10 bg-background px-3 text-sm" /><textarea name="message" required rows={4} placeholder="Escreva a mensagem..." className="border border-white/10 bg-background p-3 text-sm" /><button className="h-9 bg-primary px-4 text-xs font-semibold text-primary-foreground">Enviar / preparar comunicação</button></form><form action={grantGracePeriod} className="h-fit border border-white/10 p-3"><input type="hidden" name="userId" value={user.id} /><p className="flex items-center gap-2 text-xs font-semibold"><Gift className="size-4 text-primary" /> Cortesia</p><div className="mt-2 flex gap-2"><input name="days" type="number" min="1" max="30" defaultValue="5" className="h-8 w-16 border border-white/10 bg-background px-2 text-xs" /><button className="h-8 flex-1 border border-primary/30 bg-primary/10 px-2 text-xs font-semibold text-primary">Liberar dias</button></div></form></div></details>)}</section>

    <section className="border border-primary/25 bg-primary/[0.035] p-4"><h3 className="font-semibold">Automação de vencimento ativa</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Planos Pro e Agency recebem e-mails automáticos 7, 3 e 1 dia antes do vencimento. Sete dias após vencer, o sistema libera uma única cortesia de 7 dias no mesmo plano e envia o aviso pelo Resend. Se houver pagamento em andamento, o fluxo pausa os disparos e não concede a cortesia. Os textos são controlados pelos modelos “Avisos automáticos de vencimento” e “Cortesia automática após vencimento” acima.</p></section>
  </div>;
}