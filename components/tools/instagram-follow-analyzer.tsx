"use client";

import { useMemo, useState } from "react";
import JSZip from "jszip";
import { AlertTriangle, CheckCircle2, Search, Upload, Users } from "lucide-react";
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

function parseVisibleCount(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(/\D/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function InstagramFollowAnalyzer() {
  const [result, setResult] = useState<AnalyzerResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("notFollowingBack");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [fileName, setFileName] = useState("");
  const [visibleFollowers, setVisibleFollowers] = useState("");
  const [visibleFollowing, setVisibleFollowing] = useState("");

  const currentList = result?.[activeTab] ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase().replace(/^@/, "");
    if (!term) return currentList;
    return currentList.filter((username) => username.includes(term));
  }, [currentList, search]);

  const verification = useMemo(() => {
    if (!result) return null;
    const currentFollowers = parseVisibleCount(visibleFollowers);
    const currentFollowing = parseVisibleCount(visibleFollowing);
    const followersMatch = currentFollowers === null ? null : currentFollowers === result.followers.length;
    const followingMatch = currentFollowing === null ? null : currentFollowing === result.following.length;

    return {
      currentFollowers,
      currentFollowing,
      followersMatch,
      followingMatch,
      hasMismatch: followersMatch === false || followingMatch === false,
      fullyChecked: followersMatch !== null && followingMatch !== null,
    };
  }, [result, visibleFollowers, visibleFollowing]);

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
              Envie o ZIP exportado pela Meta. Para aumentar a confiabilidade, informe também os números que aparecem hoje no seu perfil do Instagram. O Kivai compara os contadores visíveis com a exportação antes de classificar o relatório.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="visible-followers" className="text-sm font-medium">Seguidores visíveis no Instagram</label>
            <Input id="visible-followers" inputMode="numeric" value={visibleFollowers} onChange={(event) => setVisibleFollowers(event.target.value)} placeholder="Ex.: 675" className="mt-2" />
          </div>
          <div>
            <label htmlFor="visible-following" className="text-sm font-medium">Seguindo visível no Instagram</label>
            <Input id="visible-following" inputMode="numeric" value={visibleFollowing} onChange={(event) => setVisibleFollowing(event.target.value)} placeholder="Ex.: 592" className="mt-2" />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Opcional, mas recomendado. Esses números servem apenas para validar a consistência da exportação.</p>

        <label className="mt-6 flex cursor-pointer flex-col items-center justify-center border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center transition hover:border-primary/40 hover:bg-primary/[0.03]">
          <Upload className="mb-3 size-6 text-primary" />
          <span className="font-medium">Selecionar arquivo ZIP ou JSON</span>
          <span className="mt-1 text-xs text-muted-foreground">Plano grátis: até 50 mil seguidores</span>
          <input type="file" accept=".zip,.json,application/zip,application/json" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
        </label>

        {fileName ? <p className="mt-3 text-xs text-muted-foreground">Arquivo: {fileName}</p> : null}
        {pending ? <p className="mt-4 text-sm text-primary">Analisando dados...</p> : null}
        {error ? <p className="mt-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
      </section>

      {result ? (
        <section className="space-y-5">
          {verification?.hasMismatch ? (
            <div className="flex gap-3 border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-400" />
              <div>
                <p className="font-semibold text-amber-200">A exportação diverge do perfil atual</p>
                <p className="mt-1 leading-6 text-amber-100/80">
                  A Meta pode manter registros históricos ou indisponíveis no arquivo. O Kivai mostra o cruzamento encontrado, mas não considera este relatório totalmente confirmado enquanto houver diferença nos contadores.
                </p>
              </div>
            </div>
          ) : verification?.fullyChecked ? (
            <div className="flex gap-3 border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" />
              <div>
                <p className="font-semibold text-emerald-200">Exportação consistente com o perfil</p>
                <p className="mt-1 text-emerald-100/80">Os totais informados no Instagram coincidem com os registros encontrados na exportação.</p>
              </div>
            </div>
          ) : (
            <div className="border border-white/10 bg-white/[0.02] p-4 text-sm text-muted-foreground">
              Relatório não verificado pelos contadores do perfil. Informe os números visíveis de seguidores e seguindo acima para validar a exportação.
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            {tabs.map((tab) => (
              <Button key={tab.key} type="button" variant={activeTab === tab.key ? "default" : "outline"} className="h-auto justify-between px-4 py-4" onClick={() => setActiveTab(tab.key)}>
                <span>{tab.label}</span>
                <span className="text-sm tabular-nums">{tab.count.toLocaleString("pt-BR")}</span>
              </Button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border border-white/10 bg-card p-4">
              <p className="text-xs text-muted-foreground">Seguidores encontrados na exportação</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{result.followers.length.toLocaleString("pt-BR")}</p>
              {verification && verification.currentFollowers !== null ? <p className="mt-1 text-xs text-muted-foreground">Perfil informado: {verification.currentFollowers.toLocaleString("pt-BR")}</p> : null}
            </div>
            <div className="border border-white/10 bg-card p-4">
              <p className="text-xs text-muted-foreground">Registros de seguindo na exportação</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{result.following.length.toLocaleString("pt-BR")}</p>
              {verification && verification.currentFollowing !== null ? <p className="mt-1 text-xs text-muted-foreground">Perfil informado: {verification.currentFollowing.toLocaleString("pt-BR")}</p> : null}
            </div>
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
