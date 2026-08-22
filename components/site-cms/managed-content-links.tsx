import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listPublishedContentsAt } from "@/lib/site-cms/repository";
import type { SiteContentType, SiteDisplayLocation } from "@/lib/site-cms/types";

export async function ManagedContentLinks({ location, title, contentType }: { location: SiteDisplayLocation; title: string; contentType?: SiteContentType }) {
  const items = await listPublishedContentsAt(location, contentType);
  if (!items.length) return null;
  return <section className="border-t border-white/5 bg-background py-12"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><h2 className="text-2xl font-semibold tracking-tight">{title}</h2><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <Link key={item.id} href={item.path} className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-primary/35"><h3 className="font-semibold">{item.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.shortDescription}</p><span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">Abrir<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span></Link>)}</div></div></section>;
}
