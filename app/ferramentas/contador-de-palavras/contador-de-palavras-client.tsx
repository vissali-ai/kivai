"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  ArrowLeft,
  Check,
  Clipboard,
  Copy,
  Eraser,
  FileText,
  Gauge,
  Hash,
  List,
  MessageSquareText,
  Mic2,
  Pilcrow,
  Timer,
  Type,
} from "lucide-react";

import { AdSlot } from "@/components/ads/ad-slot";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Preset = {
  id: string;
  titulo: string;
  limite: number;
  descricao: string;
};

const PRESETS: Preset[] = [
  {
    id: "meta-title",
    titulo: "Meta title",
    limite: 60,
    descricao: "Referência prática para títulos SEO.",
  },
  {
    id: "meta-description",
    titulo: "Meta description",
    limite: 160,
    descricao: "Referência prática para descrições SEO.",
  },
  {
    id: "instagram",
    titulo: "Instagram",
    limite: 2200,
    descricao: "Limite de referência para legendas.",
  },
  {
    id: "x",
    titulo: "X",
    limite: 280,
    descricao: "Referência para publicações curtas.",
  },
  {
    id: "google-ads",
    titulo: "Google Ads",
    limite: 90,
    descricao: "Referência para descrição de anúncio.",
  },
  {
    id: "youtube",
    titulo: "YouTube",
    limite: 100,
    descricao: "Referência para título de vídeo.",
  },
];

const STOPWORDS = new Set([
  "a",
  "à",
  "ao",
  "aos",
  "as",
  "às",
  "com",
  "como",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "é",
  "em",
  "entre",
  "essa",
  "esse",
  "esta",
  "este",
  "eu",
  "foi",
  "mais",
  "mas",
  "me",
  "meu",
  "minha",
  "na",
  "nas",
  "no",
  "nos",
  "o",
  "os",
  "ou",
  "para",
  "pela",
  "pelas",
  "pelo",
  "pelos",
  "por",
  "que",
  "se",
  "sem",
  "seu",
  "sua",
  "um",
  "uma",
]);

function extrairPalavras(texto: string) {
  return texto
    .trim()
    .match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? [];
}

function contarFrases(texto: string) {
  const limpo = texto.trim();

  if (!limpo) {
    return 0;
  }

  return limpo
    .split(/[.!?]+(?:\s|$)/u)
    .map((item) => item.trim())
    .filter(Boolean).length;
}

function contarParagrafos(texto: string) {
  const limpo = texto.trim();

  if (!limpo) {
    return 0;
  }

  return limpo
    .split(/\n\s*\n/u)
    .map((item) => item.trim())
    .filter(Boolean).length;
}

function contarLinhas(texto: string) {
  if (!texto) {
    return 0;
  }

  return texto.split(/\r\n|\r|\n/u).length;
}

function formatarTempo(minutos: number) {
  if (minutos <= 0) {
    return "0 min";
  }

  if (minutos < 1) {
    return "< 1 min";
  }

  const arredondado = Math.ceil(minutos);

  return `${arredondado} min`;
}

export default function ContadorDePalavrasClient() {
  const [texto, setTexto] = useState("");
  const [presetAtivo, setPresetAtivo] = useState<string | null>(
    null
  );
  const [limitePersonalizado, setLimitePersonalizado] =
    useState("");
  const [copiado, setCopiado] = useState(false);

  const metricas = useMemo(() => {
    const palavras = extrairPalavras(texto);
    const caracteresComEspacos = texto.length;
    const caracteresSemEspacos = texto.replace(/\s/gu, "").length;

    const frequencia = new Map<string, number>();

    palavras.forEach((palavra) => {
      const normalizada = palavra.toLocaleLowerCase("pt-BR");

      if (
        normalizada.length < 3 ||
        STOPWORDS.has(normalizada)
      ) {
        return;
      }

      frequencia.set(
        normalizada,
        (frequencia.get(normalizada) ?? 0) + 1
      );
    });

    const palavrasFrequentes = Array.from(frequencia.entries())
      .sort((a, b) => {
        if (b[1] !== a[1]) {
          return b[1] - a[1];
        }

        return a[0].localeCompare(b[0], "pt-BR");
      })
      .slice(0, 8);

    return {
      palavras: palavras.length,
      caracteresComEspacos,
      caracteresSemEspacos,
      frases: contarFrases(texto),
      paragrafos: contarParagrafos(texto),
      linhas: contarLinhas(texto),
      tempoLeitura: formatarTempo(palavras.length / 200),
      tempoFala: formatarTempo(palavras.length / 130),
      palavrasFrequentes,
    };
  }, [texto]);

  const presetSelecionado = PRESETS.find(
    (preset) => preset.id === presetAtivo
  );

  const limiteCustomizado = Number(limitePersonalizado);

  const limiteAtivo =
    limitePersonalizado.trim() &&
    Number.isFinite(limiteCustomizado) &&
    limiteCustomizado > 0
      ? limiteCustomizado
      : presetSelecionado?.limite ?? null;

  const percentualLimite = limiteAtivo
    ? Math.min(
        (metricas.caracteresComEspacos / limiteAtivo) * 100,
        100
      )
    : 0;

  const excedeuLimite =
    limiteAtivo !== null &&
    metricas.caracteresComEspacos > limiteAtivo;

  async function copiarTexto() {
    if (!texto) {
      return;
    }

    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);

      window.setTimeout(() => {
        setCopiado(false);
      }, 1800);
    } catch {
      setCopiado(false);
    }
  }

  async function colarTexto() {
    try {
      const conteudo = await navigator.clipboard.readText();

      if (conteudo) {
        setTexto(conteudo);
      }
    } catch {
      return;
    }
  }

  function limparTexto() {
    setTexto("");
    setCopiado(false);
  }

  return (
    <section className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-8">
          <Link
            href="/ferramentas/texto"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft
              className="size-4"
              aria-hidden="true"
            />
            Voltar para texto
          </Link>
        </div>

        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Análise de texto
          </p>

          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Contador de Palavras e Caracteres
          </h1>

          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Analise palavras, caracteres, frases, parágrafos,
            linhas e tempos estimados em tempo real, diretamente
            no navegador.
          </p>
        </div>

        <Card className="mx-auto max-w-5xl overflow-hidden">
          <CardHeader>
            <CardTitle>Área de análise</CardTitle>

            <CardDescription>
              Digite, cole ou edite seu texto para atualizar as
              métricas instantaneamente.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
              <div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label
                    htmlFor="contador-texto"
                    className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    Seu texto
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={colarTexto}
                    >
                      <Clipboard
                        className="size-4"
                        aria-hidden="true"
                      />
                      Colar
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copiarTexto}
                      disabled={!texto}
                    >
                      {copiado ? (
                        <>
                          <Check
                            className="size-4"
                            aria-hidden="true"
                          />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy
                            className="size-4"
                            aria-hidden="true"
                          />
                          Copiar
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={limparTexto}
                      disabled={!texto}
                    >
                      <Eraser
                        className="size-4"
                        aria-hidden="true"
                      />
                      Limpar
                    </Button>
                  </div>
                </div>

                <textarea
                  id="contador-texto"
                  value={texto}
                  onChange={(event) => setTexto(event.target.value)}
                  placeholder="Digite ou cole seu texto aqui..."
                  className="mt-3 min-h-[30rem] w-full resize-y border border-border bg-muted/20 px-4 py-4 text-sm leading-7 outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                />

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    Processamento local e atualização em tempo real.
                  </span>

                  <span>
                    {metricas.caracteresComEspacos.toLocaleString(
                      "pt-BR"
                    )}{" "}
                    caracteres
                  </span>
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Resumo
                </p>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="border border-border bg-muted/20 p-4">
                    <div className="flex items-center gap-3">
                      <Type
                        className="size-4 text-primary"
                        aria-hidden="true"
                      />

                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Palavras
                        </p>

                        <p className="mt-1 text-xl font-semibold">
                          {metricas.palavras.toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-border bg-muted/20 p-4">
                    <div className="flex items-center gap-3">
                      <Hash
                        className="size-4 text-primary"
                        aria-hidden="true"
                      />

                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Com espaços
                        </p>

                        <p className="mt-1 text-xl font-semibold">
                          {metricas.caracteresComEspacos.toLocaleString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-border bg-muted/20 p-4">
                    <div className="flex items-center gap-3">
                      <FileText
                        className="size-4 text-primary"
                        aria-hidden="true"
                      />

                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Sem espaços
                        </p>

                        <p className="mt-1 text-xl font-semibold">
                          {metricas.caracteresSemEspacos.toLocaleString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-border bg-muted/20 p-4">
                    <div className="flex items-center gap-3">
                      <MessageSquareText
                        className="size-4 text-primary"
                        aria-hidden="true"
                      />

                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Frases
                        </p>

                        <p className="mt-1 text-xl font-semibold">
                          {metricas.frases.toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-border bg-muted/20 p-4">
                    <div className="flex items-center gap-3">
                      <Pilcrow
                        className="size-4 text-primary"
                        aria-hidden="true"
                      />

                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Parágrafos
                        </p>

                        <p className="mt-1 text-xl font-semibold">
                          {metricas.paragrafos.toLocaleString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-border bg-muted/20 p-4">
                    <div className="flex items-center gap-3">
                      <List
                        className="size-4 text-primary"
                        aria-hidden="true"
                      />

                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Linhas
                        </p>

                        <p className="mt-1 text-xl font-semibold">
                          {metricas.linhas.toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="border border-border bg-muted/20 p-4">
                    <div className="flex items-center gap-3">
                      <Timer
                        className="size-4 text-primary"
                        aria-hidden="true"
                      />

                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Tempo de leitura
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {metricas.tempoLeitura}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-border bg-muted/20 p-4">
                    <div className="flex items-center gap-3">
                      <Mic2
                        className="size-4 text-primary"
                        aria-hidden="true"
                      />

                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Tempo de fala
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {metricas.tempoFala}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-border pt-8">
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Gauge
                      className="size-4 text-primary"
                      aria-hidden="true"
                    />

                    <h2 className="font-heading text-lg font-medium">
                      Limites de conteúdo
                    </h2>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Compare o tamanho do texto com referências
                    práticas para SEO, conteúdo e anúncios.
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {PRESETS.map((preset) => {
                      const selecionado =
                        presetAtivo === preset.id &&
                        !limitePersonalizado.trim();

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setPresetAtivo(preset.id);
                            setLimitePersonalizado("");
                          }}
                          className={[
                            "border p-4 text-left transition-colors",
                            selecionado
                              ? "border-primary bg-primary/5"
                              : "border-border bg-background hover:bg-muted/40",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-sm font-medium">
                              {preset.titulo}
                            </span>

                            <span className="text-xs text-muted-foreground">
                              {preset.limite}
                            </span>
                          </div>

                          <span className="mt-2 block text-xs leading-5 text-muted-foreground">
                            {preset.descricao}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor="limite-personalizado"
                      className="text-sm font-medium"
                    >
                      Limite personalizado
                    </label>

                    <input
                      id="limite-personalizado"
                      type="number"
                      min="1"
                      value={limitePersonalizado}
                      onChange={(event) => {
                        setLimitePersonalizado(event.target.value);
                      }}
                      placeholder="Exemplo: 500"
                      className="mt-2 h-11 w-full border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Uso do limite
                  </p>

                  <div className="mt-3 border border-border bg-muted/20 p-5">
                    {limiteAtivo ? (
                      <>
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium">
                              {metricas.caracteresComEspacos.toLocaleString(
                                "pt-BR"
                              )}{" "}
                              de{" "}
                              {limiteAtivo.toLocaleString("pt-BR")}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              Contagem baseada em caracteres com
                              espaços.
                            </p>
                          </div>

                          <span
                            className={[
                              "text-sm font-semibold",
                              excedeuLimite
                                ? "text-destructive"
                                : "text-primary",
                            ].join(" ")}
                          >
                            {Math.round(
                              (metricas.caracteresComEspacos /
                                limiteAtivo) *
                                100
                            )}
                            %
                          </span>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden bg-muted">
                          <div
                            className={[
                              "h-full transition-all duration-300",
                              excedeuLimite
                                ? "bg-destructive"
                                : "bg-primary",
                            ].join(" ")}
                            style={{
                              width: `${percentualLimite}%`,
                            }}
                          />
                        </div>

                        <p
                          className={[
                            "mt-4 text-sm",
                            excedeuLimite
                              ? "text-destructive"
                              : "text-muted-foreground",
                          ].join(" ")}
                        >
                          {excedeuLimite
                            ? `O texto excedeu o limite em ${(
                                metricas.caracteresComEspacos -
                                limiteAtivo
                              ).toLocaleString("pt-BR")} caracteres.`
                            : `Restam ${(
                                limiteAtivo -
                                metricas.caracteresComEspacos
                              ).toLocaleString("pt-BR")} caracteres.`}
                        </p>
                      </>
                    ) : (
                      <div className="flex min-h-40 flex-col items-center justify-center text-center">
                        <Gauge
                          className="size-6 text-muted-foreground"
                          aria-hidden="true"
                        />

                        <p className="mt-3 text-sm font-medium">
                          Selecione um limite
                        </p>

                        <p className="mt-2 max-w-xs text-xs leading-5 text-muted-foreground">
                          Escolha um preset ou informe um valor
                          personalizado para acompanhar o progresso.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-border pt-8">
              <h2 className="font-heading text-lg font-medium">
                Palavras mais frequentes
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Visualize termos recorrentes com palavras comuns
                filtradas da análise.
              </p>

              {metricas.palavrasFrequentes.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {metricas.palavrasFrequentes.map(
                    ([palavra, quantidade]) => (
                      <div
                        key={palavra}
                        className="border border-border bg-muted/20 p-4"
                      >
                        <p className="truncate text-sm font-medium">
                          {palavra}
                        </p>

                        <p className="mt-2 text-xs text-muted-foreground">
                          {quantidade}{" "}
                          {quantidade === 1
                            ? "ocorrência"
                            : "ocorrências"}
                        </p>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="mt-4 flex min-h-36 items-center justify-center border border-border bg-muted/20 p-5 text-center">
                  <p className="max-w-md text-sm leading-6 text-muted-foreground">
                    Digite um texto para visualizar os termos mais
                    recorrentes.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mx-auto mt-8 max-w-5xl">
          <AdSlot variant="banner" />
        </div>
      </div>
    </section>
  );
}