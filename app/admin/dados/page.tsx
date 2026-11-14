import { Database, HardDrive, Layers3, Image } from "lucide-react";
import { VideoStudyStorageAdmin } from "@/components/admin/video-study-storage-admin";
import { SavedProjectsStorageAdmin } from "@/components/admin/saved-projects-storage-admin";
import { supabaseRest } from "@/lib/blog/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Capacity = { databaseBytes: number; storageBytes: number; snapshotStorageBytes: number; projectCount: number; projectPayloadBytes: number; snapshotCount: number; activeSubscribers: number };
const mb = (n: number) => `${(n / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;

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
        { label: "Banco de dados", value: mb(capacity.databaseBytes), detail: "Tamanho atual do banco", icon: Database },
        { label: "Arquivos", value: mb(capacity.storageBytes), detail: "Objetos em todos os buckets", icon: HardDrive },
        { label: "Projetos salvos", value: capacity.projectCount.toLocaleString("pt-BR"), detail: `${mb(capacity.projectPayloadBytes)} em conteúdo`, icon: Layers3 },
        { label: "Históricos do Instagram", value: capacity.snapshotCount.toLocaleString("pt-BR"), detail: `${mb(capacity.snapshotStorageBytes)} em arquivos`, icon: Image },
      ].map(({ label, value, detail, icon: Icon }) => <section key={label} className="border border-border bg-card p-4"><div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{label}</p><Icon className="size-4 text-primary" /></div><p className="mt-2 text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></section>)}
      <p className="text-xs leading-5 text-muted-foreground sm:col-span-2 xl:col-span-4">As métricas são agregadas. O inventário abaixo permite revisar e excluir projetos e estudos individualmente. Para excluir definitivamente uma conta e os dados vinculados, acesse <Link className="font-medium text-primary underline" href="/admin/usuarios">Usuários e assinaturas</Link>. Registros financeiros são preservados.</p>
    </section> : null}
    <SavedProjectsStorageAdmin />
    <VideoStudyStorageAdmin />
  </main>;
}
