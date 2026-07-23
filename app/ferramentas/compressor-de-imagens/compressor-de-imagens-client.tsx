"use client";

import Link from "next/link";
import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  Download,
  ImageIcon,
  LoaderCircle,
  Upload,
  X,
} from "lucide-react";

import { AdSlot } from "@/components/ads/AdSlot";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  comprimirImagem,
  type NivelCompressao,
  type ResultadoCompressao,
} from "@/lib/image-compressor/engine";

const FORMATOS_ACEITOS = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

const TAMANHO_MAXIMO_GRATIS = 5 * 1024 * 1024;

const NIVEIS: Array<{
  valor: NivelCompressao;
  titulo: string;
  descricao: string;
}> = [
  {
    valor: "leve",
    titulo: "Leve",
    descricao: "Maior preservação visual e redução moderada.",
  },
  {
    valor: "equilibrada",
    titulo: "Equilibrada",
    descricao: "Boa redução com qualidade visual preservada.",
  },
  {
    valor: "maxima",
    titulo: "Máxima",
    descricao: "Prioriza o menor tamanho de arquivo possível.",
  },
];

function formatarBytes(bytes: number) {
  if (bytes === 0) {
    return "0 B";
  }

  const unidades = ["B", "KB", "MB", "GB"];
  const indice = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    unidades.length - 1
  );

  const valor = bytes / Math.pow(1024, indice);

  return `${valor.toFixed(indice === 0 ? 0 : 2)} ${unidades[indice]}`;
}

export default function CompressorDeImagensClient() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultadoUrl, setResultadoUrl] = useState<string | null>(null);

  const [nivel, setNivel] =
    useState<NivelCompressao>("equilibrada");

  const [resultado, setResultado] =
    useState<ResultadoCompressao | null>(null);

  const [arrastando, setArrastando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      if (resultadoUrl) {
        URL.revokeObjectURL(resultadoUrl);
      }
    };
  }, [previewUrl, resultadoUrl]);

  function validarArquivo(file: File) {
    if (!FORMATOS_ACEITOS.includes(file.type)) {
      return "Formato inválido. Use PNG, JPG ou WebP.";
    }

    if (file.size > TAMANHO_MAXIMO_GRATIS) {
      return "Esta imagem ultrapassa o limite gratuito de 5 MB.";
    }

    return "";
  }

  function limparResultado() {
    if (resultadoUrl) {
      URL.revokeObjectURL(resultadoUrl);
    }

    setResultadoUrl(null);
    setResultado(null);
  }

  function carregarArquivo(file: File) {
    const mensagemErro = validarArquivo(file);

    if (mensagemErro) {
      setErro(mensagemErro);
      return;
    }

    limparResultado();

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const novaUrl = URL.createObjectURL(file);

    setArquivo(file);
    setPreviewUrl(novaUrl);
    setNivel("equilibrada");
    setErro("");
  }

  function selecionarArquivo(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (file) {
      carregarArquivo(file);
    }
  }

  function soltarArquivo(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
    setArrastando(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      carregarArquivo(file);
    }
  }

  function removerArquivo() {
    limparResultado();

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setArquivo(null);
    setPreviewUrl(null);
    setErro("");
    setNivel("equilibrada");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function processarCompressao() {
    if (!arquivo) {
      setErro("Selecione uma imagem antes de comprimir.");
      return;
    }

    setProcessando(true);
    setErro("");

    try {
      limparResultado();

      const novoResultado = await comprimirImagem(
        arquivo,
        { nivel }
      );

      const novaUrl = URL.createObjectURL(
        novoResultado.blob
      );

      setResultado(novoResultado);
      setResultadoUrl(novaUrl);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível comprimir a imagem.";

      setErro(mensagem);
    } finally {
      setProcessando(false);
    }
  }

  function baixarResultado() {
    if (!resultado || !resultadoUrl || !arquivo) {
      return;
    }

    const nomeOriginal = arquivo.name.replace(
      /\.[^/.]+$/,
      ""
    );

    const nomeFinal =
      `${nomeOriginal}-comprimido.${resultado.extensao}`;

    const link = document.createElement("a");

    link.href = resultadoUrl;
    link.download = nomeFinal;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <section className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-8">
          <Link
            href="/ferramentas/imagens"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft
              className="size-4"
              aria-hidden="true"
            />
            Voltar para ferramentas de imagens
          </Link>
        </div>

        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Otimização de imagens
          </p>

          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Compressor de Imagens
          </h1>

          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Reduza o tamanho de imagens JPG, PNG e WebP
            diretamente no navegador, com processamento local
            e controle do nível de compressão.
          </p>
        </div>

        <Card className="mx-auto max-w-4xl overflow-hidden">
          <CardHeader>
            <CardTitle>Área de compressão</CardTitle>

            <CardDescription>
              Formatos aceitos: PNG, JPG e WebP. Plano grátis:
              até 5 MB por imagem.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <input
              ref={inputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={selecionarArquivo}
            />

            {!arquivo ? (
              <div
                onDragEnter={(event) => {
                  event.preventDefault();
                  setArrastando(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setArrastando(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setArrastando(false);
                }}
                onDrop={soltarArquivo}
                className={[
                  "flex min-h-80 flex-col items-center justify-center border border-dashed p-6 text-center transition-colors sm:p-10",
                  arrastando
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/20 hover:bg-muted/40",
                ].join(" ")}
              >
                <div className="flex max-w-md flex-col items-center">
                  <div className="flex size-14 items-center justify-center border border-border bg-background">
                    <Upload
                      className="size-5"
                      aria-hidden="true"
                    />
                  </div>

                  <h2 className="mt-5 font-heading text-lg font-medium">
                    Envie sua imagem
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Arraste e solte o arquivo nesta área ou
                    selecione uma imagem diretamente do seu
                    dispositivo.
                  </p>

                  <Button
                    type="button"
                    size="lg"
                    className="mt-6"
                    onClick={() => inputRef.current?.click()}
                  >
                    Selecionar imagem
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border border-border bg-muted/20 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center border border-border bg-background">
                        <ImageIcon
                          className="size-4"
                          aria-hidden="true"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {arquivo.name}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatarBytes(arquivo.size)}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removerArquivo}
                      disabled={processando}
                    >
                      <X
                        className="size-4"
                        aria-hidden="true"
                      />
                      Remover
                    </Button>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Pré-visualização
                    </p>

                    <div className="flex min-h-80 items-center justify-center border border-border bg-muted/20 p-4">
                      {previewUrl && (
                        <img
                          src={previewUrl}
                          alt="Pré-visualização da imagem selecionada"
                          className="max-h-[28rem] w-full object-contain"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Nível de compressão
                    </p>

                    <div className="space-y-3">
                      {NIVEIS.map((item) => {
                        const selecionado =
                          nivel === item.valor;

                        return (
                          <button
                            key={item.valor}
                            type="button"
                            disabled={processando}
                            onClick={() => {
                              setNivel(item.valor);
                              limparResultado();
                            }}
                            className={[
                              "w-full border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                              selecionado
                                ? "border-primary bg-primary/5"
                                : "border-border bg-background hover:bg-muted/40",
                            ].join(" ")}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={[
                                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                                  selecionado
                                    ? "border-primary"
                                    : "border-muted-foreground/40",
                                ].join(" ")}
                              >
                                {selecionado && (
                                  <span className="size-2 rounded-full bg-primary" />
                                )}
                              </span>

                              <span>
                                <span className="block text-sm font-medium">
                                  {item.titulo}
                                </span>

                                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                                  {item.descricao}
                                </span>
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {arquivo.type === "image/png" && (
                      <div className="mt-4 border border-border bg-muted/20 p-4">
                        <p className="text-xs leading-5 text-muted-foreground">
                          Imagens PNG preservam o formato e a
                          transparência. A redução pode variar
                          conforme a estrutura do arquivo original.
                        </p>
                      </div>
                    )}

                    <Button
                      type="button"
                      size="lg"
                      className="mt-5 w-full"
                      onClick={processarCompressao}
                      disabled={processando}
                    >
                      {processando ? (
                        <>
                          <LoaderCircle
                            className="size-4 animate-spin"
                            aria-hidden="true"
                          />
                          Comprimindo...
                        </>
                      ) : (
                        "Comprimir imagem"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {resultado && resultadoUrl && arquivo && (
              <div className="mt-6 border border-border bg-background p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-primary">
                      Compressão concluída
                    </p>

                    <h3 className="mt-2 font-heading text-lg font-medium">
                      {resultado.usouOriginal
                        ? "A imagem original já é a melhor opção"
                        : "Imagem otimizada com sucesso"}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {resultado.usouOriginal
                        ? "O processamento não encontrou uma versão menor sem aumentar o arquivo. Mantivemos o original."
                        : `Você economizou ${formatarBytes(
                            resultado.bytesEconomizados
                          )} nesta imagem.`}
                    </p>
                  </div>

                  <span className="w-fit border border-border bg-muted/30 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {resultado.extensao}
                  </span>
                </div>

                <div className="mt-5 flex min-h-64 items-center justify-center border border-border bg-muted/20 p-4">
                  <img
                    src={resultadoUrl}
                    alt="Pré-visualização da imagem comprimida"
                    className="max-h-96 w-full object-contain"
                  />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="border border-border bg-muted/20 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Original
                    </p>

                    <p className="mt-2 text-sm font-medium">
                      {formatarBytes(
                        resultado.tamanhoOriginal
                      )}
                    </p>
                  </div>

                  <div className="border border-border bg-muted/20 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Resultado
                    </p>

                    <p className="mt-2 text-sm font-medium">
                      {formatarBytes(
                        resultado.tamanhoFinal
                      )}
                    </p>
                  </div>

                  <div className="border border-border bg-muted/20 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Redução
                    </p>

                    <p className="mt-2 text-sm font-medium">
                      {resultado.percentualReducao
                        .toFixed(1)
                        .replace(".", ",")}
                      %
                    </p>
                  </div>

                  <div className="border border-border bg-muted/20 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Dimensões
                    </p>

                    <p className="mt-2 text-sm font-medium">
                      {resultado.largura} ×{" "}
                      {resultado.altura} px
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    size="lg"
                    onClick={baixarResultado}
                    className="sm:min-w-48"
                  >
                    <Download
                      className="size-4"
                      aria-hidden="true"
                    />
                    Baixar imagem
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      limparResultado();
                      setNivel("equilibrada");
                    }}
                  >
                    Nova compressão
                  </Button>
                </div>
              </div>
            )}

            {erro && (
              <div
                role="alert"
                className="mt-4 border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
              >
                {erro}
              </div>
            )}
          </CardContent>
        </Card>

       <div className="mx-auto mt-8 max-w-4xl">
  <AdSlot variant="banner" />
</div>
      </div>
    </section>
  );
}
