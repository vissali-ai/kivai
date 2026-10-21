"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Settings2, ExternalLink, Save, Trash2, Loader2, Undo2 } from "lucide-react";
import type { EditorialTopic, EditorialTopicInput } from "@/lib/news-agent/editorial-topics";
import type { NewsSource } from "@/lib/news-agent/types";
import type { EditorialResearchResponse, EditorialResearchResult, SearchPeriod, SearchRegion } from "@/lib/news-agent/editorial-links";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GeminiFreeModelPicker } from "@/components/admin/gemini-free-model-picker";

const categoryOptions = [
  ["tecnologia", "Tecnologia"],
  ["inteligencia-artificial", "Inteligência Artificial"],
  ["marketing", "Marketing"],
  ["e-commerce", "E-commerce"],
  ["noticias", "Notícias"],
] as const;

async function readJson(response: Response) {
  const data = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Não foi possível concluir a operação.");
  return data;
}

export function EditorialResearchPanel({ initialTopics, initialSources }: {
  initialTopics: EditorialTopic[];
  initialSources: Pick<NewsSource, "id" | "name" | "enabled" | "editorialTopicSlugs">[];
}) {
  const router = useRouter();
  const [topics, setTopics] = useState(initialTopics);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [directSourceUrl, setDirectSourceUrl] = useState("");
  const [period, setPeriod] = useState<SearchPeriod>("7d");
  const [region, setRegion] = useState<SearchRegion>("brasil");
  const [draftModel, setDraftModel] = useState("auto");
  const [results, setResults] = useState<EditorialResearchResponse | null>(null);
  const [message, setMessage] = useState("");
  const [researching, setResearching] = useState(false);
  const [savingUrl, setSavingUrl] = useState("");
  const [dismissingUrl, setDismissingUrl] = useState("");
  const [dismissedInSession, setDismissedInSession] = useState<EditorialResearchResult[]>([]);
  const [manage, setManage] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditorialTopicInput>({ name: "", searchTerms: "", categorySlug: "tecnologia", enabled: true });
  const [working, setWorking] = useState(false);
  const enabled = useMemo(() => topics.filter((topic) => topic.enabled), [topics]);
  const allSelected = enabled.length > 0 && selected.length === enabled.length;

  function toggleTopic(id: string) {
    setSelected((old) => old.includes(id) ? old.filter((value) => value !== id) : [...old, id]);
  }

  async function search() {
    if ((!selected.length && !query.trim()) || researching) return;
    setResearching(true);
    setResults(null);
    setDismissedInSession([]);
    setMessage("Buscando links reais nas fontes de notícias cadastradas no Kivai...");
    try {
      const response = await fetch("/api/admin/news-agent/research", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics: selected, query: query.trim(), period, region }),
      });
      const data = await readJson(response) as EditorialResearchResponse;
      setResults(data);
      setMessage(data.notice);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha na pesquisa.");
    } finally { setResearching(false); }
  }

  async function saveDraft(result: EditorialResearchResult) {
    if (savingUrl) return;
    setSavingUrl(result.sourceUrl);
    setMessage("Lendo a fonte com Gemini e preparando uma reportagem-base completa...");
    try {
      const response = await fetch("/api/admin/news-agent/draft", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result, model: draftModel }),
      });
      const data = await readJson(response) as { id: string; existing?: boolean };
      router.push("/admin/blog/" + data.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao criar rascunho.");
    } finally { setSavingUrl(""); }
  }

  async function dismissSuggestion(item: EditorialResearchResult) {
    if (dismissingUrl || savingUrl) return;
    setDismissingUrl(item.sourceUrl);
    try {
      await readJson(await fetch("/api/admin/news-agent/dismiss", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl: item.sourceUrl }),
      }));
      setResults((old) => old ? { ...old, items: old.items.filter((article) => article.sourceUrl !== item.sourceUrl) } : old);
      setDismissedInSession((old) => [item, ...old.filter((entry) => entry.sourceUrl !== item.sourceUrl)].slice(0, 8));
      setMessage("Sugestão descartada. Ela não voltará às próximas pesquisas; use Desfazer para restaurá-la.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível descartar a sugestão.");
    } finally { setDismissingUrl(""); }
  }
  async function restoreSuggestion(item: EditorialResearchResult) {
    if (dismissingUrl) return;
    setDismissingUrl(item.sourceUrl);
    try {
      await readJson(await fetch("/api/admin/news-agent/dismiss", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl: item.sourceUrl }),
      }));
      setDismissedInSession((old) => old.filter((entry) => entry.sourceUrl !== item.sourceUrl));
      setResults((old) => old && !old.items.some((entry) => entry.sourceUrl === item.sourceUrl)
        ? { ...old, items: [item, ...old.items] } : old);
      setMessage("Sugestão restaurada para a curadoria.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível restaurar."); }
    finally { setDismissingUrl(""); }
  }

  async function reloadTopics() {
    const response = await fetch("/api/admin/news-agent/topics", { cache: "no-store" });
    const data = await readJson(response) as unknown as EditorialTopic[];
    setTopics(data);
    setSelected((previous) => previous.filter((id) => data.some((topic) => topic.id === id && topic.enabled)));
  }

  function beginEdit(topic?: EditorialTopic) {
    setEditing(topic?.id || "new");
    setEdit(topic ? { name: topic.name, searchTerms: topic.searchTerms, categorySlug: topic.categorySlug, enabled: topic.enabled }
      : { name: "", searchTerms: "", categorySlug: "tecnologia", enabled: true });
    setMessage("");
  }

  async function saveTheme() {
    if (working || !editing) return;
    setWorking(true);
    try {
      const path = editing === "new" ? "/api/admin/news-agent/topics" : "/api/admin/news-agent/topics/" + editing;
      await readJson(await fetch(path, {
        method: editing === "new" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(edit),
      }));
      await reloadTopics();
      setEditing(null);
      setMessage("Tema salvo com sucesso.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível salvar o tema."); }
    finally { setWorking(false); }
  }

  async function removeTheme(topic: EditorialTopic) {
    if (working || !window.confirm("Excluir o tema " + topic.name + "? As matérias existentes serão preservadas.")) return;
    setWorking(true);
    try {
      const response = await fetch("/api/admin/news-agent/topics/" + topic.id, { method: "DELETE" });
      if (!response.ok) await readJson(response);
      await reloadTopics();
      setEditing(null);
      setMessage("Tema excluído. As matérias publicadas e rascunhos não foram alterados.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível excluir o tema."); }
    finally { setWorking(false); }
  }

  return <div className="space-y-6">
    <section className="space-y-5 rounded-lg border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-lg font-semibold">Encontrar reportagens para o Kivai</h2>
          <p className="mt-1 text-sm text-muted-foreground">Encontre links publicados por fontes verificadas, escolhendo temas, período e palavras-chave. O Gemini continua responsável por gerar o rascunho.</p></div>
        <Button size="sm" variant="outline" onClick={() => { setManage((old) => !old); setEditing(null); }}><Settings2 className="mr-2 size-4" />{manage ? "Fechar temas" : "Gerenciar temas"}</Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Temas predefinidos ({selected.length} selecionados)</h3>
        {selected.length > 0 && <Button type="button" size="sm" variant="ghost" onClick={() => setSelected([])}>Limpar seleção</Button>}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-primary/40 px-3 py-2 text-sm font-semibold">
          <input type="checkbox" checked={allSelected} onChange={(event) =>
            setSelected(event.target.checked ? enabled.map((topic) => topic.id) : [])} className="size-4 accent-primary" />
          <span>Todos</span>
        </label>
        {enabled.map((topic) => <label key={topic.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2 text-sm hover:border-primary/50">
          <input type="checkbox" checked={selected.includes(topic.id)} onChange={() => toggleTopic(topic.id)} className="size-4 accent-primary" />
          <span>{topic.name}</span></label>)}
      </div>
      {!enabled.length && <p className="text-sm text-amber-300">Nenhum tema ativo. Cadastre um tema em Gerenciar temas.</p>}
      <label className="block space-y-2 text-sm"><span className="font-medium">Busca personalizada (opcional)</span>
        <Input maxLength={200} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: novos recursos do Google Ads para pequenas empresas" /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2 text-sm"><span className="font-medium">Período</span>
          <select className="h-10 w-full rounded-md border border-input bg-background px-3" value={period} onChange={(e) => setPeriod(e.target.value as SearchPeriod)}>
            <option value="24h">Últimas 24 horas</option><option value="7d">Últimos 7 dias</option><option value="30d">Últimos 30 dias</option>
          </select></label>
        <label className="space-y-2 text-sm"><span className="font-medium">Origem das fontes</span>
          <select className="h-10 w-full rounded-md border border-input bg-background px-3" value={region} onChange={(e) => setRegion(e.target.value as SearchRegion)}>
            <option value="brasil">Brasil</option><option value="internacional">Internacional</option><option value="ambos">Brasil e internacional</option>
          </select></label>
      </div>
      <Button disabled={researching || (!selected.length && !query.trim())} onClick={search}>
        {researching ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Search className="mr-2 size-4" />}
        {researching ? "Pesquisando..." : "Pesquisar matérias"}
      </Button>
      <div className="space-y-2 rounded-md border border-border p-3">
        <h3 className="text-sm font-medium">Criar rascunho a partir do link de uma reportagem</h3>
        <p className="text-xs text-muted-foreground">Cole a URL de uma matéria pública. O Gemini preparará uma reportagem-base completa no rascunho e guardará a fonte.</p>
        <GeminiFreeModelPicker task="url" value={draftModel} onChange={setDraftModel} label="Modelo Gemini para criar reportagem-base" />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input type="url" placeholder="https://site.com.br/materia" value={directSourceUrl}
            onChange={(event) => setDirectSourceUrl(event.target.value)} />
          <Button variant="outline" disabled={Boolean(savingUrl) || !directSourceUrl.trim()} onClick={() => void saveDraft({
            title: "", excerpt: "", sourceName: "", sourceUrl: directSourceUrl.trim(),
            publishedAt: null, categorySlug: "noticias",
          })}>
            {savingUrl === directSourceUrl.trim() ? <Loader2 className="mr-1 size-4 animate-spin" /> : <Save className="mr-1 size-4" />}
            Preparar rascunho
          </Button>
        </div>
      </div>
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{message}</p>
      {/\b(cota|limite|429|faturamento)\b/i.test(message) && /Gemini|modelo|projeto/i.test(message) ? <p className="text-xs leading-relaxed text-muted-foreground">
        Consulte o projeto da chave utilizada em <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline">Google AI Studio</a>
        , na área Dashboard &gt; Usage e Rate limits. Se o limite for diário ou a cota for zero, repetir a busca imediatamente não resolverá.
      </p> : null}
    </section>

    {manage && <section className="space-y-4 rounded-lg border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-semibold">Gerenciar temas editoriais</h2><p className="text-xs text-muted-foreground">Altere, desative ou exclua temas sem modificar as categorias públicas do blog.</p></div>
        <Button size="sm" variant="outline" onClick={() => beginEdit()}><Plus className="mr-1 size-4" />Novo tema</Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic) => <div key={topic.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2">
          <span className="truncate text-sm">{topic.name} {!topic.enabled && <small className="text-muted-foreground">(pausado)</small>}</span>
          <Button size="sm" variant="outline" onClick={() => beginEdit(topic)}>Editar</Button></div>)}
      </div>
      {editing && <div className="space-y-3 rounded-lg border border-border p-4">
        <h3 className="font-medium">{editing === "new" ? "Adicionar tema" : "Editar tema"}</h3>
        <label className="block space-y-1 text-sm"><span>Nome do tema</span><Input value={edit.name} maxLength={80} onChange={(e) => setEdit((old) => ({...old,name:e.target.value}))}/></label>
        <label className="block space-y-1 text-sm"><span>Termos e tópicos para pesquisa</span><textarea className="min-h-20 w-full rounded-md border border-input bg-background p-2" maxLength={350} value={edit.searchTerms} onChange={(e) => setEdit((old) => ({...old,searchTerms:e.target.value}))}/></label>
        <label className="block space-y-1 text-sm"><span>Categoria sugerida para a pauta</span><select className="h-10 w-full border border-input bg-background px-2" value={edit.categorySlug} onChange={(e) => setEdit((old) => ({...old,categorySlug:e.target.value}))}>
          {categoryOptions.map(([slug,label]) => <option key={slug} value={slug}>{label}</option>)}
        </select></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={edit.enabled} onChange={(e) => setEdit((old) => ({...old,enabled:e.target.checked}))}/>Tema ativo</label>
        <div className="flex flex-wrap gap-2">
          <Button disabled={working || !edit.name.trim() || !edit.searchTerms.trim()} onClick={saveTheme}><Save className="mr-1 size-4"/>Salvar tema</Button>
          <Button variant="outline" disabled={working} onClick={() => setEditing(null)}>Cancelar</Button>
          {editing !== "new" && <Button variant="destructive" disabled={working} onClick={() => {const topic=topics.find((t)=>t.id===editing);if(topic)void removeTheme(topic);}}><Trash2 className="mr-1 size-4"/>Excluir</Button>}
        </div>
      </div>}
    </section>}

    <details className="rounded-lg border border-border bg-card p-4">
      <summary className="cursor-pointer text-sm font-semibold">Fontes da curadoria por tema ({initialSources.filter((source) => source.enabled).length} fontes ativas)</summary>
      <p className="mt-2 text-xs text-muted-foreground">Veículos, blogs especializados e fontes oficiais associados aos temas do Radar Editorial. O acesso aos feeds pode variar conforme o veículo.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {topics.map((topic) => {
          const sources = initialSources.filter((source) => source.enabled && source.editorialTopicSlugs.includes(topic.slug));
          return <div className="min-w-0 space-y-1 rounded-md border border-border p-3" key={topic.id}>
            <h3 className="text-sm font-semibold">{topic.name} ({sources.length})</h3>
            <p className="text-xs leading-5 text-muted-foreground">{sources.length ? sources.map((source) => source.name).join(" · ") : "Nenhuma fonte mapeada no momento."}</p>
          </div>;
        })}
      </div>
    </details>

    {results && <section className="space-y-4">
      <div><h2 className="text-lg font-semibold">Links de reportagens ({results.items.length})</h2>
        <p className="text-xs text-muted-foreground">{results.notice}</p></div>
      <div className="grid gap-3 lg:grid-cols-2">
        {results.items.map((item) => <article key={item.sourceUrl} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <h3 className="text-base font-semibold leading-snug">{item.title}</h3>
          <p className="text-xs text-muted-foreground">{item.sourceName} {item.publishedAt ? "· Data indicada: " + new Date(item.publishedAt).toLocaleDateString("pt-BR") : "· Data a confirmar na fonte"}</p>
          <p className="flex-1 text-sm text-muted-foreground">{item.excerpt || "Consulte a fonte original para obter os detalhes da matéria."}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1 size-4"/>Ver fonte</a></Button>
            <Button size="sm" disabled={Boolean(savingUrl)} onClick={() => saveDraft(item)}>
              {savingUrl === item.sourceUrl ? <Loader2 className="mr-1 size-4 animate-spin"/> : <Save className="mr-1 size-4"/>}
              Salvar pauta como rascunho
            </Button>
            <Button variant="outline" size="sm" disabled={Boolean(dismissingUrl) || Boolean(savingUrl)} onClick={() => void dismissSuggestion(item)}>
              {dismissingUrl === item.sourceUrl ? <Loader2 className="mr-1 size-4 animate-spin"/> : <Trash2 className="mr-1 size-4"/>}Descartar sugestão
            </Button>
          </div>
        </article>)}
      </div>
      {dismissedInSession.length > 0 && <div className="space-y-2 rounded-md border border-border p-3">
        <p className="text-sm font-medium">Sugestões descartadas nesta pesquisa</p>
        {dismissedInSession.map((item) => <div key={item.sourceUrl} className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="min-w-0 flex-1">{item.title}</span>
          <Button size="sm" variant="ghost" disabled={Boolean(dismissingUrl)} onClick={() => void restoreSuggestion(item)}><Undo2 className="mr-1 size-4"/>Desfazer</Button>
        </div>)}
      </div>}
    </section>}
  </div>;
}
