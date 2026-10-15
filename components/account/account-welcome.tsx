"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, FileText, Image, Megaphone, ShoppingBag, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabaseUserFetch } from "@/lib/user-auth";
import { getToolBySlug } from "@/lib/tools";
import { readRecentToolSlugs } from "@/lib/account/recent-tool-visits";
import { getFirstMission } from "@/lib/account/first-mission";
import { AccountProgress } from "@/components/account/account-progress";

type Goal = "images" | "documents" | "sales" | "social";
type WelcomeState = "loading" | "choose" | "saved" | "done" | "error";
type RecordRow = { goal: Goal | null; status: "completed" | "skipped"; first_mission_completed_at: string | null; first_mission_tool_slug: string | null };

const goals: { value: Goal; title: string; caption: string; url: string }[] = [
  { value: "images", title: "Imagens", caption: "Editar e preparar fotos", url: "/ferramentas/imagens" },
  { value: "documents", title: "PDFs e documentos", caption: "Converter e organizar arquivos", url: "/ferramentas/pdfs" },
  { value: "sales", title: "Vendas e negócios", caption: "Preços, margens e resultados", url: "/ferramentas/calculadoras" },
  { value: "social", title: "Redes sociais", caption: "Planejamento e conteúdo", url: "/ferramentas/social-media" },
];

const suggestedByGoal: Record<Goal, readonly string[]> = {
  images: ["removedor-de-fundo", "redimensionar-imagem", "compressor-de-imagens"],
  documents: ["unir-pdfs", "compactar-pdf", "pdf-para-word"],
  sales: ["calculadora-de-markup", "calculadora-de-margem", "calculadora-de-roas"],
  social: ["calendario-editorial-redes-sociais", "planejador-de-conteudo-social-media", "gerador-de-relatorio-social-media"],
};
const starterSuggestions = ["removedor-de-fundo", "unir-pdfs", "gerador-de-qr-code"];

export function AccountWelcome({ userId, firstName }: { userId: string; firstName: string }) {
  const [status, setStatus] = useState<WelcomeState>("loading");
  const [selection, setSelection] = useState<Goal | null>(null);
  const [savedGoal, setSavedGoal] = useState<Goal | null>(null);
  const [hasPreference, setHasPreference] = useState(false);
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);
  const [missionCompletedAt, setMissionCompletedAt] = useState<string | null>(null);
  const [missionToolSlug, setMissionToolSlug] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await supabaseUserFetch(`/rest/v1/user_onboarding?select=goal,status,first_mission_completed_at,first_mission_tool_slug&user_id=eq.${encodeURIComponent(userId)}&limit=1`);
        if (!response.ok) throw new Error("Não foi possível verificar suas preferências.");
        const rows = await response.json() as RecordRow[];
        if (active) {
          const goal = rows[0]?.status === "completed" ? rows[0].goal : null;
          setSavedGoal(goal);
          setSelection(goal);
          setHasPreference(rows.length > 0);
          setMissionCompletedAt(rows[0]?.first_mission_completed_at ?? null);
          setMissionToolSlug(rows[0]?.first_mission_tool_slug ?? null);
          setStatus(rows.length ? "done" : "choose");
        }
      } catch (error) {
        if (active) { setStatus("error"); setMessage(error instanceof Error ? error.message : "Não foi possível carregar suas boas-vindas."); }
      }
    };
    void load();
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    const refresh = () => setRecentSlugs(readRecentToolSlugs(userId));
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("kivai-recent-tools-changed", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("kivai-recent-tools-changed", refresh);
    };
  }, [userId]);

  async function save(goal: Goal | null) {
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await supabaseUserFetch("/rest/v1/user_onboarding?on_conflict=user_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ user_id: userId, goal, status: goal ? "completed" : "skipped" }),
      });
      if (!response.ok) throw new Error("Não foi possível salvar sua preferência. Tente novamente.");
      setSelection(goal);
      setSavedGoal(goal);
      setHasPreference(true);
      setStatus(goal ? "saved" : "done");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar sua preferência.");
    } finally { setBusy(false); }
  }

  if (status === "loading") return null;
  if (status === "error") {
    return <p role="alert" className="rounded-lg border border-border p-3 text-sm text-muted-foreground">{message} <button className="ml-2 font-semibold text-primary underline" type="button" onClick={() => window.location.reload()}>Tentar novamente</button></p>;
  }

  const chosen = goals.find((item) => item.value === selection);
  const preferred = goals.find((item) => item.value === savedGoal);
  const mission = getFirstMission(savedGoal);
  const recentTools = recentSlugs.map((slug) => getToolBySlug(slug)).filter((tool) => tool?.available).slice(0, 4);
  const suggestions = (savedGoal ? suggestedByGoal[savedGoal] : starterSuggestions)
    .map((slug) => getToolBySlug(slug))
    .filter((tool) => tool?.available && !recentSlugs.includes(tool.slug))
    .slice(0, 3);

  if (status === "done") {
    return (
      <section className="rounded-2xl border border-primary/25 bg-card p-5 sm:p-6" aria-labelledby="my-kivai-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><Sparkles className="size-4" /> Seu espaço personalizado</p>
            <h2 id="my-kivai-title" className="mt-2 text-xl font-semibold">Meu Kivai</h2>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              {preferred ? `Seu foco: ${preferred.title}. Volte rapidamente às ferramentas do seu dia a dia.` : "Acesse suas ferramentas recentes e descubra atalhos úteis."}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => { setSelection(savedGoal); setMessage(""); setStatus("choose"); }}>
            {preferred ? "Alterar interesse" : "Escolher interesse"}
          </Button>
        </div>
        <div className="mt-5 rounded-xl border border-primary/25 bg-primary/[0.035] p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{missionCompletedAt ? "Primeira missão concluída" : "Sua primeira missão"}</p>
          {missionCompletedAt ? (
            <>
              <h3 className="mt-1.5 flex items-center gap-2 text-base font-semibold"><CheckCircle2 className="size-4 text-primary" aria-hidden="true" /> Você já completou sua primeira tarefa!</h3>
              <p className="mt-1 text-sm text-muted-foreground">{getToolBySlug(missionToolSlug ?? "")?.name ?? "Sua ferramenta"} ajudou você a começar. Explore outras ferramentas ou retome seus favoritos.</p>
            </>
          ) : (
            <>
              <h3 className="mt-1.5 text-base font-semibold">{mission.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{mission.instruction}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Link href={`/ferramentas/${mission.slug}?missao=1`} className="inline-flex min-h-9 items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
                  Começar minha missão <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <span className="text-xs text-muted-foreground">O progresso é registrado quando você concluir a tarefa.</span>
              </div>
            </>
          )}
        </div>
        <div className="mt-5"><AccountProgress userId={userId} firstMissionDone={Boolean(missionCompletedAt)} /></div>
        {recentTools.length > 0 ? (
          <div className="mt-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><Clock3 className="size-4 text-primary" /> Acessadas recentemente</h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {recentTools.map((tool) => tool && (
                <Link key={tool.slug} href={`/ferramentas/${tool.slug}`} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background/50 px-3 py-3 text-sm hover:border-primary/40">
                  <span className="min-w-0 truncate">{tool.name}</span><ArrowRight className="size-4 shrink-0 text-primary" />
                </Link>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Histórico disponível apenas neste navegador e nesta conta.</p>
          </div>
        ) : null}
        <div className="mt-5">
          <h3 className="text-sm font-semibold">{preferred ? "Sugestões para você" : "Ferramentas para começar"}</h3>
          {suggestions.length > 0 ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {suggestions.map((tool) => tool && (
                <Link key={tool.slug} href={`/ferramentas/${tool.slug}`} className="group flex min-w-0 flex-col gap-1 rounded-lg border border-border bg-background/50 p-3 hover:border-primary/40">
                  <span className="text-sm font-medium group-hover:text-primary">{tool.name}</span>
                  <span className="line-clamp-2 text-xs leading-5 text-muted-foreground">{tool.description}</span>
                </Link>
              ))}
            </div>
          ) : <p className="mt-2 text-sm text-muted-foreground">Você já acessou as principais sugestões desta área.</p>}
        </div>
        <Link href="/conta#my-tools-title" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><Star className="size-4" /> Abrir Minhas Ferramentas favoritas <ArrowRight className="size-4" /></Link>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-primary/25 bg-card p-5 sm:p-6" aria-labelledby="welcome-title">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary"><Sparkles className="size-4" /> {hasPreference ? "Personalize seu Kivai" : "Seu primeiro passo no Kivai"}</div>
      {status === "saved" ? (
        <div className="mt-3 space-y-3">
          <h2 id="welcome-title" className="text-xl font-semibold">Seu espaço está preparado!</h2>
          <p className="text-sm leading-6 text-muted-foreground">Comece por {chosen?.title.toLowerCase()} ou explore outras ferramentas quando quiser. Seu interesse foi salvo para personalizar os próximos acessos.</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm"><Link href={chosen?.url ?? "/ferramentas"}>Explorar {chosen?.title} <ArrowRight className="size-4" /></Link></Button>
            <Button variant="outline" size="sm" onClick={() => setStatus("done")}>Continuar no painel</Button>
          </div>
        </div>
      ) : (
        <>
          <h2 id="welcome-title" className="mt-2 text-xl font-semibold">{hasPreference ? "Qual área você quer priorizar?" : `Boas-vindas, ${firstName}!`}</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">Escolha a área que mais usa. As sugestões do seu painel serão atualizadas, sem alterar seu plano ou seus favoritos.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {goals.map((goal) => (
              <button key={goal.value} type="button" onClick={() => setSelection(goal.value)} disabled={busy}
                aria-pressed={selection === goal.value}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors hover:border-primary/40 disabled:opacity-50 ${selection === goal.value ? "border-primary/70 bg-primary/[0.07]" : "border-border"}`}>
                {goal.value === "images" ? <Image className="mt-0.5 size-5 shrink-0 text-primary" /> :
                 goal.value === "documents" ? <FileText className="mt-0.5 size-5 shrink-0 text-primary" /> :
                 goal.value === "sales" ? <ShoppingBag className="mt-0.5 size-5 shrink-0 text-primary" /> :
                 <Megaphone className="mt-0.5 size-5 shrink-0 text-primary" />}
                <span className="min-w-0"><span className="block text-sm font-semibold">{goal.title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{goal.caption}</span></span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button size="sm" onClick={() => void save(selection)} disabled={!selection || busy}>{busy ? "Salvando..." : "Salvar e continuar"} <ArrowRight className="size-4" /></Button>
            <button type="button" disabled={busy} onClick={() => { if (hasPreference) { setMessage(""); setStatus("done"); } else { void save(null); } }} className="px-2 py-2 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50">{hasPreference ? "Cancelar" : "Agora não"}</button>
          </div>
          {message ? <p role="alert" className="mt-2 text-sm text-red-400">{message}</p> : null}
        </>
      )}
    </section>
  );
}
