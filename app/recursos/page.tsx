import { ManagedContentLinks } from "@/components/site-cms/managed-content-links";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({ title: "Materiais e Guias", description: "Materiais e guias práticos publicados pelo Kivai.", pathname: "/recursos" });
export default function ResourcesPage() { return <main className="min-h-screen bg-background pb-16 pt-24"><section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Biblioteca</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Materiais e guias</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">Conteúdos de apoio organizados para consulta prática.</p></section><ManagedContentLinks location="resource_library" title="Conteúdos disponíveis" contentType="resource" /></main>; }
