"use client";
import Link from "next/link";
import { ArrowRight, FolderOpen, LayoutGrid, List, MoreHorizontal, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getStoredSession } from "@/lib/user-auth";
import { useAccountAccess, type AccountAccess } from "@/lib/billing/access-client";
import { projectLimits } from "@/lib/billing/plan-benefits";
import type { SavedProject } from "@/lib/projects/validation";

type Props = { kind?: SavedProject["kind"]; payload?: unknown; onLoad?: (payload: unknown) => void; showInstagramHighlight?: boolean };
const routes: Record<SavedProject["kind"], string> = { post_creator: "/ferramentas/criador-de-posts-com-ia", calendar: "/ferramentas/calendario-editorial-redes-sociais", briefing: "/ferramentas/planejador-de-conteudo-social-media", qr_code: "/ferramentas/gerador-de-qr-code", watermark: "/ferramentas/adicionar-marca-dagua", social_report: "/ferramentas/gerador-de-relatorio-social-media", preview_post: "/ferramentas/preview-de-post-redes-sociais", engagement: "/ferramentas/calculadora-de-engajamento", roas: "/ferramentas/calculadora-de-roas", roi: "/ferramentas/calculadora-de-roi", post_analysis: "/ferramentas/analisador-de-posts", trend_radar: "/ferramentas/radar-de-tendencias", margin: "/ferramentas/calculadora-de-margem", markup: "/ferramentas/calculadora-de-markup", proofreader: "/ferramentas/corretor-de-texto" };
const resumableKinds: ReadonlySet<SavedProject["kind"]> = new Set(["calendar", "briefing", "qr_code", "social_report", "preview_post", "roas", "roi", "margin", "markup", "proofreader"]);
const labels: Record<SavedProject["kind"], string> = { post_creator: "Criador de Posts com IA", calendar: "Calendário", briefing: "Briefing", qr_code: "QR Code", watermark: "Marca d’água", social_report: "Relatório Social Media", preview_post: "Preview de Post", engagement: "Engajamento", roas: "ROAS", roi: "ROI", post_analysis: "Análise de Posts", trend_radar: "Radar de Tendências", margin: "Margem", markup: "Markup", proofreader: "Corretor de Texto com IA" };
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
  const [kindFilter, setKindFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest" | "name">("recent");
  const [view, setView] = useState<"cards" | "list">(() => access?.plan === "agency" ? "list" : "cards");
  const [loadingProjects, setLoadingProjects] = useState(Boolean(access?.userId));
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [opening, setOpening] = useState<SavedProject | null>(null);
  const [resumeProjectId, setResumeProjectId] = useState<string | null>(null);
  const handledResume = useRef(false);
  const plan = access?.plan ?? "free";
  const userId = access?.userId;
  const loginHref = "/conta/login?next=%2Fconta";
  const shortcutClass = showInstagramHighlight
    ? "inline-flex min-h-11 items-center rounded-lg border border-border bg-background/60 px-3 py-2 text-sm font-medium text-primary transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    : "text-primary underline";
  useEffect(() => {
    let active = true;
    if (!userId) return;
    requestProjects().then(data => { if (active) { setProjects(data.projects); setLoadError(""); } }).catch(err => { if (active) setLoadError(err.message); }).finally(() => { if (active) setLoadingProjects(false); });
    return () => { active = false; };
  }, [userId, retry]);
  useEffect(() => {
    if (!kind || !onLoad || !userId || loadingProjects || loadError || handledResume.current) return;
    const projectId = new URLSearchParams(window.location.search).get("project");
    if (!projectId) return;
    handledResume.current = true;
    if (!/^[0-9a-f-]{36}$/i.test(projectId)) {
      setMessage("O link do projeto é inválido. Escolha um projeto na biblioteca.");
      return;
    }
    const project = projects.find(item => item.id === projectId && item.kind === kind);
    if (!project) {
      setMessage("O projeto não foi encontrado nesta conta ou não pertence a esta ferramenta.");
      return;
    }
    setResumeProjectId(project.id);
    setOpening(project);
  }, [kind, onLoad, userId, loadingProjects, loadError, projects]);
  const normalizeSearch = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  const query = normalizeSearch(search.trim());
  const visible = projects
    .filter(p => (!kind || p.kind === kind) && (!kindFilter || p.kind === kindFilter) && (!filter || p.client_name === filter) && (!query || normalizeSearch(`${p.title} ${p.client_name} ${labels[p.kind]}`).includes(query)))
    .sort((a, b) => sortOrder === "name"
      ? a.title.localeCompare(b.title, "pt-BR")
      : sortOrder === "oldest"
        ? Date.parse(a.updated_at) - Date.parse(b.updated_at)
        : Date.parse(b.updated_at) - Date.parse(a.updated_at));
  async function open(project: SavedProject) {
    setBusy(true);
    try {
      const data = await requestProjects();
      const latest = data.projects.find(item => item.id === project.id);
      if (!latest) throw new Error("Este projeto foi excluído. Atualize a lista.");
      setProjects(data.projects); onLoad?.(latest.payload); setSelected(latest); setTitle(latest.title); setClient(latest.client_name); setOpening(null); setResumeProjectId(null); setMessage("Projeto aberto. Salve suas alterações na conta quando terminar.");
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
    <div><h2 className="text-xl font-semibold">Meus projetos</h2><p className="mt-2 text-sm text-muted-foreground">{loadingProjects && userId ? "Consultando seus projetos..." : !userId ? "Faça login para salvar este projeto no seu painel." : loadError || accessError ? "Não foi possível consultar os projetos. Tente novamente." : kind ? `${projects.length}/${projectLimits[plan]} projetos salvos. Salve na conta para continuar em outro dispositivo.` : `${projects.length}/${projectLimits[plan]} projetos salvos.`}</p>{!kind && !loadingProjects && !loadError && !accessError ? <p className="mt-3 text-sm text-muted-foreground">Ferramentas que você pode salvar e manter um histórico.</p> : null}</div>
    {userId && !loadingProjects && !loadError && !accessError && plan !== "agency" && projects.length >= Math.ceil(projectLimits[plan] * 0.8) ?
      <p className="text-xs leading-5 text-muted-foreground">
        {plan === "free" ? "Você está perto do limite de projetos gratuitos. O Pro permite salvar até 30 projetos." : "Precisa de mais espaço e organização por cliente? O Agency permite até 200 projetos."}
        {" "}<Link href="/planos" className="font-medium text-primary underline-offset-4 hover:underline">Comparar planos</Link>
      </p> : null}
    {!userId ? <Button asChild><Link href={loginHref}>Entrar na conta</Link></Button> : null}
    {kind && userId ? <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Nome do projeto<input className="mt-1 block w-full rounded border bg-background p-2" maxLength={120} value={title} onChange={e => setTitle(e.target.value)} /></label>{plan === "agency" ? <label className="text-sm">Cliente (opcional)<input className="mt-1 block w-full rounded border bg-background p-2" maxLength={100} value={client} onChange={e => setClient(e.target.value)} /><span className="text-xs text-muted-foreground">Até 20 nomes de clientes em seus projetos.</span></label> : null}<div className="flex flex-wrap gap-2 sm:col-span-2"><Button disabled={busy || !title.trim() || !!accessError || (plan === "pro" && !!selected?.client_name)} onClick={() => save(false)}>Salvar na conta</Button><Button variant="outline" disabled={busy || !title.trim() || !!accessError} onClick={() => save(true)}>Salvar como novo projeto</Button></div></div> : null}
    {!kind && projects.length > 0 ? <div className="space-y-3 rounded-xl border border-border bg-background/30 p-3 sm:p-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(160px,200px)]">
        <label className="min-w-0 text-sm">Buscar projetos
          <input type="search" className="mt-1 block min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2" placeholder="Nome, cliente ou ferramenta" value={search} onChange={event => setSearch(event.target.value)} />
        </label>
        <label className="text-sm">Ferramenta
          <select aria-label="Filtrar por ferramenta" className="mt-1 block min-h-11 w-full rounded-lg border border-border bg-background p-2" value={kindFilter} onChange={event => setKindFilter(event.target.value)}>
            <option value="">Todas as ferramentas</option>
            {[...new Set(projects.map(project => project.kind))].sort((a, b) => labels[a].localeCompare(labels[b], "pt-BR")).map(tool => <option key={tool} value={tool}>{labels[tool]}</option>)}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm">Ordenar
            <select aria-label="Ordenar projetos" className="ml-2 min-h-10 rounded-lg border border-border bg-background px-2" value={sortOrder} onChange={event => setSortOrder(event.target.value as typeof sortOrder)}>
              <option value="recent">Mais recentes</option><option value="oldest">Mais antigos</option><option value="name">Nome (A–Z)</option>
            </select>
          </label>
          {search || filter || kindFilter ? <Button variant="outline" size="sm" className="min-h-10" onClick={() => { setSearch(""); setFilter(""); setKindFilter(""); }}>Limpar filtros</Button> : null}
        </div>
        <div role="group" aria-label="Visualização dos projetos" className="flex rounded-lg border border-border p-1">
          <button type="button" aria-label="Exibir em cards" aria-pressed={view === "cards"} onClick={() => setView("cards")} className={`inline-flex size-9 items-center justify-center rounded-md ${view === "cards" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}><LayoutGrid className="size-4" /></button>
          <button type="button" aria-label="Exibir em lista" aria-pressed={view === "list"} onClick={() => setView("list")} className={`inline-flex size-9 items-center justify-center rounded-md ${view === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}><List className="size-4" /></button>
        </div>
      </div>
    </div> : null}
    {projects.some(p => p.client_name) ? <label className="block text-sm">Filtrar por cliente<select className="mt-1 block min-h-11 w-full rounded border bg-background p-2 sm:max-w-sm" value={filter} onChange={e => setFilter(e.target.value)}><option value="">Todos os clientes</option>{[...new Set(projects.map(p => p.client_name).filter(Boolean))].sort().map(name => <option key={name}>{name}</option>)}</select></label> : null}
    {loadingProjects ? <p role="status" className="text-sm">Carregando seus projetos...</p> : null}
    {loadError ? <div role="alert" className="space-y-2 text-sm"><p>{loadError}</p><Button variant="outline" disabled={loadingProjects} onClick={() => { setLoadingProjects(true); setRetry(value => value + 1); }}>Tentar carregar projetos novamente</Button></div> : null}
    {userId && (message || accessError) ? <p role="status" className="text-sm">{accessError || message}</p> : null}
    {opening ? resumeProjectId ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="resume-project-title" className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-6">
        <h2 id="resume-project-title" className="text-xl font-semibold">Continuar projeto salvo?</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Você vai abrir “{opening.title}”. Isso substituirá o conteúdo que estiver preenchido nesta ferramenta. Salve seu trabalho atual antes de continuar.</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => { setOpening(null); setResumeProjectId(null); }}>Manter conteúdo atual</Button>
          <Button disabled={busy} onClick={() => void open(opening)}>{busy ? "Carregando..." : "Continuar projeto"}</Button>
        </div>
      </div>
    </div> : <div className="rounded border p-3"><p className="text-sm">Abrir “{opening.title}” substituirá o conteúdo atual da ferramenta. Salve o trabalho atual antes de continuar.</p><div className="mt-2 flex gap-2"><Button onClick={() => void open(opening)}>Abrir projeto</Button><Button variant="outline" onClick={() => setOpening(null)}>Cancelar</Button></div></div> : null}
    {kind ? (
    <div className="space-y-2">{visible.map(project => <article key={project.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3"><div className="min-w-0 max-w-full"><h3 className="break-words font-medium">{project.title}</h3><p className="text-xs text-muted-foreground">{labels[project.kind]}{project.client_name ? ` · ${project.client_name}` : ""} · {new Date(project.updated_at).toLocaleDateString("pt-BR")}</p></div><div className="flex flex-wrap gap-2 [&_a]:min-h-11 [&_button]:min-h-11">{onLoad ? <Button size="sm" variant="outline" onClick={() => setOpening(project)}>Abrir</Button> : <Button asChild size="sm" variant="outline"><Link href={routes[project.kind]}>Abrir ferramenta</Link></Button>}<Button size="sm" variant="outline" onClick={() => download(project)}>Exportar JSON</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirmDelete(project.id)}>Excluir</Button>{confirmDelete === project.id ? <><span className="text-sm">Excluir este projeto salvo?</span><Button size="sm" variant="destructive" disabled={busy} onClick={() => remove(project.id)}>Confirmar exclusão</Button><Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button></> : null}</div></article>)}</div>
    ) : (
    <div data-project-view={view} className={view === "list" ? "space-y-3" : "grid gap-3 sm:grid-cols-2"}>{visible.map(project => <article key={project.id} className={`flex min-w-0 gap-3 rounded-xl border border-border bg-background/40 p-4 transition-colors hover:border-primary/30 ${view === "list" ? "flex-col sm:flex-row sm:items-center sm:justify-between" : "flex-col"}`}>
      <div className="min-w-0 max-w-full">
        <span className="mb-2 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"><FolderOpen className="size-3" />{labels[project.kind]}</span>
        <h3 className="break-words font-semibold">{project.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{project.client_name ? `${project.client_name} · ` : ""}Atualizado em {new Date(project.updated_at).toLocaleDateString("pt-BR")}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-start">
        {onLoad ? <Button size="sm" variant="outline" onClick={() => setOpening(project)}>Abrir</Button> : <Button asChild size="sm" variant="outline"><Link href={resumableKinds.has(project.kind) ? `${routes[project.kind]}?project=${encodeURIComponent(project.id)}` : routes[project.kind]}>{resumableKinds.has(project.kind) ? "Continuar projeto" : "Abrir ferramenta"} <ArrowRight className="size-4" /></Link></Button>}
        <details className="group relative">
          <summary aria-label={`Mais ações para ${project.title}`} className="flex min-h-10 min-w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </summary>
          <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border border-border bg-card p-1 shadow-lg">
            <button type="button" onClick={() => download(project)} className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-sm hover:bg-accent">Exportar JSON</button>
            <button type="button" disabled={busy} onClick={() => setConfirmDelete(project.id)} className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-sm hover:bg-accent disabled:opacity-50">Excluir</button>
          </div>
        </details>
        {confirmDelete === project.id ? <div className="flex w-full flex-wrap items-center gap-2 rounded-lg border border-destructive/30 p-2"><span className="text-sm">Excluir este projeto salvo?</span><Button size="sm" variant="destructive" disabled={busy} onClick={() => remove(project.id)}>Confirmar exclusão</Button><Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button></div> : null}
      </div>
    </article>)}</div>
    )}
    {userId && !loadingProjects && !loadError && !accessError && !visible.length && (kind || search || filter || kindFilter) ? <p role="status" className="text-sm text-muted-foreground">{search || filter || kindFilter ? "Nenhum projeto encontrado. Tente outro nome ou limpe os filtros." : kind ? "Você ainda não tem projetos salvos nesta ferramenta. Dê um nome ao projeto e use Salvar na conta." : ""}</p> : null}

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
    {!kind ? <div className="space-y-3">
      {showInstagramHighlight ? <h3 className="text-sm font-medium">Criar um novo projeto</h3> : null}
      <details open={Boolean(kind)} className="rounded-xl border border-border p-3">
        <summary className="cursor-pointer text-sm font-semibold text-primary">Criar projetos com outras ferramentas</summary>
      <nav aria-label="Ferramentas com projetos salvos" className="mt-3 space-y-4">
        {([
          { heading: "Social Media", tools: ["post_creator", "calendar", "briefing", "social_report", "preview_post", "engagement", "post_analysis", "trend_radar"] },
          { heading: "Marketing e performance", tools: ["roas", "roi", "margin", "markup"] },
          { heading: "Texto", tools: ["proofreader"] },
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
      </details>
    </div> : userId ? <Link className="inline-flex min-h-11 items-center text-sm text-primary underline" href="/conta/projetos">Ver todos os meus projetos no painel</Link> : null}
  </section>;
}
