"use client";

import { useMemo, useState } from "react";
import JSZip from "jszip";
import { Search, Upload, Users } from "lucide-react";
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

export function InstagramFollowAnalyzer() {
  const [result, setResult] = useState<AnalyzerResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("notFollowingBack");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [fileName, setFileName] = useState("");

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

  const tabs: Array<{ key: TabKey; label: string; count: number }> = [
    { key: "notFollowingBack", label: "Não seguem você", count: result?.notFollowingBack.length ?? 0 },
    { key: "youDoNotFollow", label: "Você não segue", count: result?.youDoNotFollow.length ?? 0 },
    { key: "mutuals", label: "Seguidores mútuos", count: result?.mutuals.length ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <section className="border border-white/10 bg-card p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
            <Users className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Importe seus dados da Meta</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Envie o arquivo importado do Instagram e aguarde a análise completa.
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
    </div>
  );
}
