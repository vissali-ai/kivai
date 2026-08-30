import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { isCustomerMarketingFlowKey } from "@/lib/marketing/customer-flows";
import { getCustomerMarketingTemplate } from "@/lib/marketing/templates";
import { saveMarketingTemplate } from "@/app/admin/marketing/actions";

export const dynamic = "force-dynamic";

export default async function MarketingTemplateEditorPage({ params }: { params: Promise<{ flowKey: string }> }) {
  const { flowKey } = await params;
  if (!isCustomerMarketingFlowKey(flowKey)) notFound();
  const template = await getCustomerMarketingTemplate(flowKey);
  if (!template) notFound();

  return (
    <div className="space-y-6">
      <section className="border border-white/10 bg-card p-6">
        <Link href="/admin/marketing" className="inline-flex items-center gap-2 text-sm font-medium text-primary"><ArrowLeft className="size-4" /> Voltar para Marketing</Link>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Editor de comunicação</p>
        <h1 className="mt-2 text-3xl font-semibold">{template.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Edite o conteúdo completo deste modelo. As próximas mensagens enviadas a partir dele usarão a versão salva aqui.</p>
      </section>

      <form action={saveMarketingTemplate} className="space-y-5 border border-white/10 bg-card p-6">
        <input type="hidden" name="flowKey" value={template.flow_key} />
        <label className="grid gap-2 text-sm"><span className="font-medium">Título interno</span><input name="title" defaultValue={template.title} required maxLength={160} className="h-11 border border-white/10 bg-background px-3 text-foreground" /></label>
        <label className="grid gap-2 text-sm"><span className="font-medium">Assunto do e-mail</span><input name="subject" defaultValue={template.subject} required maxLength={200} className="h-11 border border-white/10 bg-background px-3 text-foreground" /></label>
        <label className="grid gap-2 text-sm"><span className="font-medium">Descrição interna</span><textarea name="description" defaultValue={template.description} rows={4} maxLength={1500} className="border border-white/10 bg-background p-3 text-foreground" /></label>
        <label className="grid gap-2 text-sm"><span className="font-medium">Mensagem completa</span>{template.flow_key === "new_post" ? <span className="text-xs leading-5 text-muted-foreground">Use as variáveis {"{{titulo}}"}, {"{{resumo}}"}, {"{{slug}}"} e {"{{link}}"}. Elas serão preenchidas automaticamente com os dados da publicação.</span> : null}<textarea name="message" defaultValue={template.message} required rows={14} maxLength={12000} className="border border-white/10 bg-background p-3 text-foreground" /></label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm"><span className="font-medium">Texto do botão</span><input name="ctaLabel" defaultValue={template.cta_label ?? ""} maxLength={80} className="h-11 border border-white/10 bg-background px-3 text-foreground" /></label>
          <label className="grid gap-2 text-sm"><span className="font-medium">Link do botão</span><input name="ctaUrl" defaultValue={template.cta_url ?? ""} placeholder="https://www.kivai.com.br/..." className="h-11 border border-white/10 bg-background px-3 text-foreground" /></label>
        </div>
        <label className="flex items-center gap-3 border border-white/10 bg-background/30 p-4 text-sm"><input type="checkbox" name="enabled" defaultChecked={template.enabled} /><span><strong>Modelo ativo</strong><span className="mt-1 block text-xs text-muted-foreground">Desative para impedir novos envios usando este modelo.</span></span></label>
        <button className="inline-flex h-11 items-center justify-center gap-2 bg-primary px-5 text-sm font-semibold text-primary-foreground"><Save className="size-4" /> Salvar modelo</button>
      </form>
    </div>
  );
}
