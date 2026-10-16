"use client";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getStoredSession } from "@/lib/user-auth";
import { useAccountAccess, type AccountAccess } from "@/lib/billing/access-client";
import { projectLimits } from "@/lib/billing/plan-benefits";
import type { SavedProject } from "@/lib/projects/validation";

type Props = { kind?: SavedProject["kind"]; payload?: unknown; onLoad?: (payload: unknown) => void; showInstagramHighlight?: boolean };
const routes: Record<SavedProject["kind"], string> = { calendar: "/ferramentas/calendario-editorial-redes-sociais", briefing: "/ferramentas/planejador-de-conteudo-social-media", qr_code: "/ferramentas/gerador-de-qr-code", watermark: "/ferramentas/adicionar-marca-dagua", social_report: "/ferramentas/gerador-de-relatorio-social-media", preview_post: "/ferramentas/preview-de-post-redes-sociais", engagement: "/ferramentas/calculadora-de-engajamento", roas: "/ferramentas/calculadora-de-roas", roi: "/ferramentas/calculadora-de-roi", post_analysis: "/ferramentas/analisador-de-posts", trend_radar: "/ferramentas/radar-de-tendencias", margin: "/ferramentas/calculadora-de-margem", markup: "/ferramentas/calculadora-de-markup" };
const labels: Record<SavedProject["kind"], string> = { calendar: "Calendário", briefing: "Briefing", qr_code: "QR Code", watermark: "Marca d’água", social_report: "Relatório Social Media", preview_post: "Preview de Post", engagement: "Engajamento", roas: "ROAS", roi: "ROI", post_analysis: "Análise de Posts", trend_radar: "Radar de Tendências", margin: "Margem", markup: "Markup" };
async function requestProjects(method = "GET", body?: unknown, id?: string) {
  const token = getStoredSession()?.access_token;
  if (!token) throw new Error("Entre na sua conta para continuar.");
  const response = await fetch(`/api/account/projects${id ? `?id=${encodeURIComponent(id)}` : ""}`, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Não foi possível acessar seus projetos.");
  return data as { projects: SavedProject[]; project: SavedProject };
}
export function SavedProjects({ kind, payload, onLoad, showInstagramHighlight = false }: Props) {
  const { access, error: accessError, loading } = useAccountAccess();
  if (loading) return <section aria-label="Projetos salvos" className="rounded-2xl border p-5"><h2 className="text-xl font-semibold">Meus projetos</h2><p role="status" className="mt-3 text-sm">Carregando seus projetos...</p></section>;
  return <ProjectLibrary key={access?.userId ?? "guest"} kind={kind} payload={payload} onLoad={onLoad} showInstagramHighlight={showInstagramHighlight} access={access} accessError={accessError} />;
}
function ProjectLibrary({ kind, payload, onLoad, showInstagramHighlight, access, accessError }: Props & { access: AccountAccess | null; accessError: string }) {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [selected, setSelected] = useState<SavedProject | null>(null);
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(Boolean(access?.userId));
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [opening, setOpening] = useState<SavedProject | null>(null);
  const plan = access?.plan ?? "free";
  const userId = access?.userId;
  const shortcutClass = showInstagramHighlight
    ? "inline-flex min-h-11 items-center rounded-lg border border-border bg-background/60 px-3 py-2 text-sm font-medium text-primary transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    : "text-primary underline";
  useEffect(() => {
    let active = true;
    if (!userId) return;
    requestProjects().then(data => { if (active) { setProjects(data.projects); setLoadError(""); } }).catch(err => { if (active) setLoadError(err.message); }).finally(() => { if (active) setLoadingProjects(false); });
    return () => { active = false; };
  }, [userId, retry]);
  const normalizeSearch = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  const query = normalizeSearch(search.trim());
  const visible = projects.filter(p => (!kind || p.kind === kind) && (!filter || p.client_name === filter) && (!query || normalizeSearch(`${p.title} ${p.client_name} ${labels[p.kind]}`).includes(query)));
  async function open(project: SavedProject) {
    setBusy(true);
    try {
      const data = await requestProjects();
      const latest = data.projects.find(item => item.id === project.id);
      if (!latest) throw new Error("Este projeto foi excluído. Atualize a lista.");
      setProjects(data.projects); onLoad?.(latest.payload); setSelected(latest); setTitle(latest.title); setClient(latest.client_name); setOpening(null); setMessage("Projeto aberto. Salve suas alterações na conta quando terminar.");
    } catch (err) { setMessage(err instanceof Error ? err.message : "Não foi possível abrir o projeto."); }
    finally { setBusy(false); }
  }
  async function save(copy: boolean) {
    setBusy(true); setMessage("");
    try {
      const { project } = await requestProjects("POST", { id: copy ? null : selected?.id ?? null, kind, title, clientName: plan === "agency" ? client : "", payload, revision: selected?.revision });
      setProjects(all => [project, ...all.filter(p => p.id !== project.id)]); setSelected(project); setMessage("Projeto salvo na sua conta. Disponível em outros dispositivos.");
    } catch (err) { setMessage(err instanceof Error ? err.message : "Falha ao salvar."); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    setBusy(true);
    try { await requestProjects("DELETE", undefined, id); setProjects(all => all.filter(p => p.id !== id)); if (selected?.id === id) setSelected(null); setConfirmDelete(null); setMessage("Projeto excluído da conta. O conteúdo aberto na ferramenta foi preservado."); }
    catch (err) { setMessage(err instanceof Error ? err.message : "Falha ao excluir."); }
    finally { setBusy(false); }
  }
  function download(project: SavedProject) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(project, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = `${project.kind}-${project.id}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  return <section className="my-6 space-y-4 rounded-2xl border border-primary/25 bg-card p-5" aria-label="Projetos salvos">
    <div><h2 className="text-xl font-semibold">Meus projetos</h2><p className="mt-2 text-sm text-muted-foreground">{loadingProjects ? "Consultando seus projetos..." : loadError || accessError ? "Seus projetos aparecerão após a consulta ser restabelecida." : `${projects.length}/${projectLimits[plan]} projetos salvos. Salve na conta para continuar em outro dispositivo.`}</p></div>
    {!userId && !accessError ? <Link className="text-primary underline" href="/conta/login?next=/conta">Entrar na minha conta</Link> : null}
    {kind && userId ? <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Nome do projeto<input className="mt-1 block w-full rounded border bg-background p-2" maxLength={120} value={title} onChange={e => setTitle(e.target.value)} /></label>{plan === "agency" ? <label className="text-sm">Cliente (opcional)<input className="mt-1 block w-full rounded border bg-background p-2" maxLength={100} value={client} onChange={e => setClient(e.target.value)} /><span className="text-xs text-muted-foreground">Até 20 nomes de clientes em seus projetos.</span></label> : null}<div className="flex flex-wrap gap-2 sm:col-span-2"><Button disabled={busy || !title.trim() || !!accessError || (plan === "pro" && !!selected?.client_name)} onClick={() => save(false)}>Salvar na conta</Button><Button variant="outline" disabled={busy || !title.trim() || !!accessError} onClick={() => save(true)}>Salvar como novo projeto</Button></div></div> : null}
    {!kind && projects.length > 0 ? <div className="flex flex-wrap items-end gap-3"><label className="min-w-0 flex-1 text-sm">Buscar projetos<input type="search" className="mt-1 block min-h-11 w-full rounded border bg-background px-3 py-2" placeholder="Nome, cliente ou ferramenta" value={search} onChange={event => setSearch(event.target.value)} /></label>{search || filter ? <Button variant="outline" className="min-h-11" onClick={() => { setSearch(""); setFilter(""); }}>Limpar filtros</Button> : null}</div> : null}
    {projects.some(p => p.client_name) ? <label className="block text-sm">Filtrar por cliente<select className="mt-1 block min-h-11 w-full rounded border bg-background p-2 sm:max-w-sm" value={filter} onChange={e => setFilter(e.target.value)}><option value="">Todos os clientes</option>{[...new Set(projects.map(p => p.client_name).filter(Boolean))].sort().map(name => <option key={name}>{name}</option>)}</select></label> : null}
    {loadingProjects ? <p role="status" className="text-sm">Carregando seus projetos...</p> : null}
    {loadError ? <div role="alert" className="space-y-2 text-sm"><p>{loadError}</p><Button variant="outline" disabled={loadingProjects} onClick={() => { setLoadingProjects(true); setRetry(value => value + 1); }}>Tentar carregar projetos novamente</Button></div> : null}
    {message || accessError ? <p role="status" className="text-sm">{accessError || message}</p> : null}
    {opening ? <div className="rounded border p-3"><p className="text-sm">Abrir “{opening.title}” substituirá o conteúdo atual da ferramenta. Salve o trabalho atual antes de continuar.</p><div className="mt-2 flex gap-2"><Button onClick={() => open(opening)}>Abrir projeto</Button><Button variant="outline" onClick={() => setOpening(null)}>Cancelar</Button></div></div> : null}
    <div className="space-y-2">{visible.map(project => <article key={project.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3"><div className="min-w-0 max-w-full"><h3 className="break-words font-medium">{project.title}</h3><p className="text-xs text-muted-foreground">{labels[project.kind]}{project.client_name ? ` · ${project.client_name}` : ""} · {new Date(project.updated_at).toLocaleDateString("pt-BR")}</p></div><div className="flex flex-wrap gap-2 [&_a]:min-h-11 [&_button]:min-h-11">{onLoad ? <Button size="sm" variant="outline" onClick={() => setOpening(project)}>Abrir</Button> : <Button asChild size="sm" variant="outline"><Link href={routes[project.kind]}>Abrir ferramenta</Link></Button>}<Button size="sm" variant="outline" onClick={() => download(project)}>Exportar JSON</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirmDelete(project.id)}>Excluir</Button>{confirmDelete === project.id ? <><span className="text-sm">Excluir este projeto salvo?</span><Button size="sm" variant="destructive" disabled={busy} onClick={() => remove(project.id)}>Confirmar exclusão</Button><Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button></> : null}</div></article>)}</div>
    {userId && !loadingProjects && !loadError && !accessError && !visible.length ? <p role="status" className="text-sm text-muted-foreground">{search || filter ? "Nenhum projeto encontrado. Tente outro nome ou limpe os filtros." : "Você ainda não tem projetos salvos. Escolha uma ferramenta abaixo e use Salvar na conta para continuar depois."}</p> : null}

    {showInstagramHighlight ? (
      <div className="relative overflow-hidden rounded-xl border border-primary/40 bg-gradient-to-br from-primary/[0.12] via-primary/[0.045] to-transparent p-4 sm:p-5">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <Users className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Histórico e comparações no Pro e Agency</span>
              </div>
              <h3 className="text-base font-semibold leading-6 sm:text-lg">Analisador de Seguidores do Instagram</h3>
              <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">Acompanhe suas análises, resultados e compare quem deixou de seguir você no instagram.</p>
            </div>
          </div>
          <Link href="/ferramentas/analisador-de-seguidores-instagram" className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto">
            Analisar seguidores <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    ) : null}
    <div className="space-y-3">
      {showInstagramHighlight ? <h3 className="text-sm font-medium">Criar um novo projeto</h3> : null}
      <nav aria-label="Ferramentas com projetos salvos" className="space-y-4">
        {([
          { heading: "Social Media", tools: ["calendar", "briefing", "social_report", "preview_post", "engagement", "post_analysis", "trend_radar"] },
          { heading: "Marketing e performance", tools: ["roas", "roi", "margin", "markup"] },
          { heading: "Imagens e utilidades", tools: ["qr_code", "watermark"] },
        ] as const).map(group => (
          <div key={group.heading} className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">{group.heading}</h4>
            <div className="flex flex-wrap gap-2 text-sm">
              {group.tools.map(tool => (
                <Link key={tool} className={shortcutClass} href={routes[tool]}>{labels[tool]}</Link>
              ))}
            </div>
          </div>
        ))}
        {plan === "free" ? <Link className={shortcutClass} href="/planos">Conhecer planos</Link> : null}
      </nav>
    </div>
  </section>;
}
