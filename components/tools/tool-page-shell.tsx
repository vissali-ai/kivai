import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import { ToolPrivacyNotice, type ProcessingMode } from "@/components/tools/tool-privacy-notice";

export type ToolPageShellProps = { title: string; description: string; categoryName: string; categoryHref: string; children: ReactNode; privacyMessage?: string; processingMode?: ProcessingMode; complementaryContent?: ReactNode; relatedTools?: ReactNode; showHeader?: boolean; showBreadcrumb?: boolean; breadcrumbRootName?: string; breadcrumbRootHref?: string };

export function ToolPageShell({ title, description, categoryName, categoryHref, children, privacyMessage, processingMode = "local", complementaryContent, relatedTools, showHeader = true, showBreadcrumb = true, breadcrumbRootName = "Ferramentas", breadcrumbRootHref = "/ferramentas" }: ToolPageShellProps) {
  return <main className="min-h-screen overflow-x-clip bg-background text-foreground"><div className={`mx-auto w-full max-w-6xl px-4 pb-12 ${showBreadcrumb ? "pt-24" : "pt-32"} sm:px-6 lg:px-8 lg:pb-16`}>
    {showBreadcrumb && <nav aria-label="Navegação estrutural" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><Link href={breadcrumbRootHref} className="hover:text-foreground">{breadcrumbRootName}</Link><ChevronRight className="size-3.5" aria-hidden="true" /><Link href={categoryHref} className="hover:text-foreground">{categoryName}</Link>{showHeader && <><ChevronRight className="size-3.5" aria-hidden="true" /><span aria-current="page" className="max-w-full truncate text-foreground">{title}</span></>}</nav>}
    {showHeader && <header className="mb-8 max-w-3xl sm:mb-10"><p className="text-sm font-medium uppercase tracking-wider text-primary">{categoryName}</p><h1 className="mt-3 break-words font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">{title}</h1><p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">{description}</p></header>}
    <div className="space-y-6">{children}<ToolPrivacyNotice processingMode={processingMode} message={privacyMessage} /></div><div className="mx-auto mt-8 max-w-5xl"><AdSlot variant="banner" /></div>{complementaryContent && <div className="mt-10">{complementaryContent}</div>}{relatedTools && <div className="mt-10">{relatedTools}</div>}
  </div></main>;
}
