"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Clipboard, ExternalLink, FilePenLine, MessageSquareText, RotateCcw, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoredSession } from "@/lib/user-auth";
import type { ApprovalDraft, ApprovalRecord, ApprovalStatus, ApprovalVersion } from "@/lib/agency/approval-schema";

const initial: ApprovalDraft = { clientName: "", title: "", platform: "Instagram", caption: "", mediaDataUrl: "" };
const statusNames: Record<ApprovalStatus, string> = { pending: "Aguardando aprovação", approved: "Aprovado", changes_requested: "Ajustes solicitados", revoked: "Revogado" };

async function resizeImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) throw Error("Use JPG, PNG ou WebP com até 10 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    let max = 1000;
    for (let attempt = 0; attempt < 5; attempt++) {
      const ratio = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
      canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
      const context = canvas.getContext("2d");
      if (!context) throw Error("Não foi possível processar a imagem neste navegador.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const result = canvas.toDataURL("image/jpeg", attempt > 1 ? 0.47 : 0.67);
      if (result.length <= 215000) return result;
      max = Math.round(max * 0.72);
    }
    throw Error("Imagem muito detalhada. Selecione uma versão menor.");
  } finally { bitmap.close(); }
}
async function api(method: "GET" | "POST" | "PATCH", body?: unknown) {
  const token = getStoredSession()?.access_token;
  if (!token) throw Error("Faça login novamente para gerenciar aprovações.");
  const response = await fetch("/api/agency/approvals", {
    method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store",
  });
  const data = await response.json() as { approvals?: ApprovalRecord[]; approval?: ApprovalRecord; error?: string };
  if (!response.ok) throw Error(data.error || "Não foi possível concluir a operação.");
  return data;
}
export function AgencyApprovals() {
  const [items, setItems] = useState<ApprovalRecord[]>([]);
  const [draft, setDraft] = useState<ApprovalDraft>(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [versions, setVersions] = useState<Record<string, ApprovalVersion[]>>({});
  const [versionLoading, setVersionLoading] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void api("GET").then(data => { if (active) setItems(data.approvals ?? []); })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar."); })
      .finally(() => { if (active) setLoading(false); });
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      void api("GET").then(data => { if (active) setItems(data.approvals ?? []); }).catch(() => { /* Manual refresh remains available */ });
    };
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);

  function reset() { setDraft(initial); setEditing(null); setError(""); setMessage(""); }
  function loadForRevision(row: ApprovalRecord) {
    setDraft({ clientName: row.clientName, title: row.title, platform: row.platform, caption: row.caption, mediaDataUrl: row.mediaDataUrl });
    setEditing(row.id); setError(""); setMessage("Edite o conteúdo e envie uma nova versão. O link anterior deixará de funcionar.");
    document.getElementById("agency-approval-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = editing ? await api("PATCH", { id: editing, action: "resubmit", draft }) : await api("POST", draft);
      const created = response.approval;
      if (!created) throw Error("Nenhuma solicitação foi retornada.");
      setItems(previous => [created, ...previous.filter(item => item.id !== created.id)]);
      setDraft(initial); setEditing(null);
      setMessage("Solicitação salva! Copie o link abaixo e envie ao cliente.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao salvar."); }
    finally { setBusy(false); }
  }
  async function revoke(row: ApprovalRecord) {
    if (busy || !window.confirm("Revogar este link? O cliente não poderá mais aprovar esta versão.")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await api("PATCH", { id: row.id, action: "revoke" });
      if (result.approval) setItems(previous => previous.map(item => item.id === row.id ? result.approval! : item));
      setMessage("Link revogado.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao revogar."); }
    finally { setBusy(false); }
  }
  async function loadVersions(id: string) {
    setVersionLoading(id); setError("");
    try {
      const token = getStoredSession()?.access_token;
      if (!token) throw Error("Faça login novamente.");
      const response = await fetch(`/api/agency/approvals?versions=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const data = await response.json() as { versions?: ApprovalVersion[]; error?: string };
      if (!response.ok) throw Error(data.error || "Não foi possível carregar as versões.");
      setVersions(previous => ({ ...previous, [id]: data.versions ?? [] }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao carregar versões."); }
    finally { setVersionLoading(null); }
  }
  async function copy(link: string) {
    try { await navigator.clipboard.writeText(link); setMessage("Link de aprovação copiado."); }
    catch { setError("Não foi possível copiar. Abra o link para compartilhá-lo manualmente."); }
  }
  const uniqueClients = [...new Set(items.map(item => item.clientName))].sort((a,b) => a.localeCompare(b,"pt-BR"));
  return <section id="agency-aprovacoes" className="scroll-mt-28 space-y-5 rounded-2xl border border-primary/25 bg-card p-5 sm:p-6">
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">Kivai Aprova · Exclusivo Agency</h2>
      <p className="text-sm leading-6 text-muted-foreground">Envie artes e legendas para aprovação. Seu cliente recebe um link privado, não precisa fazer cadastro e pode aprovar ou solicitar ajustes. Cada versão fica registrada.</p>
      <p className="text-xs text-muted-foreground">O link expira em 7 dias e pode ser revogado. Qualquer pessoa que tenha o link pode responder: envie somente ao responsável pelo cliente. Não há verificação de identidade por e-mail nesta versão.</p>
    </div>
    <form id="agency-approval-editor" onSubmit={save} className="scroll-mt-28 space-y-4 rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">{editing ? "Nova versão para aprovação" : "Criar solicitação de aprovação"}</h3>{editing ? <Button type="button" variant="outline" size="sm" onClick={reset}><RotateCcw className="mr-2 size-4" /> Cancelar edição</Button> : null}</div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Cliente<input list="agency-client-options" required minLength={2} maxLength={100} value={draft.clientName} onChange={e => setDraft(prev => ({ ...prev, clientName: e.target.value }))} placeholder="Nome da empresa ou cliente" className="mt-2 min-h-11 w-full rounded-md border border-input bg-background p-3" /><datalist id="agency-client-options">{uniqueClients.map(name => <option key={name} value={name} />)}</datalist></label>
        <label className="text-sm font-medium">Rede social<select value={draft.platform} onChange={e => setDraft(prev => ({ ...prev, platform: e.target.value as ApprovalDraft["platform"] }))} className="mt-2 min-h-11 w-full rounded-md border border-input bg-background p-3">{(["Instagram","Facebook","TikTok","YouTube","LinkedIn","X","Threads","Outra"] as const).map(value => <option key={value}>{value}</option>)}</select></label>
      </div>
      <label className="block text-sm font-medium">Nome da publicação<input required minLength={3} maxLength={160} value={draft.title} onChange={e => setDraft(prev => ({ ...prev, title: e.target.value }))} placeholder="Ex.: Campanha de novembro" className="mt-2 min-h-11 w-full rounded-md border border-input bg-background p-3" /></label>
      <label className="block text-sm font-medium">Legenda<textarea rows={5} maxLength={8000} value={draft.caption} onChange={e => setDraft(prev => ({ ...prev, caption: e.target.value }))} placeholder="Legenda que será apresentada ao cliente..." className="mt-2 w-full rounded-md border border-input bg-background p-3" /></label>
      <div className="space-y-2">
        <label htmlFor="agency-art-upload" className="block text-sm font-medium">Arte da publicação (opcional)</label>
        <input id="agency-art-upload" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm" onChange={async event => {
          const input = event.currentTarget;
          const file = input.files?.[0]; if (!file) return;
          setError("");
          try { const mediaDataUrl = await resizeImage(file); setDraft(prev => ({ ...prev, mediaDataUrl })); }
          catch (cause) { setError(cause instanceof Error ? cause.message : "Imagem inválida."); }
          input.value = "";
        }} />
        <p className="text-xs text-muted-foreground">Aceita JPG, PNG e WebP (até 10 MB). Uma imagem otimizada é armazenada para revisão; arquivos originais não são enviados.</p>
        {draft.mediaDataUrl ? <div className="space-y-2"><Image src={draft.mediaDataUrl} alt="Prévia da arte" unoptimized width={500} height={500} className="max-h-64 w-auto max-w-full rounded-md border object-contain" /><Button variant="outline" type="button" size="sm" onClick={() => setDraft(prev => ({ ...prev, mediaDataUrl: "" }))}>Remover imagem</Button></div> : null}
      </div>
      <Button type="submit" disabled={busy || !draft.clientName.trim() || !draft.title.trim() || (!draft.caption.trim() && !draft.mediaDataUrl)}><FilePenLine className="mr-2 size-4" />{busy ? "Salvando..." : editing ? "Enviar nova versão" : "Criar link para aprovação"}</Button>
    </form>
    {message ? <p role="status" className="text-sm text-primary">{message}</p> : null}
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Solicitações enviadas ({items.length})</h3><Button variant="outline" size="sm" onClick={() => { setLoading(true); void api("GET").then(data => { setItems(data.approvals ?? []); setError(""); }).catch(e => setError(String(e))).finally(() => setLoading(false)); }}>Atualizar</Button></div>
      {loading ? <p className="text-sm text-muted-foreground">Carregando aprovações...</p> : items.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma aprovação cadastrada. Crie a primeira solicitação acima.</p> : null}
      <div className="space-y-3">{items.map(row => {
        const live = row.status === "pending" && new Date(row.expiresAt).getTime() > Date.now();
        return <article key={row.id} className="space-y-3 rounded-lg border border-border p-4">
          <div className="flex flex-wrap justify-between gap-2"><div><h4 className="font-semibold">{row.title}</h4><p className="mt-1 text-xs text-muted-foreground">{row.clientName} · {row.platform} · Versão {row.version}</p></div><span className="text-xs font-medium text-primary">{row.status === "pending" && !live ? "Link expirado" : statusNames[row.status]}</span></div>
          {row.feedback ? <p className="rounded-md bg-muted/30 p-3 text-sm"><MessageSquareText className="mr-2 inline size-4" />{row.reviewerName}: {row.feedback}</p> : row.reviewerName ? <p className="text-sm text-muted-foreground"><CheckCircle2 className="mr-2 inline size-4" />Respondido por: {row.reviewerName}</p> : null}
          <div className="flex flex-wrap gap-2">
            {live && row.link ? <><Button variant="outline" size="sm" onClick={() => void copy(row.link!)}><Clipboard className="mr-2 size-4" />Copiar link</Button><Button asChild variant="outline" size="sm"><a href={row.link} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 size-4" />Visualizar</a></Button><Button asChild variant="outline" size="sm"><a href={`https://wa.me/?text=${encodeURIComponent("Olá! Revise e aprove o conteúdo da publicação: " + row.link)}`} target="_blank" rel="noopener noreferrer">Enviar por WhatsApp</a></Button><Button asChild variant="outline" size="sm"><a href={`mailto:?subject=${encodeURIComponent("Aprovação de publicação — " + row.title)}&body=${encodeURIComponent("Olá! Por favor, revise o conteúdo e registre sua aprovação ou ajustes no link: " + row.link)}`}>Enviar por e-mail</a></Button></> : null}
            {row.status !== "revoked" ? <Button variant="outline" size="sm" disabled={busy} onClick={() => loadForRevision(row)}><FilePenLine className="mr-2 size-4" />Nova versão</Button> : null}
            {row.status === "pending" ? <Button variant="outline" size="sm" disabled={busy} onClick={() => void revoke(row)}><ShieldX className="mr-2 size-4" />Revogar</Button> : null}
          </div>
          <div className="space-y-2">
            <Button variant="outline" size="sm" type="button" disabled={versionLoading === row.id} onClick={() => void loadVersions(row.id)}>
              {versionLoading === row.id ? "Carregando versões..." : "Visualizar versões salvas"}
            </Button>
            {versions[row.id] ? <div className="space-y-3">{versions[row.id].map(version => <div key={version.version} className="rounded-md bg-muted/20 p-3 text-sm">
              <p className="font-semibold">Versão {version.version} · {new Date(version.createdAt).toLocaleString("pt-BR")}</p>
              <p className="mt-1">{version.title} · {version.platform}</p>
              {version.caption ? <p className="mt-2 whitespace-pre-wrap break-words text-muted-foreground">{version.caption}</p> : null}
              {version.mediaDataUrl ? <Image src={version.mediaDataUrl} unoptimized width={400} height={400} alt={`Arte da versão ${version.version}`} className="mt-2 max-h-56 w-auto max-w-full rounded-md object-contain" /> : null}
            </div>)}</div> : null}
          </div>
          <details className="text-sm"><summary className="cursor-pointer text-muted-foreground">Histórico de ações e decisões</summary><ul className="mt-2 space-y-2">{row.history.map((event,index) => <li key={index} className="rounded-md bg-muted/20 p-2">{new Date(event.at).toLocaleString("pt-BR")} · Versão {event.version} · {event.actor} · {statusNames[event.action as ApprovalStatus] ?? (event.action === "resubmitted" ? "Nova versão" : "Solicitação criada")}{event.comment ? ` — ${event.comment}` : ""}</li>)}</ul></details>
        </article>;
      })}</div>
    </div>
  </section>;
}
