"use client";
import Link from "next/link";
import { removerFundoBiRefNet } from "@/lib/background-removal/engine-birefnet";
import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { Download, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AdSlot } from "@/components/ads/ad-slot";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { removerFundo } from "@/lib/background-removal/engine";

const FORMATOS_ACEITOS = ["image/png", "image/jpeg", "image/webp"];
const TAMANHO_MAXIMO_GRATIS = 5 * 1024 * 1024;

export default function RemovedorDeFundoClient() {

  const inputRef = useRef<HTMLInputElement>(null);

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultadoUrl, setResultadoUrl] = useState<string | null>(null);
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
  return "Esta imagem ultrapassa o limite gratuito de 5 MB. Imagens maiores estarão disponíveis no plano Pro.";
}

    return "";
  }

  function limparResultado() {
    if (resultadoUrl) {
      URL.revokeObjectURL(resultadoUrl);
    }

    setResultadoUrl(null);
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

    limparResultado();

    const novaUrl = URL.createObjectURL(file);

    setArquivo(file);
    setPreviewUrl(novaUrl);
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
function fazerOutraImagem() {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }

  if (resultadoUrl) {
    URL.revokeObjectURL(resultadoUrl);
  }

  setArquivo(null);
  setPreviewUrl(null);
  setResultadoUrl(null);
  setErro("");
  setArrastando(false);

  if (inputRef.current) {
    inputRef.current.value = "";
  }

  window.setTimeout(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, 50);
}
 async function iniciarProcessamento() {
    
  if (!arquivo || !previewUrl) {
    setErro("Selecione uma imagem antes de continuar.");
    return;
  }

  setProcessando(true);
  setErro("");

  try {
    limparResultado();

    const resultadoBlob = await removerFundo(previewUrl);

    const novaResultadoUrl = URL.createObjectURL(resultadoBlob);

    setResultadoUrl(novaResultadoUrl);
  } catch (error) {
    console.error(error);

    setErro(
      "Não foi possível remover o fundo desta imagem. Tente novamente."
    );
  } finally {
    setProcessando(false);
  }
}

async function iniciarProcessamentoBen2() {
  if (!arquivo) {
    setErro("Selecione uma imagem antes de continuar.");
    return;
  }

  setProcessando(true);
  setErro("");

  try {
    limparResultado();

    const formData = new FormData();
    formData.append("file", arquivo);

   const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

const resposta = await fetch(
  `${API_URL}/remove-background`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!resposta.ok) {
      let mensagem =
        "Não foi possível remover o fundo desta imagem.";

      try {
        const dadosErro = await resposta.json();

        if (dadosErro?.detail) {
          mensagem = dadosErro.detail;
        }
      } catch {
        // Mantém a mensagem padrão
      }

      throw new Error(mensagem);
    }

    const resultadoBlob = await resposta.blob();

    if (resultadoBlob.type !== "image/png") {
      throw new Error(
        "O servidor retornou um formato inesperado."
      );
    }

    const novaResultadoUrl =
      URL.createObjectURL(resultadoBlob);

    setResultadoUrl(novaResultadoUrl);
  } catch (error) {
    console.error(
      "Erro ao processar remoção de fundo:",
      error
    );

    if (error instanceof TypeError) {
      setErro(
        "Não foi possível conectar ao serviço de processamento. Verifique se o backend está ativo."
      );
    } else if (error instanceof Error) {
      setErro(error.message);
    } else {
      setErro(
        "Não foi possível remover o fundo desta imagem. Tente novamente."
      );
    }
  } finally {
    setProcessando(false);
  }
}

  function baixarResultado() {
    if (!resultadoUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = resultadoUrl;
    link.download = "nexion-sem-fundo.png";

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
      </div>

      <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Ferramenta de imagem
          </span>

          <h1 className="mt-5 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Removedor de Fundo
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Envie sua imagem e gere uma versão com fundo transparente
            diretamente no seu navegador.
          </p>
        </div>

        <Card className="mx-auto mt-10 max-w-4xl">
          <CardHeader className="border-b">
            <CardTitle>Área de processamento</CardTitle>

            <CardDescription>
             Formatos aceitos: PNG, JPG e WebP. Plano grátis: até 5 MB por imagem.
            </CardDescription>
          </CardHeader>

          <CardContent>
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
                  <div className="flex size-14 items-center justify-center border border-border bg-background text-xl">
                    +
                  </div>

                  <h2 className="mt-5 font-heading text-lg font-medium">
                    Envie sua imagem
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Arraste e solte o arquivo nesta área ou selecione uma
                    imagem diretamente do seu dispositivo.
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
                  <div
                    className={[
                      "grid gap-4",
                      resultadoUrl ? "lg:grid-cols-2" : "grid-cols-1",
                    ].join(" ")}
                  >
                    <div>
                      <p className="mb-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Original
                      </p>

                      <div className="flex min-h-64 items-center justify-center border border-border bg-background p-4">
                        <img
                          src={previewUrl}
                          alt="Imagem original"
                          className="max-h-96 w-full object-contain"
                        />
                      </div>
                    </div>

                    {resultadoUrl && (
                      <div>
                        <p className="mb-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Resultado
                        </p>

                        <div className="flex min-h-64 items-center justify-center border border-border bg-[linear-gradient(45deg,#1f1f1f_25%,transparent_25%),linear-gradient(-45deg,#1f1f1f_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1f1f1f_75%),linear-gradient(-45deg,transparent_75%,#1f1f1f_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] p-4">
                          <img
                            src={resultadoUrl}
                            alt="Imagem com fundo removido"
                            className="max-h-96 w-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mx-auto mt-5 max-w-2xl border border-border bg-background px-4 py-3 text-left">
                    <p className="truncate text-sm font-medium">
                      {arquivo?.name}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {arquivo
                        ? `${(arquivo.size / 1024 / 1024).toFixed(2)} MB`
                        : ""}
                    </p>
                  </div>

                <div className="mt-5 flex flex-wrap justify-center gap-3">
  {!resultadoUrl && (
    <Button
      type="button"
      variant="outline"
      onClick={fazerOutraImagem}
      disabled={processando}
    >
      Trocar imagem
    </Button>
  )}

  {!resultadoUrl && (
    <Button
      type="button"
      onClick={iniciarProcessamentoBen2}
      disabled={processando}
    >
      {processando ? (
        <>
          <LoaderCircle className="animate-spin" />
          Removendo fundo...
        </>
      ) : (
        "Remover fundo"
      )}
    </Button>
  )}

  {resultadoUrl && (
    <>
<Button
  type="button"
  onClick={baixarResultado}
>
  <Download />
  Baixar PNG
</Button>

      <Button
        type="button"
        variant="outline"
        onClick={fazerOutraImagem}
      >
        Fazer outra imagem
      </Button>
    </>
  )}
</div>

                  {processando && (
                    <p className="mt-4 text-sm text-muted-foreground">
                      Na primeira utilização, o processamento pode levar mais
                      tempo enquanto os recursos necessários são carregados.
                    </p>
                  )}
                </div>
              )}

              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={selecionarArquivo}
                hidden
              />
            </div>

            {erro && (
              <div
                role="alert"
                className="mt-4 border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {erro}
              </div>
            )}
          </CardContent>
       
               </Card>

        <div className="mx-auto mt-8 max-w-4xl">
          <AdSlot variant="banner" />
        </div>

        <div className="mx-auto mt-8 grid max-w-4xl gap-px border border-border bg-border sm:grid-cols-3">
          <div className="bg-background p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Formatos
            </p>
            <p className="mt-2 text-sm font-medium">PNG, JPG e WebP</p>
          </div>

          <div className="bg-background p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Limite
            </p>
          <p className="mt-2 text-sm font-medium">
  Plano grátis: até 5 MB por imagem
</p>
          </div>

          <div className="bg-background p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Saída
            </p>
            <p className="mt-2 text-sm font-medium">
              PNG com transparência
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}