import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MarketingTemplateRichEditor } from "@/components/admin/marketing-template-rich-editor";
import { listAdminCustomers } from "@/lib/admin/customer-users";
import { isAutomaticMarketingFlowKey, isCustomerMarketingFlowKey } from "@/lib/marketing/customer-flows";
import { getCustomerMarketingTemplate } from "@/lib/marketing/templates";
import { saveMarketingTemplate, sendManualMarketingEmail } from "./actions";

export const dynamic = "force-dynamic";

export default async function MarketingTemplateEditorPage({ params, searchParams }: { params: Promise<{ flowKey: string }>; searchParams: Promise<{ saved?: string; sent?: string }> }) {
  const { flowKey } = await params;
  const query = await searchParams;
  if (!isCustomerMarketingFlowKey(flowKey)) notFound();
  const template = await getCustomerMarketingTemplate(flowKey);
  if (!template) notFound();
  const automatic = isAutomaticMarketingFlowKey(flowKey);
  const customers = automatic ? [] : (await listAdminCustomers()).filter((user) => user.email).map((user) => ({ id: user.id, email: user.email, name: user.fullName }));
  const saveAction = saveMarketingTemplate.bind(null, flowKey);
  const sendAction = automatic ? undefined : sendManualMarketingEmail.bind(null, flowKey);

  return <div className="space-y-6">
    <section className="border border-white/10 bg-card p-6">
      <Link href="/admin/marketing" className="inline-flex items-center gap-2 text-sm font-medium text-primary"><ArrowLeft className="size-4" /> Voltar para Marketing</Link>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Editor de comunicação</p>
      <div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold">{template.title}</h1>{automatic ? <span className="border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">Fluxo automático</span> : <span className="border border-white/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Envio manual</span>}</div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{automatic ? "Edite e visualize o template. Os próximos disparos automáticos usarão a versão salva, sem alterar a cadência do fluxo." : "Edite o template, confira a prévia em desktop e mobile e escolha o destinatário antes do envio manual."}</p>
      {flowKey === "new_post" ? <p className="mt-3 text-xs leading-5 text-muted-foreground">Variáveis disponíveis: {"{{titulo}}"}, {"{{resumo}}"}, {"{{slug}}"} e {"{{link}}"}.</p> : null}
      {query.saved ? <p className="mt-4 text-sm text-emerald-300">Template salvo com sucesso.</p> : null}{query.sent ? <p className="mt-4 text-sm text-emerald-300">E-mail enviado com sucesso.</p> : null}
    </section>

    <MarketingTemplateRichEditor
      initial={{ subject: template.subject, message: template.message, ctaLabel: template.cta_label ?? "", ctaUrl: template.cta_url ?? "", secondaryCtaLabel: template.secondary_cta_label ?? "", secondaryCtaUrl: template.secondary_cta_url ?? "", enabled: template.enabled }}
      automatic={automatic}
      users={customers}
      saveAction={saveAction}
      sendAction={sendAction}
    />
  </div>;
}
