"use client";

import { useMemo, useState } from "react";
import JSZip from "jszip";
import { ChevronDown, ExternalLink, Search, Upload, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INSTAGRAM_TUTORIAL_SPRITE_1 } from "@/lib/instagram-tutorial-sprite-1";
import { INSTAGRAM_TUTORIAL_SPRITE_2 } from "@/lib/instagram-tutorial-sprite-2";
import { INSTAGRAM_TUTORIAL_SPRITE_3 } from "@/lib/instagram-tutorial-sprite-3";
import { INSTAGRAM_TUTORIAL_SPRITE_4 } from "@/lib/instagram-tutorial-sprite-4";

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
const TUTORIAL_SPRITE = `data:image/webp;base64,${INSTAGRAM_TUTORIAL_SPRITE_1}${INSTAGRAM_TUTORIAL_SPRITE_2}${INSTAGRAM_TUTORIAL_SPRITE_3}${INSTAGRAM_TUTORIAL_SPRITE_4}`;

const tutorialSteps = [
  {
    title: "Criar exportação",
    description: "Na página de exportação da Central de Contas, clique em Criar exportação.",
  },
  {
    title: "Escolher para onde exportar",
    description: "Selecione Exportar para serviço externo para continuar.",
  },
  {
    title: "Escolher Google Drive",
    description: "Selecione Google Drive. É a opção que recomendamos para uma experiência mais simples.",
  },
  {
    title: "Escolher a frequência",
    description: "Escolha a frequência que fizer mais sentido para você e avance. Para uma análise pontual, Uma vez é suficiente.",
  },
  {
    title: "Conectar sua conta",
    description: "Clique em Conectar e autorize sua conta do Google Drive para receber a exportação.",
  },
  {
    title: "Personalizar informações",
    description: "Na tela de confirmação da exportação, entre em Personalizar informações.",
  },
  {
    title: "Deixar somente Conexões",
    description: "Para a análise gratuita, deixe marcada apenas a seção Conexões, com os dados de Contatos e Seguidores e Seguindo, e salve.",
  },
  {
    title: "Selecionar Desde o início",
    description: "Abra Intervalo de datas, escolha Desde o início e salve. Esse ponto é importante para evitar uma exportação incompleta.",
  },
  {
    title: "Escolher JSON e iniciar",
    description: "Em Formato, escolha JSON, que é mais leve, salve e clique em Iniciar exportação. A Meta enviará uma confirmação por e-mail quando o arquivo estiver pronto. O processo pode levar cerca de 10 minutos, podendo variar conforme a conta.",
  },
] as const;

function normalizeUsername(value: unknown) {
  if (typeof value !== "string") return null;
  const clean = value.trim().replace(/^@/, "");
  if (!clean || clean.includes(" ")) return null;
  return clean.toLowerCase();
}

function getBaseName(path: string) {
  return path.split("/").pop()?.toLowerCase() ?? "";
}

function classifyFile(path: string): FileKind {
  const base = getBaseName(path);
  if (/^(followers|seguidores)(?:_\d+)?\.json$/.test(base)) return "followers";
  if (/^(following|seguindo)\.json$/.test(base)) return "following";
  return null;
}

function extractFollowers(parsed: unknown) {
  const output = new Set<string>();
  if (!Array.isArray(parsed)) return output;

  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const list = Array.isArray(record.string_list_data) ? record.string_list_data : [];

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

async function parseJsonFile(name: string, text: string, followers: Set<string>, following: Set<string>) {
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
    const jsonEntries = Object.values(zip.files).filter((entry) => !entry.dir && classifyFile(entry.name));

    for (const entry of jsonEntries) {
      const text = await entry.async("text");
      await parseJsonFile(entry.name, text, followers, following);
    }
  } else if (file.name.toLowerCase().endsWith(".json")) {
    await parseJsonFile(file.name, await file.text(), followers, following);
  } else {
    throw new Error("Envie o arquivo ZIP da Meta ou um arquivo JSON de seguidores/seguindo.");
  }

  if (!followers.size || !following.size) {
    throw new Error("Não localizamos os dois arquivos necessários: seguidores e seguindo. Gere uma exportação da Meta incluindo 'Seguidores e Seguindo' em JSON.");
  }

  if (followers.size > FREE_FOLLOWER_LIMIT) {
    throw new Error(`O plano gratuito analisa até ${FREE_FOLLOWER_LIMIT.toLocaleString("pt-BR")} seguidores. Esta exportação possui ${followers.size.toLocaleString("pt-BR")}.`);
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

function TutorialScreenshot({ index, onOpen }: { index: number; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative mx-auto block w-full max-w-[300px] overflow-hidden border border-white/10 bg-black text-left transition hover:border-primary/40"
      aria-label={`Ampliar imagem do passo ${index + 1}`}
    >
      <span
        className="block w-full"
        style={{
          aspectRatio: "300 / 533",
          backgroundImage: `url(${TUTORIAL_SPRITE})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% 900%",
          backgroundPosition: `center ${index * 12.5}%`,
        }}
      />
      <span className="absolute inset-x-0 bottom-0 bg-black/75 px-3 py-2 text-center text-xs text-white opacity-0 transition group-hover:opacity-100">
        Clique para ampliar
      </span>
    </button>
  );
}

export function InstagramFollowAnalyzer() {
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
    if (!term) return currentList;
    return currentList.filter((username) => username.includes(term));
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

  function scrollToUpload() {
    document.getElementById("instagram-analyzer-upload")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const tabs: Array<{ key: TabKey; label: string; count: number }> = [
    { key: "notFollowingBack", label: "Não seguem você", count: result?.notFollowingBack.length ?? 0 },
    { key: "youDoNotFollow", label: "Você não segue", count: result?.youDoNotFollow.length ?? 0 },
    { key: "mutuals", label: "Seguidores mútuos", count: result?.mutuals.length ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <section className="border border-primary/20 bg-primary/[0.025]">
        <button
          type="button"
          onClick={() => setTutorialOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-4 p-6 text-left sm:p-8"
          aria-expanded={tutorialOpen}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Precisa de ajuda?</p>
            <h2 className="mt-2 text-xl font-semibold sm:text-2xl">Confira o passo a passo abaixo</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Para analisar quem não te segue de volta, primeiro você precisa exportar seu arquivo do Instagram pela Central de Contas da Meta.
            </p>
          </div>
          <ChevronDown className={`size-5 shrink-0 text-primary transition ${tutorialOpen ? "rotate-180" : ""}`} />
        </button>

        {tutorialOpen ? (
          <div className="border-t border-white/10 px-6 pb-8 pt-6 sm:px-8">
            <div className="flex flex-col gap-3 border border-white/10 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-muted-foreground">
                O botão abaixo leva diretamente à página oficial usada para gerar a exportação.
              </p>
              <a
                href={META_EXPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center gap-2 bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Abrir página oficial da Meta <ExternalLink className="size-4" />
              </a>
            </div>

            <div className="mt-8 space-y-8">
              {tutorialSteps.map((step, index) => (
                <article key={step.title} className="grid gap-5 border-b border-white/10 pb-8 last:border-b-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_300px] md:items-start">
                  <div className="md:pt-3">
                    <span className="inline-flex border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      Passo {index + 1} de {tutorialSteps.length}
                    </span>
                    <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{step.description}</p>
                    {index === 7 ? (
                      <p className="mt-3 border-l-2 border-primary pl-3 text-sm leading-6 text-foreground/90">
                        Importante: escolha <strong>Desde o início</strong>. Um intervalo menor pode deixar pessoas de fora da análise.
                      </p>
                    ) : null}
                  </div>
                  <TutorialScreenshot index={index} onOpen={() => setExpandedScreenshot(index)} />
                </article>
              ))}
            </div>

            <div className="mt-8 border border-primary/20 bg-primary/[0.04] p-5 text-center sm:p-6">
              <h3 className="text-lg font-semibold">Pronto para analisar?</h3>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Depois de baixar o arquivo do Instagram, envie o arquivo ZIP ou JSON abaixo para começar sua análise.
              </p>
              <Button type="button" className="mt-4" onClick={scrollToUpload}>Enviar arquivo agora</Button>
            </div>
          </div>
        ) : null}
      </section>

      <section id="instagram-analyzer-upload" className="scroll-mt-24 border border-white/10 bg-card p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
            <Users className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Importe seus dados do Instagram</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Envie o arquivo exportado do Instagram e aguarde a análise completa.
            </p>
          </div>
        </div>

        <label className="mt-6 flex cursor-pointer flex-col items-center justify-center border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center transition hover:border-primary/40 hover:bg-primary/[0.03]">
          <Upload className="mb-3 size-6 text-primary" />
          <span className="font-medium">Selecione o arquivo ZIP ou JSON</span>
          <input type="file" accept=".zip,.json,application/zip,application/json" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
        </label>

        {fileName ? <p className="mt-3 text-xs text-muted-foreground">Arquivo: {fileName}</p> : null}
        {pending ? <p className="mt-4 text-sm text-primary">Analisando dados...</p> : null}
        {error ? <p className="mt-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
      </section>

      {result ? (
        <section className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {tabs.map((tab) => (
              <Button key={tab.key} type="button" variant={activeTab === tab.key ? "default" : "outline"} className="h-auto justify-between px-4 py-4" onClick={() => setActiveTab(tab.key)}>
                <span>{tab.label}</span>
                <span className="text-sm tabular-nums">{tab.count.toLocaleString("pt-BR")}</span>
              </Button>
            ))}
          </div>

          <div className="border border-white/10 bg-card">
            <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">{tabs.find((tab) => tab.key === activeTab)?.label}</h3>
                <p className="mt-1 text-xs text-muted-foreground">Cruzamento dos @ presentes nos arquivos oficiais da Meta.</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar @" className="h-10 pl-9" />
              </div>
            </div>

            <div className="max-h-[520px] overflow-auto">
              {filtered.length ? (
                filtered.map((username) => (
                  <div key={username} className="flex items-center justify-between border-b border-white/5 px-4 py-3 last:border-b-0">
                    <span className="text-sm font-medium">@{username}</span>
                    <a href={`https://www.instagram.com/${encodeURIComponent(username)}/`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Abrir Instagram</a>
                  </div>
                ))
              ) : (
                <p className="p-6 text-sm text-muted-foreground">Nenhum perfil encontrado.</p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {expandedScreenshot !== null ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-label={`Passo ${expandedScreenshot + 1}`} onClick={() => setExpandedScreenshot(null)}>
          <div className="relative max-h-[92vh] w-full max-w-[620px] overflow-auto bg-black" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setExpandedScreenshot(null)} className="sticky right-3 top-3 z-10 ml-auto mr-3 mt-3 flex size-10 items-center justify-center bg-black/80 text-white" aria-label="Fechar imagem">
              <X className="size-5" />
            </button>
            <div
              className="mx-auto w-full max-w-[600px]"
              style={{
                aspectRatio: "300 / 533",
                backgroundImage: `url(${TUTORIAL_SPRITE})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: "100% 900%",
                backgroundPosition: `center ${expandedScreenshot * 12.5}%`,
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
