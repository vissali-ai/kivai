import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { getOnboardingTemplate, onboardingTemplateKeys, type OnboardingTemplateKey } from "@/lib/marketing/onboarding-templates";
import { saveOnboardingTemplate } from "@/app/admin/marketing/actions";

export const dynamic = "force-dynamic";

export default async function OnboardingTemplateEditor({ params }: { params: Promise<{ templateKey: string }> }) {
  const { templateKey } = await params;
  if (!onboardingTemplateKeys.includes(templateKey as OnboardingTemplateKey)) notFound();
  const template = await getOnboardingTemplate(templateKey as OnboardingTemplateKey);
  if (!template) notFound();

  return <div className="space-y-5">
    <div className="flex items-center justify-between gap-4">
      <div><Link href="/admin/marketing" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" /> Voltar ao Marketing</Link><h1 className="mt-3 text-3xl font-semibold">Editar onboarding</h1><p className="mt-2 text-sm text-muted-foreground">Este conteúdo é usado no envio automático correspondente ao evento da conta.</p></div>
    </div>
    <form action={saveOnboardingTemplate} className="grid gap-5 border border-white/10 bg-card p-6">
      <input type="hidden" name="templateKey" value={template.template_key} />
      <label className="text-sm">Nome interno<input name="title" defaultValue={template.title} required className="mt-2 h-11 w-full border border-white/10 bg-background px-3" /></label>
      <label className="text-sm">Assunto do e-mail<input name="subject" defaultValue={template.subject} required className="mt-2 h-11 w-full border border-white/10 bg-background px-3" /></label>
      <label className="text-sm">Descrição interna<textarea name="description" defaultValue={template.description} rows={3} className="mt-2 w-full border border-white/10 bg-background p-3" /></label>
      <label className="text-sm">Mensagem<textarea name="message" defaultValue={template.message} required rows={12} className="mt-2 w-full border border-white/10 bg-background p-3 leading-6" /></label>
      <div className="grid gap-4 md:grid-cols-2"><label className="text-sm">Texto do botão<input name="ctaLabel" defaultValue={template.cta_label ?? ""} className="mt-2 h-11 w-full border border-white/10 bg-background px-3" /></label><label className="text-sm">Link do botão<input name="ctaUrl" defaultValue={template.cta_url ?? ""} placeholder="https://www.kivai.com.br/..." className="mt-2 h-11 w-full border border-white/10 bg-background px-3" /></label></div>
      <label className="flex items-center gap-3 border border-white/10 p-4 text-sm"><input type="checkbox" name="enabled" defaultChecked={template.enabled} /> Modelo ativo</label>
      <button className="inline-flex h-11 items-center justify-center gap-2 bg-primary px-5 font-semibold text-primary-foreground"><Save className="size-4" /> Salvar alterações</button>
    </form>
  </div>;
}
