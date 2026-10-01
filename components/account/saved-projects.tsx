"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getStoredSession } from "@/lib/user-auth";
import { useAccountAccess, type AccountAccess } from "@/lib/billing/access-client";
import { projectLimits } from "@/lib/billing/plan-benefits";
import type { SavedProject } from "@/lib/projects/validation";

type Props = { kind?: SavedProject["kind"]; payload?: unknown; onLoad?: (payload: unknown) => void };
const routes = { calendar: "/ferramentas/calendario-editorial-redes-sociais", briefing: "/ferramentas/planejador-de-conteudo-social-media", qr_code: "/ferramentas/gerador-de-qr-code", watermark: "/ferramentas/adicionar-marca-dagua", social_report: "/ferramentas/gerador-de-relatorio-social-media" };
const labels = { calendar: "Calendário", briefing: "Briefing", qr_code: "QR Code", watermark: "Marca d’água", social_report: "Relatório Social Media" };
async function requestProjects(method = "GET", body?: unknown, id?: string) {
  const token = getStoredSession()?.access_token;
  if (!token) throw new Error("Entre na sua conta para continuar.");
  const response = await fetch(`/api/account/projects${id ? `?id=${encodeURIComponent(id)}` : ""}`, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Não foi possível acessar seus projetos.");
  return data as { projects: SavedProject[]; project: SavedProject };
}
export function SavedProjects({ kind, payload, onLoad }: Props) {
  const { access, error: accessError } = useAccountAccess();
  return <ProjectLibrary key={access?.userId ?? "guest"} kind={kind} payload={payload} onLoad={onLoad} access={access} accessError={accessError} />;
}
function ProjectLibrary({ kind, payload, onLoad, access, accessError }: Props & { access: AccountAccess | null; accessError: string }) {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [selected, setSelected] = useState<SavedProject | null>(null);
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [opening, setOpening] = useState<SavedProject | null>(null);
  const plan = access?.plan ?? "free";
  const userId = access?.userId;
  useEffect(() => {
    let active = true;
    if (!userId) return;
    requestProjects().then(data => { if (active) setProjects(data.projects); }).catch(err => { if (active) setMessage(err.message); });
    return () => { active = false; };
  }, [userId]);
  const visible = projects.filter(p => (!kind || p.kind === kind) && (!filter || p.client_name === filter));
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
    <div><h2 className="text-xl font-semibold">Meus projetos</h2><p className="mt-2 text-sm text-muted-foreground">{plan === "free" ? "Pro e Agency permitem salvar projetos na conta. Projetos anteriores continuam disponíveis para abrir, exportar ou excluir." : `${projects.length}/${projectLimits[plan]} projetos salvos. Salve na conta para continuar em outro dispositivo.`}</p></div>
    {!userId ? <Link className="text-primary underline" href="/conta/login?next=/conta">Entrar na minha conta</Link> : null}
    {kind && plan !== "free" ? <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Nome do projeto<input className="mt-1 block w-full rounded border bg-background p-2" maxLength={120} value={title} onChange={e => setTitle(e.target.value)} /></label>{plan === "agency" ? <label className="text-sm">Cliente (opcional)<input className="mt-1 block w-full rounded border bg-background p-2" maxLength={100} value={client} onChange={e => setClient(e.target.value)} /><span className="text-xs text-muted-foreground">Até 20 nomes de clientes em seus projetos.</span></label> : null}<div className="flex flex-wrap gap-2 sm:col-span-2"><Button disabled={busy || !title.trim() || !!accessError || (plan === "pro" && !!selected?.client_name)} onClick={() => save(false)}>Salvar na conta</Button><Button variant="outline" disabled={busy || !title.trim() || !!accessError} onClick={() => save(true)}>Salvar como novo projeto</Button></div></div> : null}
    <div className="flex flex-wrap gap-3 text-sm"><Link className="text-primary underline" href={routes.calendar}>Abrir calendário</Link><Link className="text-primary underline" href={routes.briefing}>Abrir planejador</Link><Link className="text-primary underline" href={routes.qr_code}>QR Code</Link><Link className="text-primary underline" href={routes.watermark}>Marca d’água</Link><Link className="text-primary underline" href={routes.social_report}>Relatório Social Media</Link>{plan === "free" ? <Link className="text-primary underline" href="/planos">Conhecer planos</Link> : null}</div>
    {projects.some(p => p.client_name) ? <label className="block text-sm">Filtrar por cliente<select className="ml-2 rounded border bg-background p-2" value={filter} onChange={e => setFilter(e.target.value)}><option value="">Todos os clientes</option>{[...new Set(projects.map(p => p.client_name).filter(Boolean))].sort().map(name => <option key={name}>{name}</option>)}</select></label> : null}
    {message || accessError ? <p role="status" className="text-sm">{accessError || message}</p> : null}
    {opening ? <div className="rounded border p-3"><p className="text-sm">Abrir “{opening.title}” substituirá o conteúdo atual da ferramenta. Salve o trabalho atual antes de continuar.</p><div className="mt-2 flex gap-2"><Button onClick={() => open(opening)}>Abrir projeto</Button><Button variant="outline" onClick={() => setOpening(null)}>Cancelar</Button></div></div> : null}
    <div className="space-y-2">{visible.map(project => <article key={project.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3"><div><h3 className="font-medium">{project.title}</h3><p className="text-xs text-muted-foreground">{labels[project.kind]}{project.client_name ? ` · ${project.client_name}` : ""} · {new Date(project.updated_at).toLocaleDateString("pt-BR")}</p></div><div className="flex flex-wrap gap-2">{onLoad ? <Button size="sm" variant="outline" onClick={() => setOpening(project)}>Abrir</Button> : <Button asChild size="sm" variant="outline"><Link href={routes[project.kind]}>Abrir ferramenta</Link></Button>}<Button size="sm" variant="outline" onClick={() => download(project)}>Exportar JSON</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirmDelete(project.id)}>Excluir</Button>{confirmDelete === project.id ? <><span className="text-sm">Excluir este projeto salvo?</span><Button size="sm" variant="destructive" disabled={busy} onClick={() => remove(project.id)}>Confirmar exclusão</Button><Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button></> : null}</div></article>)}</div>
    {userId && !visible.length ? <p className="text-sm text-muted-foreground">Nenhum projeto salvo nesta seleção.</p> : null}
  </section>;
}
