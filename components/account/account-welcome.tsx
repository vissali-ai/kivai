"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, FileText, Image, Megaphone, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabaseUserFetch } from "@/lib/user-auth";

type Goal = "images" | "documents" | "sales" | "social";
type WelcomeState = "loading" | "choose" | "saved" | "done" | "error";
type RecordRow = { goal: Goal | null; status: "completed" | "skipped" };

const goals: { value: Goal; title: string; caption: string; url: string }[] = [
  { value: "images", title: "Imagens", caption: "Editar e preparar fotos", url: "/ferramentas/imagens" },
  { value: "documents", title: "PDFs e documentos", caption: "Converter e organizar arquivos", url: "/ferramentas/pdfs" },
  { value: "sales", title: "Vendas e negócios", caption: "Preços, margens e resultados", url: "/ferramentas/calculadoras" },
  { value: "social", title: "Redes sociais", caption: "Planejamento e conteúdo", url: "/ferramentas/social-media" },
];

export function AccountWelcome({ userId, firstName }: { userId: string; firstName: string }) {
  const [status, setStatus] = useState<WelcomeState>("loading");
  const [selection, setSelection] = useState<Goal | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await supabaseUserFetch(`/rest/v1/user_onboarding?select=goal,status&user_id=eq.${encodeURIComponent(userId)}&limit=1`);
        if (!response.ok) throw new Error("Não foi possível verificar suas preferências.");
        const rows = await response.json() as RecordRow[];
        if (active) setStatus(rows.length ? "done" : "choose");
      } catch (error) {
        if (active) { setStatus("error"); setMessage(error instanceof Error ? error.message : "Não foi possível carregar suas boas-vindas."); }
      }
    };
    void load();
    return () => { active = false; };
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
      setStatus(goal ? "saved" : "done");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar sua preferência.");
    } finally { setBusy(false); }
  }

  if (status === "loading" || status === "done") return null;
  if (status === "error") {
    return <p role="alert" className="rounded-lg border border-border p-3 text-sm text-muted-foreground">{message} <button className="ml-2 font-semibold text-primary underline" type="button" onClick={() => window.location.reload()}>Tentar novamente</button></p>;
  }

  const chosen = goals.find((item) => item.value === selection);

  return (
    <section className="rounded-2xl border border-primary/25 bg-card p-5 sm:p-6" aria-labelledby="welcome-title">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary"><Sparkles className="size-4" /> Seu primeiro passo no Kivai</div>
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
          <h2 id="welcome-title" className="mt-2 text-xl font-semibold">Boas-vindas, {firstName}!</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">Para começar, em que tipo de tarefa o Kivai pode ajudar você? Escolha uma área e veja por onde explorar. Isso não altera seu plano.</p>
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
            <button type="button" disabled={busy} onClick={() => void save(null)} className="px-2 py-2 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50">Agora não</button>
          </div>
          {message ? <p role="alert" className="mt-2 text-sm text-red-400">{message}</p> : null}
        </>
      )}
    </section>
  );
}
