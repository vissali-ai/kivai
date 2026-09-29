"use client";

import { ToolResultCard } from "@/components/tools/tool-result-card";
import { ToolUploadArea } from "@/components/tools/tool-upload-area";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AdSlot } from "@/components/ads/AdSlot";
import { ToolErrorMessage } from "@/components/tools/tool-error-message";
import { ToolProcessingStatus } from "@/components/tools/tool-processing-status";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  converterImagem,
  type FormatoSaida,
} from "@/lib/image-converter/engine";
import { formatFileSize, validateFile } from "@/lib/tool-files";

const FORMATOS_ACEITOS = ["image/png", "image/jpeg", "image/webp"];
const TAMANHO_MAXIMO_GRATIS = 5 * 1024 * 1024;

export default function ConversorDeImagensClient() {

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  const [formatoSaida, setFormatoSaida] =
  useState<FormatoSaida>("webp");
const [qualidade, setQualidade] = useState(90);
const [processando, setProcessando] = useState(false);

const [resultadoUrl, setResultadoUrl] =
  useState<string | null>(null);

const [resultadoBlob, setResultadoBlob] =
  useState<Blob | null>(null);

const [extensaoResultado, setExtensaoResultado] =
  useState<"png" | "jpg" | "webp" | null>(null);
const [dimensoesResultado, setDimensoesResultado] = useState<{
  largura: number;
  altura: number;
} | null>(null);
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
    return validateFile({ file, acceptedMimeTypes: FORMATOS_ACEITOS, acceptedExtensions: ["png", "jpg", "jpeg", "webp"], maxSizeBytes: TAMANHO_MAXIMO_GRATIS }) ?? "";
  }

  function limparResultado() {
  setResultadoUrl(null);
  setResultadoBlob(null);
  setExtensaoResultado(null);
  setDimensoesResultado(null);
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

let formatoSugerido: FormatoSaida = "webp";

if (file.type === "image/webp") {
  formatoSugerido = "jpeg";
}

setArquivo(file);
setPreviewUrl(novaUrl);
setFormatoSaida(formatoSugerido);
setQualidade(90);
setErro("");
  }

  function removerArquivo() {
    limparResultado();
    setArquivo(null);
    setPreviewUrl(null);
    setErro("");

  }

  async function converterArquivo() {
  if (!arquivo) {
    setErro("Selecione uma imagem antes de converter.");
    return;
  }

  setProcessando(true);
  setErro("");

  try {
    limparResultado();

  const resultado = await converterImagem(arquivo, {
  formato: formatoSaida,
  qualidade: qualidade / 100,
  corDeFundo: "#ffffff",
});

    const novaUrl = URL.createObjectURL(resultado.blob);

    setResultadoBlob(resultado.blob);
    setResultadoUrl(novaUrl);
    setExtensaoResultado(resultado.extensao);
    setDimensoesResultado({
  largura: resultado.largura,
  altura: resultado.altura,
});
  } catch (error) {
    const mensagem =
      error instanceof Error
        ? error.message
        : "Não foi possível converter a imagem.";

    setErro(mensagem);
  } finally {
    setProcessando(false);
  }
}
function baixarResultado() {
  if (!resultadoBlob || !resultadoUrl || !extensaoResultado || !arquivo) {
    return;
  }

  const nomeOriginal = arquivo.name.replace(/\.[^/.]+$/, "");
  const nomeFinal = `${nomeOriginal}-convertido.${extensaoResultado}`;

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
  <span aria-hidden="true">←</span>
  Voltar para ferramentas de imagens
</Link>

          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              Ferramenta de imagem
            </p>

            <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Conversor de Imagens
            </h1>

            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              Converta imagens entre PNG, JPG e WebP diretamente no navegador.
            </p>
          </div>
        </div>

        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle>Área de conversão</CardTitle>

            <CardDescription>
              Formatos aceitos: PNG, JPG e WebP. Limite atual: até 5 MB por imagem.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ToolUploadArea accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" formats="PNG, JPG e WebP" maxSizeLabel="5 MB por imagem" processingMode="local" compact={Boolean(arquivo)} disabled={processando} label={arquivo ? "Trocar imagem" : "Selecionar imagem"} onFilesSelected={(files) => files[0] && carregarArquivo(files[0])} className="mb-5" />
            {previewUrl && (
                <div className="w-full">
                  <p className="mb-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Imagem selecionada
                  </p>

                  <div className="flex min-h-64 items-center justify-center border border-border bg-background p-4">
                    <img
                      src={previewUrl}
                      alt="Pré-visualização da imagem selecionada"
                      className="max-h-96 w-full object-contain"
                    />
                  </div>

{arquivo && (
  <div className="mt-4 border border-border bg-muted/20 p-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 text-left">
        <p className="truncate text-sm font-medium">
          {arquivo.name}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          {formatFileSize(arquivo.size)}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={removerArquivo}
        disabled={processando}
      >
        Remover imagem
      </Button>
    </div>

<div className="mt-5 border-t border-border pt-5">
  <div className="grid gap-4 sm:grid-cols-2">
    <div className="text-left">
      <label
        htmlFor="formato-saida"
        className="text-sm font-medium"
      >
        Formato de saída
      </label>

      <select
        id="formato-saida"
        value={formatoSaida}
        onChange={(event) => {
          setFormatoSaida(event.target.value as FormatoSaida);
          limparResultado();
        }}
        disabled={processando}
        className="mt-2 h-10 w-full border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="png">PNG</option>
        <option value="jpeg">JPG</option>
        <option value="webp">WebP</option>
      </select>
    </div>

    {formatoSaida !== "png" && (
      <div className="text-left">
        <div className="flex items-center justify-between gap-4">
          <label
            htmlFor="qualidade"
            className="text-sm font-medium"
          >
            Qualidade
          </label>

          <span className="text-sm font-medium text-primary">
            {qualidade}%
          </span>
        </div>

        <input
          id="qualidade"
          type="range"
          min="10"
          max="100"
          step="5"
          value={qualidade}
          onChange={(event) => {
            setQualidade(Number(event.target.value));
            limparResultado();
          }}
          disabled={processando}
          className="mt-3 w-full cursor-pointer accent-current disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    )}
  </div>

  <div className="mt-5">
    <Button
      type="button"
      size="lg"
      onClick={converterArquivo}
      disabled={processando}
      className="w-full sm:w-auto sm:min-w-48"
    >
     {processando ? (
  <>
    <LoaderCircle
      className="size-4 animate-spin"
      aria-hidden="true"
    />
    Convertendo...
  </>
) : (
  "Converter imagem"
)}
    </Button>
  </div>
</div>
  </div>
)}
                </div>
              )}
            <ToolProcessingStatus status={processando ? "processing" : resultadoUrl ? "success" : arquivo ? "ready" : erro ? "error" : "idle"} message="Convertendo imagem..." className="mt-4" />
{resultadoUrl && resultadoBlob && extensaoResultado && arquivo && (
              <ToolResultCard
                title="Imagem convertida pronta"
                className="mt-6"
                description={extensaoResultado.toUpperCase() + " · " + formatFileSize(resultadoBlob.size)}
                preview={<img src={resultadoUrl} alt="Pré-visualização da imagem convertida" className="mx-auto max-h-96 w-full object-contain" />}
                details={<dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <div><dt className="text-muted-foreground">Arquivo original</dt><dd>{formatFileSize(arquivo.size)}</dd></div>
                  <div><dt className="text-muted-foreground">Arquivo convertido</dt><dd>{formatFileSize(resultadoBlob.size)}</dd></div>
                  <div><dt className="text-muted-foreground">Dimensões</dt><dd>{dimensoesResultado ? dimensoesResultado.largura + " × " + dimensoesResultado.altura + " px" : "Não disponível"}</dd></div>
                  <div><dt className="text-muted-foreground">Variação de tamanho</dt><dd>{((resultadoBlob.size / arquivo.size - 1) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1, signDisplay: "exceptZero" })}%</dd></div>
                </dl>}
                actions={<>
                  <Button size="lg" onClick={baixarResultado}>Baixar imagem</Button>
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
