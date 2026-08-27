"use client";

import { useMemo, useState } from "react";
import JSZip from "jszip";
import { ArrowDown, ChevronDown, ExternalLink, Search, Upload, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AnalyzerResult = {
  followers: string[];
  following: string[];
  notFollowingBack: string[];
  youDoNotFollow: string[];
  mutuals: string[];
};

type TabKey = "notFollowingBack" | "youDoNotFollow" | "mutuals";
type FileKind = "followers" | "following" | null;

const FREE_FOLLOWER_LIMIT = 50000;
const META_EXPORT_URL = "https://accountscenter.instagram.com/info_and_permissions/dyi/?theme=dark";
const TUTORIAL_SPRITE_URL = "/api/instagram-tutorial-sprite";

const tutorialSteps = [
  ["Criar exportação", "Na página de exportação da Central de Contas, clique em Criar exportação."],
  ["Escolher para onde exportar", "Selecione Exportar para serviço externo para continuar."],
  ["Escolher Google Drive", "Selecione Google Drive. É a opção que recomendamos para uma experiência mais simples."],
  ["Escolher a frequência", "Escolha a frequência que fizer mais sentido para você. Para uma análise pontual, Uma vez é suficiente."],
  ["Conectar sua conta", "Clique em Conectar e autorize sua conta do Google Drive para receber a exportação."],
  ["Personalizar informações", "Na tela de confirmação da exportação, entre em Personalizar informações."],
  ["Deixar somente Conexões", "Para a análise gratuita, deixe marcada apenas a seção Conexões, com Contatos e Seguidores e Seguindo, e salve."],
  ["Selecionar Desde o início", "Abra Intervalo de datas, escolha Desde o início e salve. Isso evita uma exportação incompleta."],
  ["Escolher JSON e iniciar", "Em Formato, escolha JSON, salve e clique em Iniciar exportação. A Meta enviará uma confirmação por e-mail quando o arquivo estiver pronto. O processo pode levar cerca de 10 minutos."],
] as const;

function normalizeUsername(value: unknown) {
  if (typeof value !== "string") return null;
  const clean = value.trim().replace(/^@/, "");
  if (!clean || clean.includes(" ")) return null;
  return clean.toLowerCase();
}

function classifyFile(path: string): FileKind {
  const base = path.split("/").pop()?.toLowerCase() ?? "";
  if (/^(followers|seguidores)(?:_\d+)?\.json$/.test(base)) return "followers";
  if (/^(following|seguindo)\.json$/.test(base)) return "following";
  return null;
}

function extractFollowers(parsed: unknown) {
  const output = new Set<string>();
  if (!Array.isArray(parsed)) return output;
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const list = Array.isArray((item as Record<string, unknown>).string_list_data)
      ? ((item as Record<string, unknown>).string_list_data as unknown[])
      : [];
    for (const entry of list) {
      if (!entry || typeof entry !== "object") continue;
      const username = normalizeUsername((entry as Record<string, unknown>).value);
      if (username) output.add(username);
    }
  }
  return output;
}

function extractFollowing(parsed: unknown) {
  const output = new Set<string>();
  if (!parsed || typeof parsed !== "object") return output;
  const relationships = (parsed as Record<string, unknown>).relationships_following;
  if (!Array.isArray(relationships)) return output;
  for (const item of relationships) {
    if (!item || typeof item !== "object") continue;
    const username = normalizeUsername((item as Record<string, unknown>).title);
    if (username) output.add(username);
  }
  return output;
}

async function addJson(name: string, text: string, followers: Set<string>, following: Set<string>) {
  const kind = classifyFile(name);
  if (!kind) return;
  const parsed = JSON.parse(text) as unknown;
  const usernames = kind === "followers" ? extractFollowers(parsed) : extractFollowing(parsed);
  for (const username of usernames) {
    if (kind === "followers") followers.add(username);
    else following.add(username);
  }
}

async function analyzeFile(file: File): Promise<AnalyzerResult> {
  const followers = new Set<string>();
  const following = new Set<string>();

  if (file.name.toLowerCase().endsWith(".zip")) {
    const zip = await JSZip.loadAsync(file);
    const entries = Object.values(zip.files).filter((entry) => !entry.dir && classifyFile(entry.name));
    for (const entry of entries) await addJson(entry.name, await entry.async("text"), followers, following);
  } else if (file.name.toLowerCase().endsWith(".json")) {
    await addJson(file.name, await file.text(), followers, following);
  } else {
    throw new Error("Envie o arquivo ZIP da Meta ou um arquivo JSON de seguidores/seguindo.");
  }

  if (!followers.size || !following.size) {
    throw new Error("Não localizamos os dois arquivos necessários: seguidores e seguindo. Gere a exportação da Meta incluindo Seguidores e Seguindo em JSON.");
  }
  if (followers.size > FREE_FOLLOWER_LIMIT) {
    throw new Error(`O plano gratuito analisa até ${FREE_FOLLOWER_LIMIT.toLocaleString("pt-BR")} seguidores.`);
  }

  const notFollowingBack = [...following].filter((username) => !followers.has(username)).sort();
  const youDoNotFollow = [...followers].filter((username) => !following.has(username)).sort();
  const mutuals = [...followers].filter((username) => following.has(username)).sort();

  return {
    followers: [...followers].sort(),
    following: [...following].sort(),
    notFollowingBack,
    youDoNotFollow,
    mutuals,
  };
}

function SpriteSlice({ index, large = false }: { index: number; large?: boolean }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex aspect-[9/16] w-full items-center justify-center border border-red-500/20 bg-red-500/5 p-4 text-center text-xs text-red-200">
        Não foi possível carregar esta imagem do tutorial.
      </div>
    );
  }

  return (
    <span className="relative block aspect-[9/16] w-full overflow-hidden bg-black">
      <img
        src={TUTORIAL_SPRITE_URL}
        alt=""
        aria-hidden="true"
        loading={large ? "eager" : "lazy"}
        onError={() => setFailed(true)}
        className="absolute left-0 w-full max-w-none select-none"
        style={{ top: `-${index * 100}%` }}
        draggable={false}
      />
    </span>
  );
}

export function InstagramFollowAnalyzerV2() {
  const [result, setResult] = useState<AnalyzerResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("notFollowingBack");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [fileName, setFileName] = useState("");
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [expandedScreenshot, setExpandedScreenshot] = useState<number | null>(null);

  const currentList = result?.[activeTab] ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase().replace(/^@/, "");
    return term ? currentList.filter((username) => username.includes(term)) : currentList;
  }, [currentList, search]);

  async function handleFile(file?: File) {
    if (!file) return;
    setPending(true);
    setError("");
    setResult(null);
    setFileName(file.name);
    try {
      setResult(await analyzeFile(file));
      setActiveTab("notFollowingBack");
      setSearch("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível analisar o arquivo.");
    } finally {
      setPending(false);
    }
  }

  const tabs: Array<{ key: TabKey; label: string; count: number }> = [
    { key: "notFollowingBack", label: "Não seguem você", count: result?.notFollowingBack.length ?? 0 },
    { key: "youDoNotFollow", label: "Você não segue", count: result?.youDoNotFollow.length ?? 0 },
    { key: "mutuals", label: "Seguidores mútuos", count: result?.mutuals.length ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <section className="border border-primary/20 bg-primary/[0.025]">
        <button type="button" onClick={() => setTutorialOpen((value) => !value)} className="flex w-full items-center justify-between gap-4 p-6 text-left sm:p-8" aria-expanded={tutorialOpen}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Precisa de ajuda?</p>
            <h2 className="mt-2 text-xl font-semibold sm:text-2xl">Confira o passo a passo abaixo</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Para analisar quem não te segue de volta, primeiro você precisa exportar seu arquivo do Instagram pela Central de Contas da Meta.</p>
          </div>
          <ChevronDown className={`size-5 shrink-0 text-primary transition ${tutorialOpen ? "rotate-180" : ""}`} />
        </button>

        {tutorialOpen ? (
          <div className="border-t border-white/10 px-6 pb-8 pt-6 sm:px-8">
            <div className="flex flex-col gap-3 border border-white/10 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-muted-foreground">O botão abaixo leva diretamente à página oficial usada para gerar a exportação.</p>
              <a href={META_EXPORT_URL} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90">Abrir página oficial da Meta <ExternalLink className="size-4" /></a>
            </div>

            <div className="mt-8 space-y-8">
              {tutorialSteps.map(([title, description], index) => (
                <article key={title} className="grid gap-5 border-b border-white/10 pb-8 last:border-b-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_300px] md:items-start">
                  <div className="md:pt-3">
                    <span className="inline-flex border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Passo {index + 1} de {tutorialSteps.length}</span>
                    <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
                    {index === 7 ? <p className="mt-3 border-l-2 border-primary pl-3 text-sm leading-6 text-foreground/90">Importante: escolha <strong>Desde o início</strong>. Um intervalo menor pode deixar pessoas de fora da análise.</p> : null}
                  </div>
                  <button type="button" onClick={() => setExpandedScreenshot(index)} className="group relative mx-auto block w-full max-w-[300px] overflow-hidden border border-white/10 bg-black text-left transition hover:border-primary/40" aria-label={`Ampliar imagem do passo ${index + 1}`}>
                    <SpriteSlice index={index} />
                    <span className="absolute inset-x-0 bottom-0 bg-black/75 px-3 py-2 text-center text-xs text-white opacity-0 transition group-hover:opacity-100">Clique para ampliar</span>
                  </button>
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center text-center">
              <p className="text-lg font-semibold">Pronto para exportar? Clique no botão abaixo</p>
              <ArrowDown className="mt-3 size-7 text-primary" aria-hidden="true" />
            </div>
          </div>
        ) : null}
      </section>

      <section id="instagram-analyzer-upload" className="scroll-mt-24 border border-white/10 bg-card p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center border border-primary/30 bg-primary/10 text-primary"><Users className="size-5" /></div>
          <div><h2 className="text-xl font-semibold">Importe seus dados do Instagram</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Envie o arquivo exportado do Instagram e aguarde a análise completa.</p></div>
        </div>
        <label className="mt-6 flex cursor-pointer flex-col items-center justify-center border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center transition hover:border-primary/40 hover:bg-primary/[0.03]">
          <Upload className="mb-3 size-6 text-primary" /><span className="font-medium">Selecione o arquivo ZIP ou JSON</span>
          <input type="file" accept=".zip,.json,application/zip,application/json" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
        </label>
        {fileName ? <p className="mt-3 text-xs text-muted-foreground">Arquivo: {fileName}</p> : null}
        {pending ? <p className="mt-4 text-sm text-primary">Analisando dados...</p> : null}
        {error ? <p className="mt-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
      </section>

      {result ? (
        <section className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {tabs.map((tab) => <Button key={tab.key} type="button" variant={activeTab === tab.key ? "default" : "outline"} className="h-auto justify-between px-4 py-4" onClick={() => setActiveTab(tab.key)}><span>{tab.label}</span><span className="text-sm tabular-nums">{tab.count.toLocaleString("pt-BR")}</span></Button>)}
          </div>
          <div className="border border-white/10 bg-card">
            <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><h3 className="font-semibold">{tabs.find((tab) => tab.key === activeTab)?.label}</h3><p className="mt-1 text-xs text-muted-foreground">Cruzamento dos @ presentes nos arquivos oficiais da Meta.</p></div>
              <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar @" className="h-10 pl-9" /></div>
            </div>
            <div className="max-h-[520px] overflow-auto">
              {filtered.length ? filtered.map((username) => <div key={username} className="flex items-center justify-between border-b border-white/5 px-4 py-3 last:border-b-0"><span className="text-sm font-medium">@{username}</span><a href={`https://www.instagram.com/${encodeURIComponent(username)}/`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Abrir Instagram</a></div>) : <p className="p-6 text-sm text-muted-foreground">Nenhum perfil encontrado.</p>}
            </div>
          </div>
        </section>
      ) : null}

      {expandedScreenshot !== null ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-label={`Passo ${expandedScreenshot + 1}`} onClick={() => setExpandedScreenshot(null)}>
          <div className="relative max-h-[92vh] w-full max-w-[620px] overflow-auto bg-black" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setExpandedScreenshot(null)} className="sticky right-3 top-3 z-10 ml-auto mr-3 mt-3 flex size-10 items-center justify-center bg-black/80 text-white" aria-label="Fechar imagem"><X className="size-5" /></button>
            <div className="mx-auto w-full max-w-[600px] overflow-hidden"><SpriteSlice index={expandedScreenshot} large /></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
