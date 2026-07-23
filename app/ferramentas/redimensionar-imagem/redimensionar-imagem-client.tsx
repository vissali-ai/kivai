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
  LoaderCircle,
  Upload,
} from "lucide-react";

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
  FormatoSaida,
  redimensionarImagem,
} from "./resize-utils";

const FORMATOS_ACEITOS = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

const TAMANHO_MAXIMO_GRATIS = 20 * 1024 * 1024;

const PRESETS = [
  {
    nome: "Personalizado",
    largura: 0,
    altura: 0,
  },
  {
    nome: "Instagram Feed",
    largura: 1080,
    altura: 1080,
  },
  {
    nome: "Instagram Story",
    largura: 1080,
    altura: 1920,
  },
  {
    nome: "Instagram Reels",
    largura: 1080,
    altura: 1920,
  },
  {
    nome: "Facebook Post",
    largura: 1200,
    altura: 630,
  },
  {
    nome: "YouTube Thumbnail",
    largura: 1280,
    altura: 720,
  },
  {
    nome: "LinkedIn",
    largura: 1200,
    altura: 627,
  },
  {
    nome: "TikTok",
    largura: 1080,
    altura: 1920,
  },
  {
    nome: "Shopee",
    largura: 1000,
    altura: 1000,
  },
  {
    nome: "Mercado Livre",
    largura: 1200,
    altura: 1200,
  },
  {
    nome: "Amazon",
    largura: 1600,
    altura: 1600,
  },
];

export default function RedimensionarImagemClient() {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const [arquivo, setArquivo] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  const [resultadoUrl, setResultadoUrl] =
    useState<string | null>(null);

  const [resultadoBlob, setResultadoBlob] =
    useState<Blob | null>(null);

  const [arrastando, setArrastando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [processando, setProcessando] =
    useState(false);

  const [preset, setPreset] =
    useState("Personalizado");

  const [largura, setLargura] =
    useState(0);

  const [altura, setAltura] =
    useState(0);

  const [larguraOriginal, setLarguraOriginal] =
    useState(0);

  const [alturaOriginal, setAlturaOriginal] =
    useState(0);

  const [manterProporcao, setManterProporcao] =
    useState(true);

  const [formatoSaida, setFormatoSaida] =
    useState<FormatoSaida>("webp");

  const [qualidade, setQualidade] =
    useState(90);

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

  function limparResultado() {
    if (resultadoUrl) {
      URL.revokeObjectURL(resultadoUrl);
    }

    setResultadoBlob(null);
    setResultadoUrl(null);
  }

  function validarArquivo(file: File) {
    if (!FORMATOS_ACEITOS.includes(file.type)) {
      return "Selecione uma imagem JPG, PNG ou WebP.";
    }

    if (file.size > TAMANHO_MAXIMO_GRATIS) {
      return "O limite gratuito é de 20 MB.";
    }

    return "";
  }

  function carregarDimensoes(
    file: File
  ): Promise<{
    largura: number;
    altura: number;
  }> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);

      const imagem = new Image();

      imagem.onload = () => {
        resolve({
          largura: imagem.naturalWidth,
          altura: imagem.naturalHeight,
        });

        URL.revokeObjectURL(url);
      };

      imagem.onerror = () => {
        URL.revokeObjectURL(url);

        reject();
      };

      imagem.src = url;
    });
  }

  async function carregarArquivo(
    file: File
  ) {
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

    const dimensoes = await carregarDimensoes(file);

    setArquivo(file);
    setPreviewUrl(novaUrl);

    setLarguraOriginal(dimensoes.largura);
    setAlturaOriginal(dimensoes.altura);

    setLargura(dimensoes.largura);
    setAltura(dimensoes.altura);

    setPreset("Personalizado");

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

  function aplicarPreset(nome: string) {
    setPreset(nome);

    const presetSelecionado = PRESETS.find(
      (item) => item.nome === nome
    );

    if (!presetSelecionado) return;

    if (nome === "Personalizado") {
      setLargura(larguraOriginal);
      setAltura(alturaOriginal);
      return;
    }

    setLargura(presetSelecionado.largura);
    setAltura(presetSelecionado.altura);

    limparResultado();
  }

  function alterarLargura(valor: number) {
    setLargura(valor);

    if (
      manterProporcao &&
      larguraOriginal > 0 &&
      alturaOriginal > 0
    ) {
      setAltura(
        Math.round(
          (valor * alturaOriginal) /
            larguraOriginal
        )
      );
    }

    limparResultado();
  }

  function alterarAltura(valor: number) {
    setAltura(valor);

    if (
      manterProporcao &&
      larguraOriginal > 0 &&
      alturaOriginal > 0
    ) {
      setLargura(
        Math.round(
          (valor * larguraOriginal) /
            alturaOriginal
        )
      );
    }

    limparResultado();
  }

  async function redimensionarArquivo() {
    if (!arquivo) {
      setErro("Selecione uma imagem.");
      return;
    }

    setProcessando(true);
    setErro("");

    try {
      limparResultado();

      const resultado =
        await redimensionarImagem(
          arquivo,
          {
            largura,
            altura,
            formato: formatoSaida,
            qualidade:
              qualidade / 100,
            corDeFundo:
              "#ffffff",
          }
        );

      const novaUrl =
        URL.createObjectURL(
          resultado.blob
        );

      setResultadoBlob(
        resultado.blob
      );

      setResultadoUrl(
        novaUrl
      );
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao redimensionar.";

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

    const nomeOriginal =
      arquivo.name.replace(
        /\.[^/.]+$/,
        ""
      );

    const extensao =
      formatoSaida === "jpeg"
        ? "jpg"
        : formatoSaida;

    const link =
      document.createElement("a");

    link.href =
      resultadoUrl;

    link.download =
      `${nomeOriginal}-${largura}x${altura}.${extensao}`;

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
            <span aria-hidden="true">
              ←
            </span>

            Voltar para ferramentas de imagens
          </Link>

          <div className="mb-10 max-w-3xl">

            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              Ferramenta de imagem
            </p>

            <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Redimensionar Imagem
            </h1>

            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              Ajuste largura e altura de imagens
              mantendo a qualidade diretamente
              no navegador.
            </p>

          </div>

        </div>

        <Card className="mx-auto max-w-5xl">

          <CardHeader>

            <CardTitle>
              Área de edição
            </CardTitle>

            <CardDescription>
              JPG, PNG e WebP até 20 MB.
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
        <Upload className="size-5" />
      </div>

      <h2 className="mt-5 font-heading text-lg font-medium">
        Envie sua imagem
      </h2>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Arraste e solte a imagem ou selecione um arquivo do seu computador.
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
          alt="Imagem selecionada"
          className="max-h-96 w-full object-contain"
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <label className="text-sm font-medium">
            Preset
          </label>

          <select
            value={preset}
            onChange={(event) =>
              aplicarPreset(event.target.value)
            }
            className="mt-2 h-10 w-full border border-input bg-background px-3 text-sm"
          >
            {PRESETS.map((item) => (
              <option
                key={item.nome}
                value={item.nome}
              >
                {item.nome}
                {item.largura > 0
                  ? ` (${item.largura} × ${item.altura})`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">
            Formato
          </label>

          <select
            value={formatoSaida}
            onChange={(event) =>
              setFormatoSaida(
                event.target.value as FormatoSaida
              )
            }
            className="mt-2 h-10 w-full border border-input bg-background px-3 text-sm"
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPG</option>
            <option value="webp">WebP</option>
          </select>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <label className="text-sm font-medium">
            Largura (px)
          </label>

          <input
            type="number"
            min={1}
            value={largura}
            onChange={(event) =>
              alterarLargura(
                Number(event.target.value)
              )
            }
            className="mt-2 h-10 w-full border border-input bg-background px-3"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Altura (px)
          </label>

          <input
            type="number"
            min={1}
            value={altura}
            onChange={(event) =>
              alterarAltura(
                Number(event.target.value)
              )
            }
            className="mt-2 h-10 w-full border border-input bg-background px-3"
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <input
          id="proporcao"
          type="checkbox"
          checked={manterProporcao}
          onChange={(event) =>
            setManterProporcao(
              event.target.checked
            )
          }
        />

        <label
          htmlFor="proporcao"
          className="text-sm"
        >
          Manter proporção
        </label>
      </div>

      {formatoSaida !== "png" && (
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Qualidade
            </label>

            <span className="text-sm text-primary">
              {qualidade}%
            </span>
          </div>

          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={qualidade}
            onChange={(event) =>
              setQualidade(
                Number(event.target.value)
              )
            }
            className="mt-3 w-full"
          />
        </div>
      )}

      <div className="mt-6">
        <Button
          type="button"
          size="lg"
          onClick={redimensionarArquivo}
          disabled={processando}
          className="w-full sm:w-auto sm:min-w-56"
        >
          {processando ? (
            <>
              <LoaderCircle className="mr-2 size-4 animate-spin" />
              Redimensionando...
            </>
          ) : (
            "Redimensionar imagem"
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full sm:ml-3 sm:mt-0 sm:w-auto"
          onClick={removerArquivo}
        >
          Remover imagem
        </Button>
      </div>
    </div>
  )}
</div>
{resultadoUrl && resultadoBlob && arquivo && (
  <div className="mt-6 border border-border bg-background p-4 sm:p-6">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="text-left">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">
          Redimensionamento concluído
        </p>

        <h3 className="mt-2 font-heading text-lg font-medium">
          Imagem pronta para download
        </h3>
      </div>

      <span className="w-fit border border-border bg-muted/30 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {formatoSaida === "jpeg"
          ? "JPG"
          : formatoSaida.toUpperCase()}
      </span>
    </div>

    <div className="mt-5 flex min-h-64 items-center justify-center border border-border bg-muted/20 p-4">
      <img
        src={resultadoUrl}
        alt="Imagem redimensionada"
        className="max-h-96 w-full object-contain"
      />
    </div>

    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="border border-border bg-muted/20 p-4 text-left">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Original
        </p>

        <p className="mt-2 text-sm font-medium">
          {larguraOriginal} × {alturaOriginal}px
        </p>
      </div>

      <div className="border border-border bg-muted/20 p-4 text-left">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Novo tamanho
        </p>

        <p className="mt-2 text-sm font-medium">
          {largura} × {altura}px
        </p>
      </div>

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
          Arquivo final
        </p>

        <p className="mt-2 text-sm font-medium">
          {(resultadoBlob.size / 1024 / 1024).toFixed(2)} MB
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
        Baixar imagem
      </Button>

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => {
          limparResultado();
        }}
      >
        Nova edição
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

      <div className="mx-auto mt-8 max-w-5xl">
        <AdSlot variant="banner" />
      </div>
    </div>
  </section>
);
}