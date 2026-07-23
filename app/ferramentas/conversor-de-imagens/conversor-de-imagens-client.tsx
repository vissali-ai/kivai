"use client";

import Link from "next/link";
import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { LoaderCircle, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AdSlot } from "@/components/ads/AdSlot";
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

const FORMATOS_ACEITOS = ["image/png", "image/jpeg", "image/webp"];
const TAMANHO_MAXIMO_GRATIS = 5 * 1024 * 1024;

export default function ConversorDeImagensClient() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);
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
  setResultadoBlob(null);
  setExtensaoResultado(null);
  setDimensoesResultado(null);
}

  function carregarArquivo(file: File) {
    const mensagemErro = validarArquivo(file);

    if (mensagemErro) {
      setErro(mensagemErro);
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

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

  function selecionarArquivo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      carregarArquivo(file);
    }
  }

  function soltarArquivo(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setArrastando(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      carregarArquivo(file);
    }
  }

  function removerArquivo() {
    if (previewUrl) {
        limparResultado();
      URL.revokeObjectURL(previewUrl);
    }

    limparResultado();
    setArquivo(null);
    setPreviewUrl(null);
    setErro("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
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
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
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
              Formatos aceitos: PNG, JPG e WebP. Plano grátis: até 5 MB por imagem.
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
              {!previewUrl ? (
                <div className="flex max-w-md flex-col items-center">
                  <div className="flex size-14 items-center justify-center border border-border bg-background">
                    <Upload className="size-5" aria-hidden="true" />
                  </div>

                  <h2 className="mt-5 font-heading text-lg font-medium">
                    Envie sua imagem
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Arraste e solte o arquivo nesta área ou selecione uma imagem
                    diretamente do seu dispositivo.
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
              ) : (
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
          {(arquivo.size / 1024 / 1024).toFixed(2)} MB
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
            </div>
{resultadoUrl && resultadoBlob && extensaoResultado && arquivo && (
  <div className="mt-6 border border-border bg-background p-4 sm:p-6">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="text-left">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">
          Conversão concluída
        </p>

        <h3 className="mt-2 font-heading text-lg font-medium">
          Imagem convertida com sucesso
        </h3>
      </div>

      <span className="w-fit border border-border bg-muted/30 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {extensaoResultado}
      </span>
    </div>

    <div className="mt-5 flex min-h-64 items-center justify-center border border-border bg-muted/20 p-4">
      <img
        src={resultadoUrl}
        alt="Pré-visualização da imagem convertida"
        className="max-h-96 w-full object-contain"
      />
    </div>

<div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
  <div className="border border-border bg-muted/20 p-4 text-left">
    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      Arquivo original
    </p>

    <p className="mt-2 text-sm font-medium">
      {(arquivo.size / 1024 / 1024).toFixed(2)} MB
    </p>
  </div>

  <div className="border border-border bg-muted/20 p-4 text-left">
    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      Arquivo convertido
    </p>

    <p className="mt-2 text-sm font-medium">
      {(resultadoBlob.size / 1024 / 1024).toFixed(2)} MB
    </p>
  </div>

  <div className="border border-border bg-muted/20 p-4 text-left">
    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      Dimensões
    </p>

    <p className="mt-2 text-sm font-medium">
      {dimensoesResultado
        ? `${dimensoesResultado.largura} × ${dimensoesResultado.altura} px`
        : "Não disponível"}
    </p>
  </div>

  <div className="border border-border bg-muted/20 p-4 text-left">
    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      Variação
    </p>

    <p className="mt-2 text-sm font-medium">
      {(() => {
        const percentual =
          ((arquivo.size - resultadoBlob.size) / arquivo.size) * 100;

        if (Math.abs(percentual) < 0.1) {
          return "Tamanho praticamente igual";
        }

        if (percentual > 0) {
          return `Redução de ${percentual.toFixed(1).replace(".", ",")}%`;
        }

        return `Arquivo ${Math.abs(percentual)
          .toFixed(1)
          .replace(".", ",")}% maior`;
      })()}
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
        Baixar imagem
      </Button>

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => {
          limparResultado();
          setFormatoSaida("webp");
        }}
      >
        Nova conversão
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