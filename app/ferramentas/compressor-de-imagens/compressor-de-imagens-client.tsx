"use client";

import { ToolResultCard } from "@/components/tools/tool-result-card";
import { ToolErrorMessage } from "@/components/tools/tool-error-message";
import { ToolProcessingStatus } from "@/components/tools/tool-processing-status";
import { ToolUploadArea } from "@/components/tools/tool-upload-area";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Download,
  ImageIcon,
  LoaderCircle,
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

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultadoUrl, setResultadoUrl] = useState<string | null>(null);

  const [nivel, setNivel] =
    useState<NivelCompressao>("equilibrada");

  const [resultado, setResultado] =
    useState<ResultadoCompressao | null>(null);

  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (resultadoUrl) {
        URL.revokeObjectURL(resultadoUrl);
      }
    };
  }, [resultadoUrl]);

  function validarArquivo(file: File) {
    if (!file.size) {
      return "O arquivo está vazio. Tente selecionar outro.";
    }
    if (!FORMATOS_ACEITOS.includes(file.type)) {
      return "Formato inválido. Use PNG, JPG ou WebP.";
    }

    if (file.size > TAMANHO_MAXIMO_GRATIS) {
      return "Esta imagem ultrapassa o limite gratuito de 5 MB.";
    }

    return "";
  }

  function limparResultado() {
    setResultadoUrl(null);
    setResultado(null);
  }

  function carregarArquivo(file: File) {
    if (processando) return;
    const mensagemErro = validarArquivo(file);

    if (mensagemErro) {
      setErro(mensagemErro);
      return;
    }

    limparResultado();

    const novaUrl = URL.createObjectURL(file);

    setArquivo(file);
    setPreviewUrl(novaUrl);
    setNivel("equilibrada");
    setErro("");
  }

  function removerArquivo() {
    limparResultado();

    setArquivo(null);
    setPreviewUrl(null);
    setErro("");
    setNivel("equilibrada");

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
      <div className="mx-auto w-full max-w-6xl px-4 pt-24 pb-12 sm:px-6 sm:pt-24 lg:px-8 lg:pt-24 lg:pb-16">
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
            Reduza o tamanho de imagens JPG, PNG e WebP mantendo
            as dimensões e o formato original.
          </p>
        </div>

        <Card className="mx-auto max-w-4xl overflow-hidden">
          <CardHeader>
            <CardTitle>Área de compressão</CardTitle>

            <CardDescription>
              Formatos aceitos: PNG, JPG e WebP. Limite atual:
              até 5 MB por imagem.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ToolUploadArea accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" formats="PNG, JPG e WebP" maxSizeLabel="5 MB por imagem" processingMode="local" compact={Boolean(arquivo)} disabled={processando} label={arquivo ? "Trocar imagem" : "Selecionar imagem"} onFilesSelected={(files) => files[0] && carregarArquivo(files[0])} className="mb-5" />
            {arquivo && (
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
                          Em arquivos PNG, o formato e a transparência são
                          preservados. Como o PNG usa compressão sem perdas,
                          os níveis de qualidade não atuam da mesma forma que
                          em JPG e WebP, e a redução pode variar conforme o
                          arquivo original.
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

            <ToolProcessingStatus status={processando ? "processing" : "idle"} message="Comprimindo imagem..." className="mt-4" />
            {resultado && resultadoUrl && (
              <ToolResultCard
                title="Imagem comprimida pronta"
                className="mt-6"
                description={resultado.usouOriginal ? "O original já era menor. Ele foi mantido para evitar aumentar o arquivo." : "Economia de " + formatarBytes(resultado.bytesEconomizados) + "."}
                preview={<img src={resultadoUrl} alt="Pré-visualização da imagem comprimida" className="mx-auto max-h-96 w-full object-contain" />}
                details={<dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <div><dt className="text-muted-foreground">Original</dt><dd>{formatarBytes(resultado.tamanhoOriginal)}</dd></div>
                  <div><dt className="text-muted-foreground">Resultado</dt><dd>{formatarBytes(resultado.tamanhoFinal)}</dd></div>
                  <div><dt className="text-muted-foreground">Redução</dt><dd>{resultado.percentualReducao.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</dd></div>
                  <div><dt className="text-muted-foreground">Dimensões</dt><dd>{resultado.largura} × {resultado.altura} px</dd></div>
                </dl>}
                actions={<>
                  <Button size="lg" onClick={baixarResultado}><Download aria-hidden="true" />Baixar imagem</Button>
                  <Button size="lg" variant="outline" onClick={removerArquivo}>Começar novamente</Button>
                </>}
              />
            )}

            <ToolErrorMessage message={erro} className="mt-4" />
          </CardContent>
        </Card>

       <div className="mx-auto mt-8 max-w-4xl">
  <AdSlot variant="banner" />
</div>
      </div>
    </section>
  );
}
