import Image from "next/image";
import { Gift, Mail, MessageCircle, Repeat2, Target, TimerReset, UserPlus } from "lucide-react";
import { listAdminCustomers } from "@/lib/admin/customer-users";
import { supabaseRest } from "@/lib/blog/supabase";
import { enrollCustomerInFlow, grantGracePeriod, queueManualCampaign, queueSuggestedEmail } from "@/app/admin/usuarios/actions";
import { proWelcomeTemplate } from "@/lib/marketing/subscription-templates";
import { customerMarketingFlows } from "@/lib/marketing/customer-flows";

export const dynamic = "force-dynamic";

type Communication = { id: string; user_id: string; event_key: string; channel: "email" | "whatsapp" | "internal"; status: string; subject: string | null; message: string; scheduled_for: string; sent_at: string | null; metadata: Record<string, unknown> };
type FlowEnrollment = { id: string; user_id: string; flow_key: string; status: string; enrolled_at: string };

const whatsappHref = `https://wa.me/5531996205058?text=${encodeURIComponent("Olá! Recebi um e-mail e gostaria de mais informações.")}`;
const suggestions = [
  {
    flowKey: "free_nurture",
    title: "Nutrição de usuário Grátis",
    subject: "Descubra o que mais você pode fazer com o Kivai",
    text: "Apresente os benefícios dos planos pagos e mostre como o Instagram Follow Analyzer pode acompanhar a evolução do perfil com mais recursos e histórico.",
    message: "Olá! Você já pode usar várias ferramentas gratuitas do Kivai. Quando precisar acompanhar mais contas, manter histórico e comparar mudanças no Instagram ao longo do tempo, os planos pagos ampliam esses recursos. Acesse o Kivai para conhecer as opções ou fale conosco pelo WhatsApp para tirar dúvidas.",
  },
  {
    flowKey: "pro_upgrade",
    title: "Upgrade para Pro",
    subject: "Leve suas análises do Instagram para o próximo nível",
    text: "Indicado para usuários que precisam acompanhar mais contas, histórico, comparações e mudanças de seguidores ao longo do tempo.",
    message: "Olá! O Plano Pro do Kivai foi pensado para quem quer ir além de uma análise pontual. Com ele, você amplia seus limites e pode acompanhar histórico, comparações e mudanças de seguidores com mais organização. Se quiser entender se o Pro faz sentido para sua rotina, acesse os planos do Kivai ou fale conosco pelo WhatsApp.",
  },
  {
    flowKey: "agency_upgrade",
    title: "Upgrade para Agency",
    subject: "Organize múltiplas contas e clientes em um só lugar",
    text: "Para social medias, agências e operações com maior volume, destaque a gestão de até 20 contas, comparações e organização por cliente.",
    message: "Olá! Se você administra várias contas ou clientes, o Plano Agency do Kivai ajuda a centralizar a operação e organizar análises de múltiplos perfis. É uma opção voltada a social medias, agências e operações com maior volume. Acesse os planos do Kivai ou fale conosco pelo WhatsApp para saber mais.",
  },
  {
    flowKey: "renewal",
    title: "Renovação próxima",
    subject: "Seu acesso Kivai está perto da renovação",
    text: "Reforce os recursos já utilizados, a continuidade do histórico e ofereça contato direto para esclarecer renovação, plano ou condição comercial.",
    message: "Olá! Seu acesso pago ao Kivai está próximo da renovação. Renovando, você mantém a continuidade dos recursos do seu plano e do histórico disponível na conta. Se precisar revisar o plano ou tirar alguma dúvida antes de renovar, fale conosco pelo WhatsApp.",
  },
  {
    flowKey: "winback",
    title: "Recuperação de cliente vencido",
    subject: "Quer voltar a usar seus recursos Kivai?",
    text: "Convide o cliente a retomar o plano, explique o que ele recupera ao reativar e abra espaço para uma condição ou solução adequada ao momento atual.",
    message: "Olá! Seu plano Kivai não está ativo neste momento. Se quiser voltar a usar os recursos pagos, você pode reativar seu acesso e retomar sua operação. Caso queira avaliar qual plano faz mais sentido agora, fale conosco pelo WhatsApp.",
  },
  {
    flowKey: "cross_sell",
    title: "Venda cruzada de serviços",
    subject: "Além das ferramentas: conheça outras soluções Kivai",
    text: "Apresente gestão de tráfego, landing pages, divulgação e outros serviços para clientes que precisam ampliar comunicação, aquisição ou presença digital.",
    message: "Olá! Além das ferramentas digitais, o Kivai também oferece soluções para negócios que precisam crescer no digital, incluindo gestão de tráfego, landing pages, divulgação e outros serviços. Se quiser entender qual solução pode ajudar seu projeto, fale conosco pelo WhatsApp.",
  },
] as const;

function formatDate(value: string | null) { if (!value) return "-"; return new Date(value).toLocaleString("pt-BR"); }

export default async function MarketingPage({ searchParams }: { searchParams: Promise<{ segment?: string }> }) {
  const params = await searchParams;
  const segment = params.segment ?? "all";
  const [users, communications, enrollments] = await Promise.all([
    listAdminCustomers(),
    supabaseRest<Communication[]>("customer_communications?select=id,user_id,event_key,channel,status,subject,message,scheduled_for,sent_at,metadata&order=created_at.desc&limit=100"),
    supabaseRest<FlowEnrollment[]>("customer_marketing_flow_enrollments?select=id,user_id,flow_key,status,enrolled_at&status=eq.active&order=enrolled_at.desc&limit=100"),
  ]);
  const now = Date.now();
  const filtered = users.filter((user) => {
    const end = user.periodEnd ? new Date(user.periodEnd).getTime() : null;
    const days = end ? Math.ceil((end - now) / 86400000) : null;
    if (segment === "free") return user.planCode === "free" && user.subscriptionStatus !== "past_due";
    if (segment === "active") return user.subscriptionStatus === "active" && !user.testAccess;
    if (segment === "expiring") return user.subscriptionStatus === "active" && days !== null && days <= 10 && days >= 0;
    if (segment === "expired") return user.subscriptionStatus === "past_due";
    if (segment === "trial") return user.testAccess || user.lifecycleStage === "trial";
    return true;
  });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const flowMap = new Map(customerMarketingFlows.map((flow) => [flow.key, flow.label]));
  const counts = {
    free: users.filter((u) => u.planCode === "free" && u.subscriptionStatus !== "past_due").length,
    active: users.filter((u) => u.subscriptionStatus === "active").length,
    expiring: users.filter((u) => { const end = u.periodEnd ? new Date(u.periodEnd).getTime() : null; const days = end ? Math.ceil((end - now) / 86400000) : null; return u.subscriptionStatus === "active" && days !== null && days <= 10 && days >= 0; }).length,
    expired: users.filter((u) => u.subscriptionStatus === "past_due").length,
  };

  return <div className="space-y-6">
    <section className="border border-white/10 bg-card p-6"><div className="flex items-start justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Relacionamento e retenção</p><h1 className="mt-2 text-3xl font-semibold">Marketing de usuários</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Segmente usuários, prepare mensagens de nutrição, renovação e recuperação e conecte cada oportunidade às soluções do Kivai.</p></div><Target className="size-7 text-primary" /></div><div className="mt-6 grid gap-3 sm:grid-cols-4"><div className="border border-white/10 p-4"><p className="text-xs text-muted-foreground">Grátis</p><p className="mt-1 text-2xl font-semibold">{counts.free}</p></div><div className="border border-white/10 p-4"><p className="text-xs text-muted-foreground">Assinantes ativos</p><p className="mt-1 text-2xl font-semibold text-primary">{counts.active}</p></div><div className="border border-white/10 p-4"><p className="text-xs text-muted-foreground">Próximos da renovação</p><p className="mt-1 text-2xl font-semibold">{counts.expiring}</p></div><div className="border border-white/10 p-4"><p className="text-xs text-muted-foreground">Vencidos</p><p className="mt-1 text-2xl font-semibold">{counts.expired}</p></div></div></section>

    <section className="border border-primary/25 bg-primary/[0.035] p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Onboarding automático</p><h2 className="mt-2 text-xl font-semibold">E-mail de boas-vindas ao Plano Pro</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Modelo usado na ativação do novo assinante Pro. A renovação continua usando comunicação separada.</p></div><Mail className="size-6 text-primary" /></div><div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]"><div className="border border-white/10 bg-background/40 p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">Assunto</p><p className="mt-2 font-semibold">{proWelcomeTemplate.subject}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{proWelcomeTemplate.preview}</p></div><div className="border border-white/10 bg-background/40 p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">Recursos informados ao cliente</p><ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">{proWelcomeTemplate.features.map((item) => <li key={item}>• {item}</li>)}</ul></div></div></section>

    <section className="border border-white/10 bg-card p-5 sm:p-6">
      <div className="flex items-center gap-3"><Image src="/logo.png" alt="Kivai" width={28} height={28} /><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Sugestões de remarketing e nutrição</p><h2 className="mt-1 text-xl font-semibold">Modelos por situação do cliente</h2></div></div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">Você pode escolher um usuário diretamente em cada modelo e adicionar o e-mail à fila de comunicação. A entrega externa continuará marcada como preparada até um provedor de e-mail ser conectado.</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">{suggestions.map((item) => <article key={item.title} className="border border-white/10 bg-background/35 p-4"><div className="flex items-center gap-2"><Image src="/logo.png" alt="Kivai" width={20} height={20} /><h3 className="font-semibold">{item.title}</h3></div><p className="mt-3 text-xs font-semibold text-foreground">Assunto sugerido: {item.subject}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p><form action={queueSuggestedEmail} className="mt-4 grid gap-2"><input type="hidden" name="flowKey" value={item.flowKey} /><input type="hidden" name="subject" value={item.subject} /><input type="hidden" name="message" value={item.message} /><select name="userId" required defaultValue="" className="h-10 w-full border border-white/10 bg-background px-3 text-sm text-foreground"><option value="" disabled>Selecionar usuário</option>{users.map((user) => <option key={user.id} value={user.id}>{user.fullName || user.email} · {user.email}</option>)}</select><button className="h-9 bg-primary px-3 text-xs font-semibold text-primary-foreground">Adicionar à fila de e-mail</button></form><a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex h-9 items-center justify-center gap-2 border border-primary/30 bg-primary/10 px-3 text-xs font-semibold text-primary"><MessageCircle className="size-4" /> Entrar em contato pelo WhatsApp</a></article>)}</div>
    </section>

    <section className="border border-white/10 bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Fluxos de marketing</p><h2 className="mt-1 text-xl font-semibold">Incluir usuário em um fluxo</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Escolha qualquer usuário e associe manualmente a um fluxo de nutrição, upgrade, renovação, recuperação ou venda cruzada.</p></div><UserPlus className="size-6 text-primary" /></div>
      <form action={enrollCustomerInFlow} className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"><select name="userId" required defaultValue="" className="h-10 border border-white/10 bg-background px-3 text-sm text-foreground"><option value="" disabled>Selecionar usuário</option>{users.map((user) => <option key={user.id} value={user.id}>{user.fullName || user.email} · {user.email}</option>)}</select><select name="flowKey" required defaultValue="" className="h-10 border border-white/10 bg-background px-3 text-sm text-foreground"><option value="" disabled>Selecionar fluxo</option>{customerMarketingFlows.map((flow) => <option key={flow.key} value={flow.key}>{flow.label}</option>)}</select><button className="h-10 bg-primary px-5 text-xs font-semibold text-primary-foreground">Incluir no fluxo</button></form>
      <div className="mt-5 border-t border-white/10 pt-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Usuários em fluxos ativos</p><div className="mt-3 grid gap-2 md:grid-cols-2">{enrollments.slice(0,20).map((item) => { const user = userMap.get(item.user_id); return <div key={item.id} className="border border-white/10 bg-background/30 p-3 text-xs"><p className="font-semibold text-foreground">{user?.fullName || user?.email || item.user_id}</p><p className="mt-1 text-muted-foreground">{flowMap.get(item.flow_key as never) || item.flow_key} · desde {formatDate(item.enrolled_at)}</p></div>; })}{!enrollments.length ? <p className="text-sm text-muted-foreground">Nenhum usuário incluído manualmente em fluxo ainda.</p> : null}</div></div>
    </section>

    <nav className="flex flex-wrap gap-2 border border-white/10 bg-card p-3">{[['all','Todos'],['free','Grátis'],['active','Ativos'],['expiring','Vence em até 10 dias'],['expired','Vencidos'],['trial','Teste/cortesia']].map(([value,label]) => <a key={value} href={`/admin/marketing?segment=${value}`} className={`border px-3 py-2 text-xs font-semibold ${segment === value ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground'}`}>{label}</a>)}</nav>

    <section className="space-y-4">{filtered.map((user) => <article key={user.id} className="border border-white/10 bg-card p-5"><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,1.2fr)_220px]"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{user.fullName || user.email}</h2><span className="border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">{user.planCode.toUpperCase()}</span></div><p className="mt-1 text-sm text-muted-foreground">{user.email}</p><div className="mt-4 space-y-1 text-xs text-muted-foreground"><p>Status: {user.subscriptionStatus ?? 'sem assinatura'}</p><p>Vencimento: {user.periodEnd ? new Date(user.periodEnd).toLocaleDateString('pt-BR') : '-'}</p><p>Serviços: {user.contractedServices.length ? user.contractedServices.join(', ') : '-'}</p></div></div><form action={queueManualCampaign} className="grid gap-2"><input type="hidden" name="userId" value={user.id} /><div className="grid gap-2 sm:grid-cols-2"><label className="text-xs text-muted-foreground">Canal<select name="channel" className="mt-1 h-9 w-full border border-white/10 bg-background px-2 text-sm text-foreground"><option value="email">E-mail</option><option value="whatsapp">WhatsApp</option><option value="internal">Aviso no painel</option></select></label><label className="text-xs text-muted-foreground">Oferta<select name="offerType" className="mt-1 h-9 w-full border border-white/10 bg-background px-2 text-sm text-foreground"><option value="none">Sem benefício</option><option value="discount">Desconto</option><option value="credit">Crédito adicional</option><option value="grace">Dias grátis</option><option value="service_bonus">Benefício em outro serviço</option></select></label></div><input name="subject" placeholder="Assunto do e-mail" className="h-9 border border-white/10 bg-background px-3 text-sm" /><textarea name="message" required rows={4} placeholder="Escreva a mensagem de relacionamento..." className="border border-white/10 bg-background p-3 text-sm" /><button className="h-9 bg-primary px-4 text-xs font-semibold text-primary-foreground">Preparar remarketing</button></form><div className="space-y-2"><form action={grantGracePeriod} className="border border-white/10 p-3"><input type="hidden" name="userId" value={user.id} /><p className="flex items-center gap-2 text-xs font-semibold"><Gift className="size-4 text-primary" /> Cortesia</p><div className="mt-2 flex gap-2"><input name="days" type="number" min="1" max="30" defaultValue="5" className="h-8 w-16 border border-white/10 bg-background px-2 text-xs" /><button className="h-8 flex-1 border border-primary/30 bg-primary/10 px-2 text-xs font-semibold text-primary">Liberar dias</button></div></form>{user.phone ? <a href={`https://wa.me/${user.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="flex h-9 items-center justify-center gap-2 border border-white/10 text-xs font-semibold"><MessageCircle className="size-4" /> WhatsApp do cliente</a> : <div className="border border-white/10 p-3 text-xs text-muted-foreground">Sem WhatsApp cadastrado.</div>}</div></div></article>)}{!filtered.length ? <div className="border border-white/10 bg-card p-8 text-center text-sm text-muted-foreground">Nenhum usuário neste segmento.</div> : null}</section>

    <section className="border border-white/10 bg-card p-5"><div className="flex items-center gap-2"><Repeat2 className="size-5 text-primary" /><h2 className="font-semibold">Fila de comunicações</h2></div><p className="mt-2 text-sm text-muted-foreground">Os lembretes automáticos, ativações e recuperações continuam aparecendo aqui. O status “ready” significa preparado para envio.</p><div className="mt-4 divide-y divide-white/10 border-y border-white/10">{communications.slice(0,30).map((item) => { const user = userMap.get(item.user_id); return <div key={item.id} className="grid gap-2 py-4 md:grid-cols-[170px_1fr_130px]"><div className="text-xs text-muted-foreground"><p className="font-semibold text-foreground">{user?.email || item.user_id}</p><p className="mt-1">{item.channel === 'email' ? 'E-mail' : item.channel === 'whatsapp' ? 'WhatsApp' : 'Painel'}</p></div><div><p className="text-sm font-medium">{item.subject || item.event_key}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.message}</p></div><div className="text-xs text-muted-foreground"><span className="border border-white/10 px-2 py-1">{item.status}</span><p className="mt-2">{formatDate(item.sent_at || item.scheduled_for)}</p></div></div>})}{!communications.length ? <p className="py-6 text-sm text-muted-foreground">Nenhuma comunicação criada ainda.</p> : null}</div></section>

    <section className="grid gap-3 md:grid-cols-3"><div className="border border-white/10 bg-card p-4"><TimerReset className="size-5 text-primary" /><h3 className="mt-2 font-semibold">Automação de vencimento</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Lembretes de vencimento e recuperação continuam preservados.</p></div><div className="border border-white/10 bg-card p-4"><Gift className="size-5 text-primary" /><h3 className="mt-2 font-semibold">Oferta personalizada</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Escolha desconto, crédito, cortesia ou benefício em outro serviço conforme o contexto do cliente.</p></div><div className="border border-white/10 bg-card p-4"><MessageCircle className="size-5 text-primary" /><h3 className="mt-2 font-semibold">Multicanal</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">E-mail, WhatsApp e avisos internos continuam usando a mesma fila de relacionamento.</p></div></section>
  </div>;
}
