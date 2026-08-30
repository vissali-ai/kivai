import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MarketingTemplateRichEditor } from "@/components/admin/marketing-template-rich-editor";
import { getOnboardingTemplate, onboardingTemplateKeys, type OnboardingTemplateKey } from "@/lib/marketing/onboarding-templates";
import { saveOnboardingTemplateRich } from "./actions";

export const dynamic = "force-dynamic";

export default async function OnboardingTemplateEditor({ params, searchParams }: { params: Promise<{ templateKey: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { templateKey } = await params;
  const query = await searchParams;
  if (!onboardingTemplateKeys.includes(templateKey as OnboardingTemplateKey)) notFound();
  const template = await getOnboardingTemplate(templateKey as OnboardingTemplateKey);
  if (!template) notFound();
  const saveAction = saveOnboardingTemplateRich.bind(null, templateKey);

  return <div className="space-y-6">
    <section className="border border-white/10 bg-card p-6">
      <Link href="/admin/marketing" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" /> Voltar ao Marketing</Link>
      <div className="mt-4 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold">{template.title}</h1><span className="border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">Fluxo automático</span></div>
      <p className="mt-2 text-sm text-muted-foreground">Edite o conteúdo, confira a prévia e configure até dois botões. O envio continua sendo realizado automaticamente pelo evento correspondente da conta.</p>
      {query.saved ? <p className="mt-4 text-sm text-emerald-300">Template salvo com sucesso.</p> : null}
    </section>
    <MarketingTemplateRichEditor
      initial={{ title: template.title, description: template.description, subject: template.subject, message: template.message, ctaLabel: template.cta_label ?? "", ctaUrl: template.cta_url ?? "", secondaryCtaLabel: template.secondary_cta_label ?? "", secondaryCtaUrl: template.secondary_cta_url ?? "", enabled: template.enabled }}
      automatic
      saveAction={saveAction}
    />
  </div>;
}
