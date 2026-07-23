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

import { converterHeicParaJpg } from "./heic-utils";

const FORMATOS_ACEITOS = [
  "image/heic",
  "image/heif",
  ".heic",
  ".heif",
];

const TAMANHO_MAXIMO_GRATIS = 20 * 1024 * 1024;

export default function ConversorHeicClient() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [arquivo, setArquivo] = useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  const [arrastando, setArrastando] =
    useState(false);

  const [erro, setErro] = useState("");

  const [processando, setProcessando] =
    useState(false);

  const [resultadoBlob, setResultadoBlob] =
    useState<Blob | null>(null);

  const [resultadoUrl, setResultadoUrl] =
    useState<string | null>(null);

  const [dimensoesResultado, setDimensoesResultado] =
    useState<{
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
    const extensao = file.name
      .toLowerCase()
      .split(".")
      .pop();

    if (
      extensao !== "heic" &&
      extensao !== "heif"
    ) {
      return "Selecione um arquivo HEIC ou HEIF.";
    }

    if (file.size > TAMANHO_MAXIMO_GRATIS) {
      return "O limite gratuito é de 20 MB por imagem.";
    }

    return "";
  }

  function limparResultado() {
    if (resultadoUrl) {
      URL.revokeObjectURL(resultadoUrl);
    }

    setResultadoBlob(null);
    setResultadoUrl(null);
    setDimensoesResultado(null);
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

    setArquivo(file);

    /**
     * HEIC normalmente não possui preview
     * nativo no navegador.
     */

    setPreviewUrl(null);

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

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function converterArquivo() {
      if (!arquivo) {
    setErro("Selecione um arquivo HEIC antes de converter.");
    return;
  }

  setProcessando(true);
  setErro("");

  try {
    limparResultado();

    const resultado = await converterHeicParaJpg(arquivo);

    const novaUrl = URL.createObjectURL(resultado.blob);

    setResultadoBlob(resultado.blob);
    setResultadoUrl(novaUrl);

    setDimensoesResultado({
      largura: resultado.largura,
      altura: resultado.altura,
    });
  } catch (error) {
    const mensagem =
      error instanceof Error
        ? error.message
        : "Não foi possível converter o arquivo.";

    setErro(mensagem);
  } finally {
    setProcessando(false);
  }
}

function baixarResultado() {
  if (
    !resultadoBlob ||
    !resultadoUrl ||
    !arquivo
  ) {
    return;
  }

  const nomeOriginal = arquivo.name.replace(/\.[^/.]+$/, "");

  const nomeFinal = `${nomeOriginal}.jpg`;

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
            Conversor HEIC para JPG
          </h1>

          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Converta fotos HEIC e HEIF do iPhone para JPG gratuitamente,
            diretamente no navegador e sem enviar seus arquivos para um servidor.
          </p>
        </div>
      </div>

      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle>Área de conversão</CardTitle>

          <CardDescription>
            Formatos aceitos: HEIC e HEIF. Limite gratuito de até 20 MB por imagem.
          </CardDescription>
        </CardHeader>

        <CardContent>

          <input
            ref={inputRef}
            type="file"
            accept=".heic,.heif"
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

            {!arquivo ? (
              <div className="flex max-w-md flex-col items-center">

                <div className="flex size-14 items-center justify-center border border-border bg-background">
                  <Upload className="size-5" />
                </div>

                <h2 className="mt-5 font-heading text-lg font-medium">
                  Envie seu arquivo HEIC
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Arraste o arquivo para esta área ou selecione uma imagem
                  HEIC diretamente do seu dispositivo.
                </p>

                <Button
                  type="button"
                  size="lg"
                  className="mt-6"
                  onClick={() => inputRef.current?.click()}
                >
                  Selecionar arquivo
                </Button>

              </div>
            ) : (
                <div className="w-full">

  <p className="mb-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
    Arquivo selecionado
  </p>

  <div className="border border-border bg-background p-6">

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
        Remover arquivo
      </Button>

    </div>

    <div className="mt-6 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-6">

      <p className="text-sm text-muted-foreground">
        Arquivos HEIC normalmente não possuem visualização
        nativa no navegador. Após a conversão você poderá
        visualizar a imagem em JPG antes de fazer o download.
      </p>

    </div>

    <div className="mt-6">

      <Button
        type="button"
        size="lg"
        onClick={converterArquivo}
        disabled={processando}
        className="w-full sm:w-auto sm:min-w-56"
      >
        {processando ? (
          <>
            <LoaderCircle
              className="mr-2 size-4 animate-spin"
            />
            Convertendo...
          </>
        ) : (
          "Converter para JPG"
        )}
      </Button>

    </div>

  </div>

</div>
)}
          </div>
                    {resultadoUrl && resultadoBlob && arquivo && (
            <div className="mt-6 border border-border bg-background p-4 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="text-left">
                  <p className="text-xs font-medium uppercase tracking-wider text-primary">
                    Conversão concluída
                  </p>

                  <h3 className="mt-2 font-heading text-lg font-medium">
                    Arquivo convertido com sucesso
                  </h3>
                </div>

                <span className="w-fit border border-border bg-muted/30 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  JPG
                </span>
              </div>

              <div className="mt-5 flex min-h-64 items-center justify-center border border-border bg-muted/20 p-4">
                <img
                  src={resultadoUrl}
                  alt="Imagem convertida"
                  className="max-h-96 w-full object-contain"
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  size="lg"
                  onClick={baixarResultado}
                  className="sm:min-w-48"
                >
                  Baixar JPG
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    removerArquivo();
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