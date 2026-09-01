"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clipboard, Copy, Download, FileBarChart, FolderOpen, Plus, Printer, Save, Trash2 } from "lucide-react";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const DRAFT_KEY = "kivai:relatorio-social-media:draft:v1";
const SAVED_KEY = "kivai:relatorios-social-media:v1";
const MAX_REPORTS = 10;
const networks = ["Instagram", "Facebook", "TikTok", "YouTube", "LinkedIn", "X", "Threads", "Pinterest", "Outra"];
const formats = ["Post estático", "Carrossel", "Vídeo", "Reels/Shorts", "Stories", "Live", "Outro"];
const steps = ["Identificação", "Métricas", "Comparação", "Destaques", "Relatório"];

type Metrics = {
  followersStart: string; followersEnd: string; newFollowers: string; lostFollowers: string;
  publications: string; staticPosts: string; carousels: string; videos: string; reels: string; stories: string; lives: string; otherContent: string;
  reach: string; impressions: string; videoViews: string; profileViews: string;
  likes: string; comments: string; shares: string; saves: string; replies: string; clicks: string; otherInteractions: string;
  linkClicks: string; profileClicks: string; siteVisits: string; contactClicks: string; otherClicks: string;
  leads: string; conversions: string; sales: string; revenue: string;
  investment: string; paidImpressions: string; paidClicks: string; paidLeads: string; paidConversions: string; paidRevenue: string;
};
type Previous = { followers: string; reach: string; impressions: string; interactions: string; clicks: string; publications: string };
type Highlight = { id: string; title: string; format: string; reach: string; interactions: string; clicks: string; link: string };
type Report = {
  id: string; reportName: string; client: string; profileName: string; username: string; network: string; responsible: string;
  startDate: string; endDate: string; compare: boolean; previousStartDate: string; previousEndDate: string;
  engagementMethod: "followers" | "reach" | "impressions"; metrics: Metrics; previous: Previous;
  notes: string; nextSteps: string; highlights: Highlight[]; rankBy: "reach" | "interactions" | "rate" | "clicks";
};
type SavedReport = { updatedAt: string; report: Report };
type Calculations = { interactions: number; formatTotal: number; publications: number; followerDelta: number; followerGrowth: number | null; base: number; engagement: number | null; trafficClicks: number; ctr: number | null; paid: { cpc: number | null; cpm: number | null; cpl: number | null; cpa: number | null; roas: number | null } };

const emptyMetrics = (): Metrics => ({
  followersStart: "", followersEnd: "", newFollowers: "", lostFollowers: "", publications: "", staticPosts: "", carousels: "", videos: "", reels: "", stories: "", lives: "", otherContent: "", reach: "", impressions: "", videoViews: "", profileViews: "", likes: "", comments: "", shares: "", saves: "", replies: "", clicks: "", otherInteractions: "", linkClicks: "", profileClicks: "", siteVisits: "", contactClicks: "", otherClicks: "", leads: "", conversions: "", sales: "", revenue: "", investment: "", paidImpressions: "", paidClicks: "", paidLeads: "", paidConversions: "", paidRevenue: "",
});
const emptyPrevious = (): Previous => ({ followers: "", reach: "", impressions: "", interactions: "", clicks: "", publications: "" });
const emptyReport = (): Report => ({ id: "", reportName: "", client: "", profileName: "", username: "", network: "", responsible: "", startDate: "", endDate: "", compare: false, previousStartDate: "", previousEndDate: "", engagementMethod: "reach", metrics: emptyMetrics(), previous: emptyPrevious(), notes: "", nextSteps: "", highlights: [], rankBy: "reach" });
const interactionKeys: (keyof Metrics)[] = ["likes", "comments", "shares", "saves", "replies", "clicks", "otherInteractions"];
const contentKeys: (keyof Metrics)[] = ["staticPosts", "carousels", "videos", "reels", "stories", "lives", "otherContent"];
const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function value(input: string) { const parsed = Number(input); return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0; }
function informed(input: string) { return input.trim() !== ""; }
function cleanNumber(input: string) { if (input === "") return ""; const parsed = Number(input); return Number.isFinite(parsed) && parsed >= 0 ? input : "0"; }
function sum(metrics: Metrics, keys: (keyof Metrics)[]) { return keys.reduce((total, key) => total + value(metrics[key]), 0); }
function rate(current: number, base: number) { return base > 0 ? current / base * 100 : null; }
function percent(input: number | null, signed = false) { if (input === null || !Number.isFinite(input)) return "—"; return `${signed && input > 0 ? "+" : ""}${decimal.format(input)}%`; }
function date(input: string) { if (!input) return "Não informado"; const [year, month, day] = input.split("-"); return `${day}/${month}/${year}`; }
function labelNumber(input: string) { return informed(input) ? integer.format(value(input)) : "Não informado"; }
function makeId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function isReport(input: unknown): input is Report { return !!input && typeof input === "object" && typeof (input as Report).reportName === "string" && !!(input as Report).metrics && Array.isArray((input as Report).highlights); }
function comparison(current: number, previous: string) { if (!informed(previous)) return null; const before = value(previous); return { absolute: current - before, percentage: before > 0 ? (current - before) / before * 100 : null, before }; }

export default function RelatorioSocialMediaClient() {
  const [report, setReport] = useState<Report>(emptyReport);
  const [activeStep, setActiveStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<SavedReport[]>([]);
  const [feedback, setFeedback] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [exporting, setExporting] = useState(false);
  const [duplicateTarget, setDuplicateTarget] = useState<Report | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
      const stored = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
      // Browser-only persistence is intentionally restored after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (isReport(draft)) setReport(draft);
      if (Array.isArray(stored)) setSaved(stored.filter((item): item is SavedReport => !!item?.updatedAt && isReport(item?.report)).slice(0, MAX_REPORTS));
    } catch { localStorage.removeItem(DRAFT_KEY); localStorage.removeItem(SAVED_KEY); }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(DRAFT_KEY, JSON.stringify(report)); }, [report, ready]);

  const calculations = useMemo(() => {
    const interactions = sum(report.metrics, interactionKeys);
    const formatTotal = sum(report.metrics, contentKeys);
    const publications = informed(report.metrics.publications) ? value(report.metrics.publications) : formatTotal;
    const followerDelta = value(report.metrics.followersEnd) - value(report.metrics.followersStart);
    const followerGrowth = informed(report.metrics.followersStart) && informed(report.metrics.followersEnd) ? rate(followerDelta, value(report.metrics.followersStart)) : null;
    const base = report.engagementMethod === "followers" ? value(report.metrics.followersEnd) : report.engagementMethod === "reach" ? value(report.metrics.reach) : value(report.metrics.impressions);
    const engagement = rate(interactions, base);
    const trafficClicks = sum(report.metrics, ["linkClicks", "profileClicks", "siteVisits", "contactClicks", "otherClicks"]);
    const ctr = informed(report.metrics.impressions) ? rate(trafficClicks, value(report.metrics.impressions)) : null;
    const spend = value(report.metrics.investment);
    const paid = {
      cpc: value(report.metrics.paidClicks) > 0 ? spend / value(report.metrics.paidClicks) : null,
      cpm: value(report.metrics.paidImpressions) > 0 ? spend / value(report.metrics.paidImpressions) * 1000 : null,
      cpl: value(report.metrics.paidLeads) > 0 ? spend / value(report.metrics.paidLeads) : null,
      cpa: value(report.metrics.paidConversions) > 0 ? spend / value(report.metrics.paidConversions) : null,
      roas: spend > 0 && informed(report.metrics.paidRevenue) ? value(report.metrics.paidRevenue) / spend : null,
    };
    return { interactions, formatTotal, publications, followerDelta, followerGrowth, base, engagement, trafficClicks, ctr, paid };
  }, [report]);

  const rankedHighlights = useMemo(() => [...report.highlights].sort((a, b) => {
    const score = (item: Highlight) => report.rankBy === "rate" ? (value(item.reach) > 0 ? value(item.interactions) / value(item.reach) : 0) : value(item[report.rankBy]);
    return score(b) - score(a);
  }), [report.highlights, report.rankBy]);

  function update<K extends keyof Report>(key: K, next: Report[K]) { setReport((current) => ({ ...current, [key]: next })); if (errors[key]) setErrors((current) => ({ ...current, [key]: "" })); }
  function updateMetric(key: keyof Metrics, next: string) { setReport((current) => ({ ...current, metrics: { ...current.metrics, [key]: cleanNumber(next) } })); }
  function updatePrevious(key: keyof Previous, next: string) { setReport((current) => ({ ...current, previous: { ...current.previous, [key]: cleanNumber(next) } })); }
  function showFeedback(message: string) { setFeedback(message); window.setTimeout(() => setFeedback(""), 6000); }
  function validateReport() {
    const next: Record<string, string> = {};
    if (!report.reportName.trim()) next.reportName = "Informe um nome para o relatório.";
    if (!report.network) next.network = "Selecione a rede social.";
    if (!report.startDate) next.startDate = "Informe a data inicial.";
    if (!report.endDate) next.endDate = "Informe a data final.";
    if (report.startDate && report.endDate && report.startDate > report.endDate) next.endDate = "A data final deve ser igual ou posterior à inicial.";
    setErrors(next);
    if (Object.keys(next).length) { setActiveStep(0); return false; }
    return true;
  }
  function openReport() { if (validateReport()) { setActiveStep(4); window.setTimeout(() => reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); } }
  function saveReport() {
    if (!validateReport()) return;
    const nextReport = { ...report, id: report.id || makeId() };
    const entry = { report: nextReport, updatedAt: new Date().toISOString() };
    const nextSaved = [entry, ...saved.filter((item) => item.report.id !== nextReport.id)].slice(0, MAX_REPORTS);
    setReport(nextReport); setSaved(nextSaved); localStorage.setItem(SAVED_KEY, JSON.stringify(nextSaved)); showFeedback("Relatório salvo neste navegador.");
  }
  function loadReport(item: SavedReport) { setReport(item.report); setActiveStep(0); showFeedback("Relatório aberto."); }
  function deleteReport(id: string) { const next = saved.filter((item) => item.report.id !== id); setSaved(next); localStorage.setItem(SAVED_KEY, JSON.stringify(next)); showFeedback("Relatório excluído deste navegador."); }
  function duplicateReport(source: Report, clearMetrics: boolean) {
    const next: Report = { ...source, id: "", reportName: `${source.reportName} — cópia`, metrics: clearMetrics ? emptyMetrics() : { ...source.metrics }, previous: clearMetrics ? emptyPrevious() : { ...source.previous }, highlights: clearMetrics ? [] : source.highlights.map((item) => ({ ...item, id: makeId() })) };
    setReport(next); setDuplicateTarget(null); setActiveStep(0); showFeedback(clearMetrics ? "Estrutura duplicada com métricas limpas." : "Relatório duplicado com os dados atuais.");
  }
  function addHighlight() { if (report.highlights.length >= 6) return; update("highlights", [...report.highlights, { id: makeId(), title: "", format: "", reach: "", interactions: "", clicks: "", link: "" }]); }
  function updateHighlight(id: string, key: keyof Highlight, next: string) { update("highlights", report.highlights.map((item) => item.id === id ? { ...item, [key]: ["reach", "interactions", "clicks"].includes(key) ? cleanNumber(next) : next } : item)); }
  function removeHighlight(id: string) { update("highlights", report.highlights.filter((item) => item.id !== id)); }
  function resetReport() { setReport(emptyReport()); setActiveStep(0); setErrors({}); localStorage.removeItem(DRAFT_KEY); showFeedback("Novo relatório iniciado."); }
  async function copySummary() { try { await navigator.clipboard.writeText(summaryText(report, calculations)); showFeedback("Resumo copiado."); } catch { showFeedback("Não foi possível copiar o resumo."); } }
  async function exportPdf() {
    if (!validateReport()) return;
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const left = 15; const width = 180; let y = 18;
      const page = (needed = 14) => { if (y + needed > 282) { pdf.addPage(); y = 18; } };
      const line = (text: string, size = 10, bold = false, color: [number, number, number] = [31, 41, 55]) => { pdf.setFont("helvetica", bold ? "bold" : "normal"); pdf.setFontSize(size); pdf.setTextColor(...color); const lines = pdf.splitTextToSize(text, width); page(lines.length * 5 + 2); pdf.text(lines, left, y); y += lines.length * 5 + 2; };
      const section = (heading: string) => { page(16); y += 3; pdf.setDrawColor(104, 108, 255); pdf.setLineWidth(0.6); pdf.line(left, y, left + width, y); y += 7; line(heading, 14, true); };
      const metric = (label: string, metricValue: string) => { page(11); pdf.setFontSize(8); pdf.setTextColor(107, 114, 128); pdf.text(label.toUpperCase(), left, y); pdf.setFontSize(12); pdf.setFont("helvetica", "bold"); pdf.setTextColor(17, 24, 39); pdf.text(metricValue, left + 65, y); y += 7; };

      pdf.setTextColor(104, 108, 255); pdf.setFontSize(10); pdf.setFont("helvetica", "bold"); pdf.text("RELATÓRIO SOCIAL MEDIA", left, y); y += 9;
      line(report.reportName, 22, true); line(`${report.client || "Cliente não informado"} · ${report.network} · ${date(report.startDate)} a ${date(report.endDate)}`, 10); if (report.responsible) line(`Responsável: ${report.responsible}`, 9);
      section("Resumo do período"); line(executiveSummary(report, calculations)); objectiveInsights(report, calculations).forEach((item) => line(`• ${item}`, 9));
      section("Principais indicadores"); metric("Seguidores", labelNumber(report.metrics.followersEnd)); metric("Crescimento", percent(calculations.followerGrowth)); if (informed(report.metrics.reach)) metric("Alcance", labelNumber(report.metrics.reach)); if (informed(report.metrics.impressions)) metric("Impressões", labelNumber(report.metrics.impressions)); metric("Interações", integer.format(calculations.interactions)); metric(`Engajamento por ${report.engagementMethod === "followers" ? "seguidores" : report.engagementMethod === "reach" ? "alcance" : "impressões"}`, percent(calculations.engagement)); metric("Publicações", integer.format(calculations.publications));
      if (report.compare) { const comparable = [["Seguidores", value(report.metrics.followersEnd), report.previous.followers], ["Alcance", value(report.metrics.reach), report.previous.reach], ["Impressões", value(report.metrics.impressions), report.previous.impressions], ["Interações", calculations.interactions, report.previous.interactions]] as const; if (comparable.some(([, , previous]) => informed(previous))) { section("Comparação com período anterior"); comparable.forEach(([label, current, previous]) => { const result = comparison(current, previous); if (!result) return; line(`${label}: ${integer.format(result.before)} → ${integer.format(current)} · ${result.percentage === null ? "percentual indisponível (base anterior zero)" : percent(result.percentage, true)}`, 9); }); } }
      const chartData = [["Curtidas", report.metrics.likes], ["Comentários", report.metrics.comments], ["Compartilhamentos", report.metrics.shares], ["Salvamentos", report.metrics.saves]].filter(([, input]) => informed(input)).map(([label, input]) => ({ label, value: value(input) }));
      if (chartData.length) { section("Distribuição das interações"); const max = Math.max(...chartData.map((item) => item.value), 1); chartData.forEach((item) => { page(11); pdf.setFontSize(8); pdf.setTextColor(55, 65, 81); pdf.text(`${item.label} · ${integer.format(item.value)}`, left, y); pdf.setFillColor(229, 231, 235); pdf.rect(left, y + 2, 120, 3, "F"); pdf.setFillColor(104, 108, 255); pdf.rect(left, y + 2, 120 * item.value / max, 3, "F"); y += 10; }); }
      if (informed(report.metrics.investment)) { section("Mídia paga — indicadores complementares"); metric("CPC", calculations.paid.cpc === null ? "—" : currency.format(calculations.paid.cpc)); metric("CPM", calculations.paid.cpm === null ? "—" : currency.format(calculations.paid.cpm)); metric("CPL", calculations.paid.cpl === null ? "—" : currency.format(calculations.paid.cpl)); metric("CPA", calculations.paid.cpa === null ? "—" : currency.format(calculations.paid.cpa)); metric("ROAS", calculations.paid.roas === null ? "—" : `${decimal.format(calculations.paid.roas)}x`); }
      if (rankedHighlights.length) { section("Conteúdos de destaque"); rankedHighlights.forEach((item, index) => line(`${index + 1}. ${item.title || "Publicação sem título"} — alcance ${labelNumber(item.reach)}, interações ${labelNumber(item.interactions)}, taxa por alcance ${percent(rate(value(item.interactions), value(item.reach)))}`, 9)); }
      if (report.notes) { section("Análise e observações"); line(report.notes); } if (report.nextSteps) { section("Próximos passos"); line(report.nextSteps); }
      page(15); y += 4; line("Relatório criado com dados informados pelo usuário. O Kivai não coleta métricas automaticamente das redes sociais.", 8, false, [107, 114, 128]);
      pdf.save(fileName(report)); showFeedback("PDF baixado.");
    } catch { showFeedback("Não foi possível gerar o PDF. Use a opção Imprimir e escolha Salvar como PDF."); }
    finally { setExporting(false); }
  }

  return <ToolPageShell title="Gerador de Relatório Social Media" description="Organize métricas, compare períodos e crie um relatório visual de desempenho para redes sociais." categoryName="Social Media" categoryHref="/ferramentas/social-media" breadcrumbRootName="Início" breadcrumbRootHref="/" privacyMessage="Os dados deste relatório ficam salvos neste navegador enquanto você trabalha e não são enviados ao Kivai.">
    <style>{`@media print { @page { size:A4; margin:12mm } body * { visibility:hidden !important } [data-print-report], [data-print-report] * { visibility:visible !important } [data-print-report] { position:absolute !important; inset:0 auto auto 0 !important; width:100% !important; border:0 !important; background:#fff !important; color:#111 !important; box-shadow:none !important } [data-print-report] * { color:#111 !important; border-color:#bbb !important } [data-print-hide], [data-ad-slot] { display:none !important } [data-print-section] { break-inside:avoid; page-break-inside:avoid } }`}</style>
    <div data-print-hide className="border border-border bg-card p-3 sm:p-4">
      <ol aria-label="Etapas do relatório" className="grid grid-cols-2 gap-2 sm:grid-cols-5">{steps.map((step, index) => <li key={step}><button type="button" onClick={() => setActiveStep(index)} aria-current={activeStep === index ? "step" : undefined} className={cn("flex min-h-12 w-full items-center gap-2 border px-3 text-left text-xs font-medium transition-colors", activeStep === index ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50")}><span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-current">{index + 1}</span>{step}</button></li>)}</ol>
    </div>

    {activeStep === 0 && <Identification report={report} update={update} errors={errors} saved={saved} loadReport={loadReport} deleteReport={deleteReport} duplicate={(item) => setDuplicateTarget(item)} />}
    {activeStep === 1 && <MetricsStep report={report} update={update} updateMetric={updateMetric} calculations={calculations} />}
    {activeStep === 2 && <ComparisonStep report={report} update={update} updatePrevious={updatePrevious} calculations={calculations} />}
    {activeStep === 3 && <HighlightsStep report={report} update={update} add={addHighlight} change={updateHighlight} remove={removeHighlight} />}
    {activeStep === 4 && <ReportPreview ref={reportRef} report={report} calculations={calculations} ranked={rankedHighlights} />}

    <div data-print-hide className="flex flex-wrap items-center gap-2 border border-border bg-card p-4">
      {activeStep > 0 && <Button variant="outline" onClick={() => setActiveStep((current) => current - 1)}>Voltar</Button>}
      {activeStep < 4 ? <Button onClick={() => activeStep === 3 ? openReport() : setActiveStep((current) => current + 1)}>{activeStep === 3 ? <><FileBarChart />Gerar relatório</> : "Continuar"}</Button> : <><Button onClick={copySummary}><Clipboard />Copiar resumo</Button><Button variant="outline" onClick={() => window.print()}><Printer />Imprimir relatório</Button><Button variant="outline" onClick={exportPdf} disabled={exporting}><Download />{exporting ? "Gerando PDF…" : "Baixar relatório em PDF"}</Button></>}
      <Button variant="outline" onClick={saveReport}><Save />Salvar relatório</Button>
      <Button variant="ghost" onClick={resetReport}>Novo relatório</Button>
      {feedback && <p role="status" className="w-full text-sm text-primary">{feedback}</p>}
    </div>

    {duplicateTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="duplicate-title" className="w-full max-w-lg border border-border bg-background p-6"><h2 id="duplicate-title" className="text-xl font-semibold">Como deseja duplicar?</h2><p className="mt-2 text-sm text-muted-foreground">Você pode preservar todos os dados ou copiar apenas a estrutura e identificação para um novo período.</p><div className="mt-6 grid gap-2"><Button onClick={() => duplicateReport(duplicateTarget, true)}>Duplicar estrutura e limpar métricas</Button><Button variant="outline" onClick={() => duplicateReport(duplicateTarget, false)}>Duplicar mantendo métricas</Button><Button variant="ghost" onClick={() => setDuplicateTarget(null)}>Cancelar</Button></div></div></div>}
  </ToolPageShell>;
}

function Identification({ report, update, errors, saved, loadReport, deleteReport, duplicate }: { report: Report; update: <K extends keyof Report>(key: K, value: Report[K]) => void; errors: Record<string, string>; saved: SavedReport[]; loadReport: (item: SavedReport) => void; deleteReport: (id: string) => void; duplicate: (report: Report) => void }) {
  return <Card data-print-hide><CardHeader><CardTitle>Identificação e período</CardTitle><CardDescription>Informe o contexto do relatório. Os dados do relatório são mantidos localmente neste navegador durante o uso.</CardDescription></CardHeader><CardContent className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><TextField label="Nome do relatório" value={report.reportName} onChange={(next) => update("reportName", next)} error={errors.reportName} required /><TextField label="Empresa ou cliente" value={report.client} onChange={(next) => update("client", next)} /><TextField label="Nome do perfil" value={report.profileName} onChange={(next) => update("profileName", next)} /><TextField label="@usuário" value={report.username} onChange={(next) => update("username", next)} /><SelectField label="Rede social" value={report.network} options={networks} onChange={(next) => update("network", next)} error={errors.network} required /><TextField label="Responsável pelo relatório" value={report.responsible} onChange={(next) => update("responsible", next)} /><TextField type="date" label="Data inicial" value={report.startDate} onChange={(next) => update("startDate", next)} error={errors.startDate} required /><TextField type="date" label="Data final" value={report.endDate} onChange={(next) => update("endDate", next)} error={errors.endDate} required /></div>{report.startDate && report.endDate && <p className="text-sm text-muted-foreground">Período analisado: <strong className="text-foreground">{date(report.startDate)} a {date(report.endDate)}</strong></p>}
    <section className="border-t border-border pt-5"><h3 className="font-semibold">Meus relatórios neste navegador</h3><p className="mt-1 text-sm text-muted-foreground">Até {MAX_REPORTS} relatórios, ordenados pela atualização mais recente.</p>{saved.length ? <div className="mt-4 grid gap-3">{saved.map((item) => <div key={item.report.id} className="flex flex-col gap-3 border border-border p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="truncate font-medium">{item.report.reportName}</p><p className="text-xs text-muted-foreground">{item.report.client || "Cliente não informado"} · {item.report.network || "Rede não informada"} · atualizado em {new Date(item.updatedAt).toLocaleDateString("pt-BR")}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => loadReport(item)}><FolderOpen />Abrir</Button><Button size="sm" variant="outline" onClick={() => duplicate(item.report)}><Copy />Duplicar</Button><Button size="sm" variant="destructive" aria-label={`Excluir relatório ${item.report.reportName}`} onClick={() => deleteReport(item.report.id)}><Trash2 />Excluir</Button></div></div>)}</div> : <p className="mt-4 border border-dashed border-border p-4 text-sm text-muted-foreground">Nenhum relatório salvo ainda.</p>}</section>
  </CardContent></Card>;
}

function MetricsStep({ report, update, updateMetric, calculations }: { report: Report; update: <K extends keyof Report>(key: K, value: Report[K]) => void; updateMetric: (key: keyof Metrics, value: string) => void; calculations: Calculations }) {
  return <div data-print-hide className="grid gap-6"><MetricSection title="Audiência" description={`Variação líquida calculada: ${integer.format(calculations.followerDelta)} · crescimento: ${percent(calculations.followerGrowth)}`} fields={[["followersStart", "Seguidores no início"], ["followersEnd", "Seguidores no final"], ["newFollowers", "Novos seguidores (opcional)"], ["lostFollowers", "Seguidores perdidos (opcional)"]]} metrics={report.metrics} update={updateMetric} />
    <MetricSection title="Conteúdo publicado" description="Informe o total diretamente ou deixe em branco para usar a soma dos formatos. O total direto tem prioridade e evita duplicidade." fields={[["publications", "Publicações realizadas"], ["staticPosts", "Posts estáticos"], ["carousels", "Carrosséis"], ["videos", "Vídeos"], ["reels", "Reels/Shorts"], ["stories", "Stories"], ["lives", "Lives"], ["otherContent", "Outros conteúdos"]]} metrics={report.metrics} update={updateMetric} />
    <MetricSection title="Alcance e visibilidade" description="Deixe em branco o que não existir na plataforma analisada." fields={[["reach", "Alcance"], ["impressions", "Impressões"], ["videoViews", "Visualizações de vídeo"], ["profileViews", "Visualizações do perfil"]]} metrics={report.metrics} update={updateMetric} />
    <MetricSection title="Interações" description={`Total calculado: ${integer.format(calculations.interactions)}`} fields={[["likes", "Curtidas"], ["comments", "Comentários"], ["shares", "Compartilhamentos"], ["saves", "Salvamentos"], ["replies", "Respostas"], ["clicks", "Cliques"], ["otherInteractions", "Outras interações"]]} metrics={report.metrics} update={updateMetric} />
    <Card><CardHeader><CardTitle className="text-base">Taxa de engajamento</CardTitle><CardDescription>Escolha a base. A ferramenta não classifica o percentual como bom ou ruim.</CardDescription></CardHeader><CardContent><div className="flex flex-wrap gap-2">{([['followers','Por seguidores'],['reach','Por alcance'],['impressions','Por impressões']] as const).map(([method, label]) => <Button key={method} type="button" variant={report.engagementMethod === method ? "default" : "outline"} aria-pressed={report.engagementMethod === method} onClick={() => update("engagementMethod", method)}>{label}</Button>)}</div><p className="mt-4 text-2xl font-semibold">{percent(calculations.engagement)}</p><p className="mt-1 text-sm text-muted-foreground">{integer.format(calculations.interactions)} interações ÷ {integer.format(calculations.base)} × 100</p></CardContent></Card>
    <MetricSection title="Tráfego e conversão" description={`CTR por impressões: ${percent(calculations.ctr)}. Resultados de negócio são apresentados separadamente das métricas orgânicas.`} fields={[["linkClicks", "Cliques no link"], ["profileClicks", "Cliques no perfil"], ["siteVisits", "Visitas ao site"], ["contactClicks", "Cliques em contato"], ["otherClicks", "Outros cliques"], ["leads", "Leads"], ["conversions", "Conversões"], ["sales", "Vendas"], ["revenue", "Receita atribuída (R$)"]]} metrics={report.metrics} update={updateMetric} moneyKeys={["revenue"]} />
    <MetricSection title="Mídia paga (opcional)" description="Indicadores complementares; use as calculadoras específicas do Kivai para análises financeiras detalhadas." fields={[["investment", "Investimento (R$)"], ["paidImpressions", "Impressões pagas"], ["paidClicks", "Cliques pagos"], ["paidLeads", "Leads pagos"], ["paidConversions", "Conversões pagas"], ["paidRevenue", "Receita atribuída (R$)"]]} metrics={report.metrics} update={updateMetric} moneyKeys={["investment", "paidRevenue"]} />
  </div>;
}

function ComparisonStep({ report, update, updatePrevious, calculations }: { report: Report; update: <K extends keyof Report>(key: K, value: Report[K]) => void; updatePrevious: (key: keyof Previous, value: string) => void; calculations: Calculations }) {
  const current = { followers: value(report.metrics.followersEnd), reach: value(report.metrics.reach), impressions: value(report.metrics.impressions), interactions: calculations.interactions, clicks: calculations.trafficClicks, publications: calculations.publications };
  return <Card data-print-hide><CardHeader><CardTitle>Comparação com período anterior</CardTitle><CardDescription>Informe somente as métricas disponíveis. Valores anteriores iguais a zero não geram divisão por zero.</CardDescription></CardHeader><CardContent><label className="flex items-center gap-3 font-medium"><input type="checkbox" checked={report.compare} onChange={(event) => update("compare", event.target.checked)} className="size-4 accent-primary" />Comparar com período anterior</label>{report.compare && <div className="mt-6 space-y-6"><div className="grid gap-4 sm:grid-cols-2"><TextField type="date" label="Data inicial anterior" value={report.previousStartDate} onChange={(next) => update("previousStartDate", next)} /><TextField type="date" label="Data final anterior" value={report.previousEndDate} onChange={(next) => update("previousEndDate", next)} /></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{([['followers','Seguidores'],['reach','Alcance'],['impressions','Impressões'],['interactions','Interações'],['clicks','Cliques'],['publications','Publicações']] as [keyof Previous,string][]).map(([key, label]) => <NumberField key={key} label={`${label} — período anterior`} value={report.previous[key]} onChange={(next) => updatePrevious(key, next)} />)}</div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(Object.keys(current) as (keyof Previous)[]).map((key) => informed(report.previous[key]) ? <ComparisonCard key={key} label={{ followers: "Seguidores", reach: "Alcance", impressions: "Impressões", interactions: "Interações", clicks: "Cliques", publications: "Publicações" }[key]} current={current[key]} previous={report.previous[key]} /> : null)}</div></div>}</CardContent></Card>;
}

function HighlightsStep({ report, update, add, change, remove }: { report: Report; update: <K extends keyof Report>(key: K, value: Report[K]) => void; add: () => void; change: (id: string, key: keyof Highlight, value: string) => void; remove: (id: string) => void }) {
  return <div data-print-hide className="grid gap-6"><Card><CardHeader><CardTitle>Principais publicações do período</CardTitle><CardDescription>Adicione até seis conteúdos. A imagem não é armazenada para evitar consumo excessivo do navegador.</CardDescription></CardHeader><CardContent><div className="space-y-4">{report.highlights.map((item, index) => <fieldset key={item.id} className="border border-border p-4"><legend className="px-2 font-semibold">Publicação {index + 1}</legend><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><TextField label="Título" value={item.title} onChange={(next) => change(item.id, "title", next)} /><SelectField label="Formato" value={item.format} options={formats} onChange={(next) => change(item.id, "format", next)} /><NumberField label="Alcance" value={item.reach} onChange={(next) => change(item.id, "reach", next)} /><NumberField label="Interações" value={item.interactions} onChange={(next) => change(item.id, "interactions", next)} /><NumberField label="Cliques" value={item.clicks} onChange={(next) => change(item.id, "clicks", next)} /><TextField type="url" label="Link (opcional)" value={item.link} onChange={(next) => change(item.id, "link", next)} /></div><Button className="mt-4" size="sm" variant="destructive" onClick={() => remove(item.id)}><Trash2 />Excluir publicação</Button></fieldset>)}{!report.highlights.length && <p className="border border-dashed border-border p-4 text-sm text-muted-foreground">Nenhuma publicação adicionada.</p>}</div><div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><Button variant="outline" onClick={add} disabled={report.highlights.length >= 6}><Plus />Adicionar publicação</Button><label className="grid gap-1.5 text-sm font-medium">Ordenar conteúdos por<select value={report.rankBy} onChange={(event) => update("rankBy", event.target.value as Report["rankBy"])} className="min-h-11 border border-border bg-background px-3"><option value="reach">Alcance</option><option value="interactions">Interações</option><option value="rate">Taxa por alcance</option><option value="clicks">Cliques</option></select></label></div></CardContent></Card>
    <Card><CardHeader><CardTitle>Análise do profissional</CardTitle><CardDescription>Estes textos são escritos por você e não são gerados automaticamente.</CardDescription></CardHeader><CardContent className="grid gap-4"><TextArea label="Análise e observações" value={report.notes} onChange={(next) => update("notes", next)} /><TextArea label="Próximos passos (opcional)" value={report.nextSteps} onChange={(next) => update("nextSteps", next)} /></CardContent></Card>
  </div>;
}

const ReportPreview = function ReportPreview({ ref, report, calculations, ranked }: { ref: React.Ref<HTMLDivElement>; report: Report; calculations: Calculations; ranked: Highlight[] }) {
  const current = { followers: value(report.metrics.followersEnd), reach: value(report.metrics.reach), impressions: value(report.metrics.impressions), interactions: calculations.interactions };
  const interactionData = [["Curtidas", report.metrics.likes], ["Comentários", report.metrics.comments], ["Compartilhamentos", report.metrics.shares], ["Salvamentos", report.metrics.saves], ["Respostas", report.metrics.replies], ["Cliques", report.metrics.clicks], ["Outras", report.metrics.otherInteractions]].filter(([, input]) => informed(input));
  const contentData = [["Posts", report.metrics.staticPosts], ["Carrosséis", report.metrics.carousels], ["Vídeos", report.metrics.videos], ["Reels", report.metrics.reels], ["Stories", report.metrics.stories], ["Lives", report.metrics.lives], ["Outros", report.metrics.otherContent]].filter(([, input]) => informed(input));
  const compareData = ([['followers','Seguidores'],['reach','Alcance'],['impressions','Impressões'],['interactions','Interações']] as const).filter(([key]) => report.compare && informed(report.previous[key])).map(([key, label]) => ({ label, current: current[key], previous: value(report.previous[key]) }));
  return <div ref={ref} data-print-report className="space-y-6 border border-border bg-card p-4 sm:p-7 lg:p-9">
    <header data-print-section className="border-b border-border pb-6"><p className="text-sm font-medium uppercase tracking-wider text-primary">Relatório Social Media</p><h2 className="mt-2 text-2xl font-semibold sm:text-3xl">{report.reportName || "Relatório sem nome"}</h2><dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3"><ReportMeta label="Cliente" value={report.client} /><ReportMeta label="Perfil" value={[report.profileName, report.username].filter(Boolean).join(" · ")} /><ReportMeta label="Rede social" value={report.network} /><ReportMeta label="Período" value={`${date(report.startDate)} a ${date(report.endDate)}`} /><ReportMeta label="Responsável" value={report.responsible} /></dl></header>
    <ReportSection title="Resumo do período"><p className="leading-7 text-muted-foreground">{executiveSummary(report, calculations)}</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{objectiveInsights(report, calculations).map((item) => <p key={item} className="border-l-2 border-primary pl-3 text-sm">{item}</p>)}</div></ReportSection>
    <ReportSection title="Principais indicadores"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><MetricCard label="Seguidores" value={labelNumber(report.metrics.followersEnd)} /><MetricCard label="Crescimento" value={percent(calculations.followerGrowth)} /><MetricCard label="Alcance" value={labelNumber(report.metrics.reach)} hide={!informed(report.metrics.reach)} /><MetricCard label="Impressões" value={labelNumber(report.metrics.impressions)} hide={!informed(report.metrics.impressions)} /><MetricCard label="Interações" value={integer.format(calculations.interactions)} /><MetricCard label="Engajamento" value={percent(calculations.engagement)} note={`Por ${report.engagementMethod === "followers" ? "seguidores" : report.engagementMethod === "reach" ? "alcance" : "impressões"}`} /><MetricCard label="Cliques de tráfego" value={integer.format(calculations.trafficClicks)} /><MetricCard label="Publicações" value={integer.format(calculations.publications)} /></div></ReportSection>
    {report.compare && compareData.length > 0 && <ReportSection title="Comparação com período anterior"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{compareData.map((item) => <ComparisonCard key={item.label} label={item.label} current={item.current} previous={String(item.previous)} />)}</div><SimpleComparisonChart data={compareData} /></ReportSection>}
    {(interactionData.length > 0 || contentData.length > 0) && <ReportSection title="Distribuição dos dados"><div className="grid gap-6 lg:grid-cols-2">{interactionData.length > 0 && <SimpleBarChart title="Interações" data={interactionData.map(([label, input]) => ({ label, value: value(input) }))} />}{contentData.length > 0 && <SimpleBarChart title="Formatos de conteúdo" data={contentData.map(([label, input]) => ({ label, value: value(input) }))} />}</div></ReportSection>}
    {informed(report.metrics.investment) && <ReportSection title="Indicadores complementares de mídia paga"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><MetricCard label="CPC" value={calculations.paid.cpc === null ? "—" : currency.format(calculations.paid.cpc)} /><MetricCard label="CPM" value={calculations.paid.cpm === null ? "—" : currency.format(calculations.paid.cpm)} /><MetricCard label="CPL" value={calculations.paid.cpl === null ? "—" : currency.format(calculations.paid.cpl)} /><MetricCard label="CPA" value={calculations.paid.cpa === null ? "—" : currency.format(calculations.paid.cpa)} /><MetricCard label="ROAS" value={calculations.paid.roas === null ? "—" : `${decimal.format(calculations.paid.roas)}x`} /></div><p className="mt-3 text-xs text-muted-foreground">Métricas orgânicas e resultados financeiros são apresentados separadamente. Estes indicadores não substituem uma análise completa de ROAS ou ROI.</p></ReportSection>}
    {ranked.length > 0 && <ReportSection title="Conteúdos de destaque"><div className="space-y-3">{ranked.map((item, index) => <article key={item.id} className="grid gap-2 border border-border p-4 sm:grid-cols-[auto_1fr_auto]"><span className="font-semibold text-primary">#{index + 1}</span><div><h4 className="font-semibold">{item.title || `Publicação ${index + 1}`}</h4><p className="text-xs text-muted-foreground">{item.format || "Formato não informado"}{item.link ? ` · ${item.link}` : ""}</p></div><dl className="grid grid-cols-3 gap-3 text-right text-xs"><div><dt className="text-muted-foreground">Alcance</dt><dd>{labelNumber(item.reach)}</dd></div><div><dt className="text-muted-foreground">Interações</dt><dd>{labelNumber(item.interactions)}</dd></div><div><dt className="text-muted-foreground">Taxa</dt><dd>{percent(rate(value(item.interactions), value(item.reach)))}</dd></div></dl></article>)}</div></ReportSection>}
    {report.notes && <ReportSection title="Análise e observações"><p className="whitespace-pre-wrap leading-7 text-muted-foreground">{report.notes}</p></ReportSection>}{report.nextSteps && <ReportSection title="Próximos passos"><p className="whitespace-pre-wrap leading-7 text-muted-foreground">{report.nextSteps}</p></ReportSection>}
    <p className="border-t border-border pt-4 text-xs text-muted-foreground">Relatório criado com dados informados pelo usuário. O Kivai não coleta dados automaticamente das redes sociais e não estabelece causalidade entre métricas e resultados.</p>
  </div>;
};

function MetricSection({ title, description, fields, metrics, update, moneyKeys = [] }: { title: string; description: string; fields: [keyof Metrics, string][]; metrics: Metrics; update: (key: keyof Metrics, value: string) => void; moneyKeys?: (keyof Metrics)[] }) { return <Card><CardHeader><CardTitle className="text-base">{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{fields.map(([key, label]) => <NumberField key={key} label={label} value={metrics[key]} onChange={(next) => update(key, next)} step={moneyKeys.includes(key) ? "0.01" : "1"} />)}</CardContent></Card>; }
function TextField({ label, value: input, onChange, type = "text", error, required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; error?: string; required?: boolean }) { return <label className="grid gap-1.5 text-sm font-medium">{label}{required && <span className="sr-only"> obrigatório</span>}<input type={type} value={input} onChange={(event) => onChange(event.target.value)} onInput={type === "date" ? (event) => onChange(event.currentTarget.value) : undefined} aria-invalid={!!error} required={required} className="min-h-11 min-w-0 border border-border bg-background px-3" />{error && <span className="text-xs text-destructive">{error}</span>}</label>; }
function NumberField({ label, value: input, onChange, step = "1" }: { label: string; value: string; onChange: (value: string) => void; step?: string }) { return <label className="grid gap-1.5 text-sm font-medium">{label}<input type="number" min="0" step={step} inputMode="decimal" value={input} onChange={(event) => onChange(event.target.value)} className="min-h-11 min-w-0 border border-border bg-background px-3" /></label>; }
function SelectField({ label, value: input, options, onChange, error, required = false }: { label: string; value: string; options: string[]; onChange: (value: string) => void; error?: string; required?: boolean }) { return <label className="grid gap-1.5 text-sm font-medium">{label}<select value={input} onChange={(event) => onChange(event.target.value)} aria-invalid={!!error} required={required} className="min-h-11 min-w-0 border border-border bg-background px-3"><option value="">Selecione</option>{options.map((option) => <option key={option}>{option}</option>)}</select>{error && <span className="text-xs text-destructive">{error}</span>}</label>; }
function TextArea({ label, value: input, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="grid gap-1.5 text-sm font-medium">{label}<textarea rows={5} value={input} onChange={(event) => onChange(event.target.value)} className="min-w-0 resize-y border border-border bg-background p-3" /></label>; }
function MetricCard({ label, value: metric, note, hide = false }: { label: string; value: string; note?: string; hide?: boolean }) { if (hide) return null; return <div className="border border-border p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold">{metric}</p>{note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}</div>; }
function ComparisonCard({ label, current, previous }: { label: string; current: number; previous: string }) { const result = comparison(current, previous); if (!result) return null; return <div className="border border-border p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 font-semibold">{integer.format(result.before)} → {integer.format(current)}</p><p className={cn("mt-1 text-sm", result.absolute > 0 ? "text-emerald-600" : result.absolute < 0 ? "text-destructive" : "text-muted-foreground")}>{result.percentage === null ? "Variação percentual indisponível: valor anterior zero." : `${result.absolute > 0 ? "Aumento" : result.absolute < 0 ? "Redução" : "Sem variação"} de ${percent(Math.abs(result.percentage))}`}</p></div>; }
function ReportMeta({ label, value: input }: { label: string; value: string }) { return <div><dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1">{input || "Não informado"}</dd></div>; }
function ReportSection({ title, children }: { title: string; children: React.ReactNode }) { return <section data-print-section><h3 className="mb-4 border-b border-border pb-2 text-lg font-semibold">{title}</h3>{children}</section>; }
function SimpleBarChart({ title, data }: { title: string; data: { label: string; value: number }[] }) { const max = Math.max(...data.map((item) => item.value), 1); return <figure aria-label={`Gráfico de ${title.toLowerCase()}`} className="border border-border p-4"><figcaption className="font-semibold">{title}</figcaption><div className="mt-4 space-y-3">{data.map((item) => <div key={item.label}><div className="mb-1 flex justify-between gap-3 text-xs"><span>{item.label}</span><span>{integer.format(item.value)}</span></div><div className="h-3 bg-muted"><div className="h-full bg-primary" style={{ width: `${item.value / max * 100}%` }} /></div></div>)}</div></figure>; }
function SimpleComparisonChart({ data }: { data: { label: string; current: number; previous: number }[] }) { return <figure aria-label="Gráfico de comparação entre períodos" className="mt-5 border border-border p-4"><figcaption className="font-semibold">Atual x anterior</figcaption><div className="mt-4 grid gap-4 sm:grid-cols-2">{data.map((item) => { const max = Math.max(item.current, item.previous, 1); return <div key={item.label}><p className="mb-2 text-sm font-medium">{item.label}</p><div className="grid grid-cols-[4rem_1fr_auto] items-center gap-2 text-xs"><span>Atual</span><div className="h-3 bg-muted"><div className="h-full bg-primary" style={{ width: `${item.current / max * 100}%` }} /></div><span>{integer.format(item.current)}</span><span>Anterior</span><div className="h-3 bg-muted"><div className="h-full bg-muted-foreground" style={{ width: `${item.previous / max * 100}%` }} /></div><span>{integer.format(item.previous)}</span></div></div>; })}</div></figure>; }

function executiveSummary(report: Report, calculations: Calculations) { const parts: string[] = []; if (informed(report.metrics.followersStart) && informed(report.metrics.followersEnd)) parts.push(`o perfil passou de ${integer.format(value(report.metrics.followersStart))} para ${integer.format(value(report.metrics.followersEnd))} seguidores, uma variação de ${percent(calculations.followerGrowth)}`); if (informed(report.metrics.reach)) parts.push(`o alcance informado foi de ${integer.format(value(report.metrics.reach))}`); parts.push(`foram registradas ${integer.format(calculations.interactions)} interações`); if (calculations.publications > 0) parts.push(`${integer.format(calculations.publications)} publicações foram realizadas`); return `No período de ${date(report.startDate)} a ${date(report.endDate)}, ${parts.join("; ")}.`; }
function objectiveInsights(report: Report, calculations: Calculations) { const items: string[] = []; if (calculations.followerGrowth !== null) items.push(`Seguidores ${calculations.followerGrowth >= 0 ? "aumentaram" : "diminuíram"} ${percent(Math.abs(calculations.followerGrowth))} no período.`); if (report.compare && informed(report.previous.reach)) { const item = comparison(value(report.metrics.reach), report.previous.reach); if (item?.percentage !== null && item) items.push(`Alcance ficou ${percent(Math.abs(item.percentage))} ${item.percentage >= 0 ? "acima" : "abaixo"} do período anterior.`); }
  if (calculations.interactions > 0 && value(report.metrics.shares) > 0) items.push(`Compartilhamentos representaram ${percent(rate(value(report.metrics.shares), calculations.interactions))} das interações registradas.`); if (calculations.publications > 0) items.push(`${integer.format(calculations.publications)} publicações foram realizadas no período.`); return items; }
function summaryText(report: Report, calculations: Calculations) { return `Relatório Social Media\n${report.reportName}\nPeríodo: ${date(report.startDate)} a ${date(report.endDate)}\n\nSeguidores: ${labelNumber(report.metrics.followersEnd)}\nCrescimento: ${percent(calculations.followerGrowth)}\nAlcance: ${labelNumber(report.metrics.reach)}\nImpressões: ${labelNumber(report.metrics.impressions)}\nInterações: ${integer.format(calculations.interactions)}\nEngajamento por ${report.engagementMethod === "followers" ? "seguidores" : report.engagementMethod === "reach" ? "alcance" : "impressões"}: ${percent(calculations.engagement)}`; }
function fileName(report: Report) { const name = (report.client || report.reportName || "relatorio").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); const period = report.startDate ? report.startDate.slice(0, 7) : "periodo"; return `relatorio-social-media-${name}-${period}.pdf`; }
