"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Download, Monitor, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AiCreditBalance } from "@/components/tools/ai-credit-balance";
import { getStoredSession } from "@/lib/user-auth";
import { actions, aiResultSchema, parseReport, summarize, type TvReport, type TvAiResult } from "@/lib/kivai-connect/report";

const HISTORY_KEY = "kivai:connect:history:v1";
const bytes = (n: number | null) => n === null ? "Não disponível" : `${(n / 1024 ** 3).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} GB`;
export default function ConnectClient() {
  const [token, setToken] = useState("");
  const [report, setReport] = useState<TvReport | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const [goal, setGoal] = useState("entender");
  const [result, setResult] = useState<TvAiResult | null>(null);
  const [history, setHistory] = useState<TvReport[]>([]);
  const lock = useRef(false);
  const upload = useRef<HTMLInputElement>(null);
  const summary = report ? summarize(report) : null;
  function accept(raw: string) { const parsed = parseReport(raw); setReport(parsed); setResult(null); setConsent(false); setError(""); setNotice("Relatório carregado. Nenhuma alteração foi executada na TV."); }
  async function connect() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("http://127.0.0.1:47831/report", { headers: { Authorization: `Bearer ${token.trim()}` }, signal: AbortSignal.timeout(8000), cache: "no-store", credentials: "omit", redirect: "error" });
      if (!response.ok) throw Error("O auxiliar recusou a sessão.");
      accept(await response.text()); setToken("");
    } catch { setError("Não foi possível ler o auxiliar. Confira se ele está aberto e o código está correto. Autorize o acesso à rede local se o navegador solicitar. Como alternativa, importe o arquivo kivai-tv.json indicado pelo auxiliar."); }
    finally { lock.current = false; setBusy(false); }
  }
  async function importFile(file?: File) {
    if (!file || lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try { if (file.size > 600_000) throw Error("O relatório excede 600 KB."); accept(await file.text()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Arquivo inválido."); }
    finally { if (upload.current) upload.current.value = ""; lock.current = false; setBusy(false); }
  }
  function storedReports(): TvReport[] {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    if (raw.length > 3_100_000) throw Error("Histórico inválido. Use Apagar histórico para removê-lo.");
    const entries: unknown = JSON.parse(raw);
    if (!Array.isArray(entries) || entries.length > 5) throw Error("Histórico inválido.");
    return entries.map(entry => parseReport(JSON.stringify(entry)));
  }
  function loadHistory() { try { const entries = storedReports(); setHistory(entries); setNotice(entries.length ? "Histórico deste navegador carregado." : "Nenhum relatório salvo neste navegador."); } catch { setError("Não foi possível ler o histórico local. Você pode apagá-lo abaixo."); } }
  function save() {
    if (!report) return;
    try { const entries = [report, ...storedReports().filter(item => item.collectedAt !== report.collectedAt)].slice(0, 5); localStorage.setItem(HISTORY_KEY, JSON.stringify(entries)); setHistory(entries); setNotice("Relatório salvo somente neste navegador. Inclui a lista de pacotes. Até cinco relatórios são mantidos."); }
    catch { setError("Não foi possível salvar neste navegador."); }
  }
  function download() {
    if (!report) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "kivai-tv.json"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function analyze() {
    if (!summary || !consent || lock.current) return;
    const session = getStoredSession(); if (!session?.access_token) { setError("Entre na sua conta para usar seus créditos."); return; }
    lock.current = true; setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/ai/kivai-connect", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ summary, goal, consent }) });
      const payload = await response.json(); if (!response.ok) throw Error(payload.error || "Falha na análise.");
      setResult(aiResultSchema.parse(payload.result));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível analisar."); }
    finally { lock.current = false; setBusy(false); window.dispatchEvent(new Event("kivai:ai-credit-update")); }
  }
  return <div className="space-y-6">
    <div className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm"><ShieldCheck className="mt-1 size-5 shrink-0 text-primary" /><p><strong>Beta · somente leitura.</strong> A conexão acontece no auxiliar Windows, com autorização na TV. Esta página recebe o diagnóstico; não executa alterações no dispositivo.</p></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Monitor className="size-5 text-primary" />1. Conectar minha TV</CardTitle></CardHeader><CardContent className="space-y-5">
      <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-muted-foreground"><li>Baixe e extraia o auxiliar Windows. Coloque os <a className="text-primary underline" href="https://developer.android.com/tools/releases/platform-tools" target="_blank" rel="noopener noreferrer">Android Platform Tools oficiais</a> na pasta indicada no guia.</li><li>Na TV compatível, habilite a depuração sem fio e escolha parear por código. Informe IP, portas e código apenas no auxiliar.</li><li>Autorize a coleta no auxiliar. Cole aqui o código de sessão que ele mostrar ou importe o relatório gerado.</li></ol>
      <Button asChild variant="outline"><a href="/downloads/kivai-connect-windows.zip" download><Download className="mr-2 size-4" />Baixar auxiliar Windows · beta</a></Button>
      <p className="text-xs leading-5 text-muted-foreground">Windows com .NET Framework 4.5 ou superior. Auxiliar sem assinatura digital e ainda sem homologação física por modelo. Se o sistema bloquear, não desative proteções. Android TV/Google TV com pareamento sem fio; não atende Tizen ou webOS.</p>
      <form onSubmit={e => { e.preventDefault(); void connect(); }} className="space-y-3"><label htmlFor="connect-token" className="text-sm font-medium">Código de sessão do auxiliar</label><Input id="connect-token" type="password" autoComplete="off" value={token} onChange={e => setToken(e.target.value)} maxLength={64} placeholder="Cole os 64 caracteres mostrados no computador" disabled={busy} /><Button type="submit" disabled={busy || !/^[a-f0-9]{64}$/.test(token.trim())}>{busy ? "Aguarde…" : "Ler diagnóstico do auxiliar"}</Button></form>
      <div className="border-t border-border pt-4"><label htmlFor="connect-file" className="mb-2 flex items-center gap-2 text-sm font-medium"><Upload className="size-4" />Alternativa: importar relatório local</label><input ref={upload} id="connect-file" type="file" accept=".json,application/json" disabled={busy} onChange={e => void importFile(e.target.files?.[0])} className="block w-full min-w-0 text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-2 file:text-foreground" /><p className="mt-2 text-xs text-muted-foreground">Somente kivai-tv.json gerado pelo auxiliar, até 600 KB. O arquivo não é enviado ao servidor.</p></div>
    </CardContent></Card>
    {report && summary && <>
      <Card><CardHeader><CardTitle>2. Diagnóstico de {report.model}</CardTitle></CardHeader><CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">{report.manufacturer} · Android {report.androidVersion} · API {report.sdk} · Coleta: {new Date(report.collectedAt).toLocaleString("pt-BR")}</p>
        <div className="grid gap-4 sm:grid-cols-3">{[["Armazenamento disponível", bytes(summary.storageAvailable)], ["Armazenamento total", bytes(summary.storageTotal)], ["Memória total", bytes(summary.memoryTotal)]].map(([label, value]) => <div key={label} className="rounded-lg border border-border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>)}</div>
        <p className="text-sm text-muted-foreground">Memória disponível na coleta: {bytes(summary.memoryAvailable)}. Memória ocupada não indica, sozinha, lentidão. Histórico de uso dos aplicativos: não disponível.</p>
        {report.warnings.length > 0 && <p role="status" className="text-sm">Algumas consultas não responderam. As métricas ausentes não devem ser interpretadas como zero.</p>}
        <details><summary className="cursor-pointer text-sm font-medium">Ver {summary.appCount} pacotes instalados</summary><ul className="mt-3 max-h-64 space-y-1 overflow-auto text-xs">{[...new Set(report.apps)].sort().map(app => <li key={app} className="break-all">{app}</li>)}</ul></details>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={download}>Baixar relatório</Button><Button variant="outline" onClick={save}>Salvar neste navegador</Button><Button variant="ghost" disabled={busy} onClick={() => {setReport(null);setResult(null);setConsent(false);setNotice("Relatório removido da sessão. Arquivos baixados e histórico salvo permanecem até você excluí-los.");}}>Limpar sessão</Button></div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>3. Escolher melhorias</CardTitle></CardHeader><CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">Você pode seguir as orientações básicas gratuitamente ou usar a IA para priorizá-las conforme o resumo do diagnóstico. Nenhuma opção altera sua TV.</p>
        <details><summary className="cursor-pointer font-medium">Orientações gratuitas</summary><div className="mt-4 space-y-4">{Object.values(actions).map(action => <div key={action.title}><h3 className="font-medium">{action.title}</h3><p className="mt-1 text-sm text-muted-foreground">{action.text}</p></div>)}</div></details>
        <label htmlFor="connect-goal" className="block text-sm font-medium">Meu objetivo</label><select id="connect-goal" value={goal} disabled={busy} onChange={e => {setGoal(e.target.value);setResult(null);}} className="w-full rounded-md border border-input bg-background p-3"><option value="entender">Entender o dispositivo</option><option value="armazenamento">Revisar espaço disponível</option><option value="lentidao">Investigar lentidão</option></select>
        <AiCreditBalance />
        <details><summary className="cursor-pointer text-sm">Revisar os dados que serão enviados à IA</summary><pre className="mt-3 overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted/30 p-3 text-xs">{JSON.stringify({ ...summary, goal }, null, 2)}</pre></details>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={consent} disabled={busy} onChange={e => setConsent(e.target.checked)} className="mt-1" /><span>Autorizo enviar este resumo ao Kivai e ao provedor de IA. Entendo o custo de 1 crédito por análise concluída. A lista de pacotes e os códigos de conexão não serão enviados.</span></label>
        <div className="flex flex-wrap items-center gap-3"><Button disabled={busy || !consent} onClick={() => void analyze()}><Sparkles className="mr-2 size-4" />{busy ? "Aguarde…" : "Priorizar com IA · 1 crédito"}</Button><Link className="text-sm text-primary underline" href="/conta/login?next=%2Fferramentas%2Fkivai-connect">Entrar na conta</Link></div>
      </CardContent></Card>
      {result && <Card><CardHeader><CardTitle>4. Revisar orientações</CardTitle></CardHeader><CardContent><ol className="list-decimal space-y-4 pl-5">{result.actions.map(id => <li key={id}><h3 className="font-medium">{actions[id].title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{actions[id].text}</p></li>)}</ol><p className="mt-5 text-sm text-muted-foreground">A IA priorizou orientações permitidas, sem confirmar causas ou garantir melhorias. Realize apenas ações que você entende nas configurações da TV. Para verificar depois, gere e importe um novo diagnóstico.</p></CardContent></Card>}
    </>}
    <Card><CardHeader><CardTitle>Histórico local</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">Opcional, limitado a cinco relatórios neste navegador. Em computadores compartilhados, prefira não salvar.</p><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={loadHistory}>Abrir histórico</Button><Button variant="ghost" onClick={() => {try {localStorage.removeItem(HISTORY_KEY);setHistory([]);setNotice("Histórico deste navegador apagado.");} catch {setError("Não foi possível apagar o histórico.");}}}>Apagar histórico</Button></div>{history.map(item => <Button key={item.collectedAt} variant="outline" className="h-auto whitespace-normal text-left" disabled={busy} onClick={() => accept(JSON.stringify(item))}>{item.model} · {new Date(item.collectedAt).toLocaleString("pt-BR")}</Button>)}</CardContent></Card>
    {error && <p role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
  </div>;
}
