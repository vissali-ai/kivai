import { Database, HardDrive, Layers3, Image } from "lucide-react";
import { VideoStudyStorageAdmin } from "@/components/admin/video-study-storage-admin";
import { SavedProjectsStorageAdmin } from "@/components/admin/saved-projects-storage-admin";
import { supabaseRest } from "@/lib/blog/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Capacity = { databaseBytes: number; storageBytes: number; snapshotStorageBytes: number; projectCount: number; projectPayloadBytes: number; snapshotCount: number; activeSubscribers: number };
const mb = (n: number) => `${(n / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
const FREE_DATABASE_LIMIT = 500 * 1024 * 1024;
const FREE_STORAGE_LIMIT = 1024 * 1024 * 1024;

function UsageMeter({ label, bytes, limit }: { label: string; bytes: number; limit: number }) {
  const percentage = Math.min(100, Math.max(0, Math.round(bytes / limit * 100)));
  const color = percentage >= 85 ? "bg-destructive" : percentage >= 70 ? "bg-amber-500" : "bg-primary";
  return <div className="mt-3 space-y-1.5">
    <div className="flex justify-between gap-2 text-xs text-muted-foreground"><span>{label}</span><span>{percentage}%</span></div>
    <div className="h-2 overflow-hidden rounded-full bg-muted" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}><div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} /></div>
  </div>;
}

export default async function AdminDataPage() {
  let capacity: Capacity | null = null;
  let error = false;
  try { capacity = await supabaseRest<Capacity>("rpc/kivai_admin_capacity_metrics", { method: "POST", body: "{}" }); }
  catch { error = true; }
  return <main className="space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Sistema</p><h1 className="mt-1 text-3xl font-semibold">Dados e armazenamento</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Monitore o banco e os arquivos. Consulte os dados guardados e remova definitivamente itens que não precisam mais existir. Cobranças e registros financeiros são preservados.</p></header>
    {error ? <p role="status" className="border border-amber-500/30 bg-amber-500/5 p-4 text-sm">Não foi possível consultar as métricas agora. Atualize a página mais tarde.</p> : null}
    {capacity ? <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo de armazenamento">
      {[
        { label: "Banco de dados", value: mb(capacity.databaseBytes), detail: "Tamanho atual do banco", icon: Database, limit: FREE_DATABASE_LIMIT, limitLabel: "da referência Free: 500 MB" },
        { label: "Arquivos", value: mb(capacity.storageBytes), detail: "Objetos em todos os buckets", icon: HardDrive, limit: FREE_STORAGE_LIMIT, limitLabel: "da referência Free: 1 GB" },
        { label: "Projetos salvos", value: capacity.projectCount.toLocaleString("pt-BR"), detail: `${mb(capacity.projectPayloadBytes)} em conteúdo`, icon: Layers3 },
        { label: "Históricos do Instagram", value: capacity.snapshotCount.toLocaleString("pt-BR"), detail: `${mb(capacity.snapshotStorageBytes)} em arquivos`, icon: Image },
      ].map(({ label, value, detail, icon: Icon, limit, limitLabel }) => <section key={label} className="border border-border bg-card p-4"><div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{label}</p><Icon className="size-4 text-primary" /></div><p className="mt-2 text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p>{limit ? <><UsageMeter label={limitLabel ?? "da cota Free"} bytes={label === "Banco de dados" ? capacity.databaseBytes : capacity.storageBytes} limit={limit} /><p className="mt-1 text-[11px] text-muted-foreground">Estimativa em relação à cota Free do Supabase.</p></> : null}</section>)}
      <aside className="border border-primary/20 bg-primary/5 p-4 text-sm leading-6 sm:col-span-2 xl:col-span-4">
        <p className="font-semibold">Acompanhe o espaço e o tráfego separadamente</p>
        <p className="mt-1 text-muted-foreground">Os números e barras mostram o espaço atual; atualize esta página para consultar de novo. Eles não guardam histórico. Para o tráfego das reproduções (Egress), abra o <a className="font-medium text-primary underline" href="https://supabase.com/dashboard/org/ziksnylnzvzptvafglsg/usage" target="_blank" rel="noreferrer">uso do Supabase</a> e confira as categorias Egress e Cached Egress. Esse tráfego é compartilhado com os demais serviços e projetos da organização.</p>
        <p className="mt-1 text-muted-foreground">Planeje a mudança para o Pro antes de chegar perto do limite Free. O upgrade amplia as cotas, mas não reduz uso já acumulado nem substitui o acompanhamento de Egress.</p>
      </aside>
      <p className="text-xs leading-5 text-muted-foreground sm:col-span-2 xl:col-span-4">As métricas são agregadas. O inventário abaixo permite revisar e excluir projetos e estudos individualmente. Para excluir definitivamente uma conta e os dados vinculados, acesse <Link className="font-medium text-primary underline" href="/admin/usuarios">Usuários e assinaturas</Link>. Registros financeiros são preservados.</p>
    </section> : null}
    <SavedProjectsStorageAdmin />
    <VideoStudyStorageAdmin />
  </main>;
}

