import { Gift, Mail, MessageCircle, Repeat2, Target, TimerReset } from "lucide-react";
import { listAdminCustomers } from "@/lib/admin/customer-users";
import { supabaseRest } from "@/lib/blog/supabase";
import { grantGracePeriod, queueManualCampaign } from "@/app/admin/usuarios/actions";
import { proWelcomeTemplate } from "@/lib/marketing/subscription-templates";

export const dynamic = "force-dynamic";

type Communication = {
  id: string;
  user_id: string;
  event_key: string;
  channel: "email" | "whatsapp" | "internal";
  status: string;
  subject: string | null;
  message: string;
  scheduled_for: string;
  sent_at: string | null;
  metadata: Record<string, unknown>;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR");
}

export default async function MarketingPage({ searchParams }: { searchParams: Promise<{ segment?: string }> }) {
  const params = await searchParams;
  const segment = params.segment ?? "all";
  const [users, communications] = await Promise.all([
    listAdminCustomers(),
    supabaseRest<Communication[]>("customer_communications?select=id,user_id,event_key,channel,status,subject,message,scheduled_for,sent_at,metadata&order=created_at.desc&limit=100"),
  ]);
  const now = Date.now();
  const filtered = users.filter((user) => {
    const end = user.periodEnd ? new Date(user.periodEnd).getTime() : null;
    const days = end ? Math.ceil((end - now) / 86400000) : null;
    if (segment === "free") return user.planCode === "free" && user.subscriptionStatus !== "past_due";
    if (segment === "active") return user.subscriptionStatus === "active" && !user.testAccess;
    if (segment === "expiring") return user.subscriptionStatus === "active" && days !== null && days <= 10 && days >= 0;
    if (segment === "expired") return user.subscriptionStatus === "past_due";
    if (segment === "vip") return user.customerScore >= 80 || user.lifecycleStage === "vip";
    if (segment === "trial") return user.testAccess || user.lifecycleStage === "trial";
    return true;
  });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const counts = {
    free: users.filter((u) => u.planCode === "free" && u.subscriptionStatus !== "past_due").length,
    active: users.filter((u) => u.subscriptionStatus === "active").length,
    expired: users.filter((u) => u.subscriptionStatus === "past_due").length,
    vip: users.filter((u) => u.customerScore >= 80 || u.lifecycleStage === "vip").length,
  };

  return <div className="space-y-6">
    <section className="border border-white/10 bg-card p-6">
      <div className="flex items-start justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Relacionamento e retenção</p><h1 className="mt-2 text-3xl font-semibold">Marketing de usuários</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Segmente usuários gratuitos, assinantes, clientes perto do vencimento e ex-assinantes. Prepare mensagens, ofertas e cortesias com base no histórico do cliente.</p></div><Target className="size-7 text-primary" /></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-4"><div className="border border-white/10 p-4"><p className="text-xs text-muted-foreground">Grátis</p><p className="mt-1 text-2xl font-semibold">{counts.free}</p></div><div className="border border-white/10 p-4"><p className="text-xs text-muted-foreground">Assinantes ativos</p><p className="mt-1 text-2xl font-semibold text-primary">{counts.active}</p></div><div className="border border-white/10 p-4"><p className="text-xs text-muted-foreground">Vencidos</p><p className="mt-1 text-2xl font-semibold">{counts.expired}</p></div><div className="border border-white/10 p-4"><p className="text-xs text-muted-foreground">VIP / score alto</p><p className="mt-1 text-2xl font-semibold">{counts.vip}</p></div></div>
    </section>

    <section className="border border-primary/25 bg-primary/[0.035] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Onboarding automático</p><h2 className="mt-2 text-xl font-semibold">E-mail de boas-vindas ao Plano Pro</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Este é o modelo usado automaticamente quando você confirma pela primeira vez o pagamento de um novo assinante Pro. A renovação usa uma mensagem separada.</p></div><Mail className="size-6 text-primary" /></div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <div className="border border-white/10 bg-background/40 p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">Assunto</p><p className="mt-2 font-semibold">{proWelcomeTemplate.subject}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{proWelcomeTemplate.preview}</p><p className="mt-4 text-xs text-muted-foreground">O e-mail inclui agradecimento, confirmação da ativação, periodicidade, vencimento, instruções de primeiro acesso e botão para abrir a Área Pro.</p></div>
        <div className="border border-white/10 bg-background/40 p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">Recursos informados ao cliente</p><ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">{proWelcomeTemplate.features.map((item) => <li key={item}>• {item}</li>)}</ul></div>
      </div>
    </section>

    <nav className="flex flex-wrap gap-2 border border-white/10 bg-card p-3">
      {[['all','Todos'],['free','Grátis'],['active','Ativos'],['expiring','Vence em até 10 dias'],['expired','Vencidos'],['trial','Teste/cortesia'],['vip','VIP']].map(([value,label]) => <a key={value} href={`/admin/marketing?segment=${value}`} className={`border px-3 py-2 text-xs font-semibold ${segment === value ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground'}`}>{label}</a>)}
    </nav>

    <section className="space-y-4">
      {filtered.map((user) => <article key={user.id} className="border border-white/10 bg-card p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,1.2fr)_220px]">
          <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{user.fullName || user.email}</h2><span className="border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">{user.planCode.toUpperCase()}</span>{user.customerScore >= 80 ? <span className="border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[10px] text-amber-200">BOM CLIENTE</span> : null}</div><p className="mt-1 text-sm text-muted-foreground">{user.email}</p><div className="mt-4 space-y-1 text-xs text-muted-foreground"><p>Status: {user.subscriptionStatus ?? 'sem assinatura'}</p><p>Vencimento: {user.periodEnd ? new Date(user.periodEnd).toLocaleDateString('pt-BR') : '-'}</p><p>Score: {user.customerScore}/100</p><p>Tags: {user.marketingTags.length ? user.marketingTags.join(', ') : '-'}</p></div></div>

          <form action={queueManualCampaign} className="grid gap-2">
            <input type="hidden" name="userId" value={user.id} />
            <div className="grid gap-2 sm:grid-cols-2"><label className="text-xs text-muted-foreground">Canal<select name="channel" className="mt-1 h-9 w-full border border-white/10 bg-background px-2 text-sm text-foreground"><option value="email">E-mail</option><option value="whatsapp">WhatsApp</option><option value="internal">Aviso no painel</option></select></label><label className="text-xs text-muted-foreground">Oferta<select name="offerType" className="mt-1 h-9 w-full border border-white/10 bg-background px-2 text-sm text-foreground"><option value="none">Sem benefício</option><option value="discount">Desconto</option><option value="credit">Crédito adicional</option><option value="grace">Dias grátis</option><option value="service_bonus">Benefício em outro serviço</option></select></label></div>
            <input name="subject" placeholder="Assunto do e-mail" className="h-9 border border-white/10 bg-background px-3 text-sm" />
            <textarea name="message" required rows={4} placeholder="Ex.: Seu Plano Pro está perto do vencimento. Quer renovar? Posso liberar uma condição especial..." className="border border-white/10 bg-background p-3 text-sm" />
            <button className="h-9 bg-primary px-4 text-xs font-semibold text-primary-foreground">Preparar remarketing</button>
          </form>

          <div className="space-y-2">
            <form action={grantGracePeriod} className="border border-white/10 p-3"><input type="hidden" name="userId" value={user.id} /><p className="flex items-center gap-2 text-xs font-semibold"><Gift className="size-4 text-primary" /> Cortesia</p><div className="mt-2 flex gap-2"><input name="days" type="number" min="1" max="30" defaultValue="5" className="h-8 w-16 border border-white/10 bg-background px-2 text-xs" /><button className="h-8 flex-1 border border-primary/30 bg-primary/10 px-2 text-xs font-semibold text-primary">Liberar dias</button></div></form>
            {user.phone ? <a href={`https://wa.me/${user.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="flex h-9 items-center justify-center gap-2 border border-white/10 text-xs font-semibold"><MessageCircle className="size-4" /> Abrir WhatsApp</a> : <div className="border border-white/10 p-3 text-xs text-muted-foreground">Sem WhatsApp cadastrado.</div>}
          </div>
        </div>
      </article>)}
      {!filtered.length ? <div className="border border-white/10 bg-card p-8 text-center text-sm text-muted-foreground">Nenhum usuário neste segmento.</div> : null}
    </section>

    <section className="border border-white/10 bg-card p-5">
      <div className="flex items-center gap-2"><Repeat2 className="size-5 text-primary" /><h2 className="font-semibold">Fila de comunicações</h2></div>
      <p className="mt-2 text-sm text-muted-foreground">Os lembretes automáticos de 10, 5 e 1 dia, ativação de plano e recuperação após 15 dias aparecem aqui. O status “ready” significa preparado para envio.</p>
      <div className="mt-4 divide-y divide-white/10 border-y border-white/10">{communications.slice(0,30).map((item) => { const user = userMap.get(item.user_id); return <div key={item.id} className="grid gap-2 py-4 md:grid-cols-[170px_1fr_130px]"><div className="text-xs text-muted-foreground"><p className="font-semibold text-foreground">{user?.email || item.user_id}</p><p className="mt-1">{item.channel === 'email' ? <span className="inline-flex items-center gap-1"><Mail className="size-3" /> E-mail</span> : item.channel === 'whatsapp' ? <span className="inline-flex items-center gap-1"><MessageCircle className="size-3" /> WhatsApp</span> : 'Painel'}</p></div><div><p className="text-sm font-medium">{item.subject || item.event_key}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.message}</p></div><div className="text-xs text-muted-foreground"><span className="border border-white/10 px-2 py-1">{item.status}</span><p className="mt-2">{formatDate(item.sent_at || item.scheduled_for)}</p></div></div>})}{!communications.length ? <p className="py-6 text-sm text-muted-foreground">Nenhuma comunicação criada ainda.</p> : null}</div>
    </section>

    <section className="grid gap-3 md:grid-cols-3"><div className="border border-white/10 bg-card p-4"><TimerReset className="size-5 text-primary" /><h3 className="mt-2 font-semibold">Automação de vencimento</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">O Kivai prepara lembretes 10, 5 e 1 dia antes do vencimento e uma recuperação 15 dias depois.</p></div><div className="border border-white/10 bg-card p-4"><Gift className="size-5 text-primary" /><h3 className="mt-2 font-semibold">Oferta personalizada</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Escolha desconto, crédito, cortesia ou benefício em outro serviço conforme score e histórico.</p></div><div className="border border-white/10 bg-card p-4"><MessageCircle className="size-5 text-primary" /><h3 className="mt-2 font-semibold">Multicanal</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">E-mail, WhatsApp e avisos internos compartilham a mesma fila de relacionamento.</p></div></section>
  </div>;
}
