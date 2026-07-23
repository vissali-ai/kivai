"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";


import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Link2,
  LoaderCircle,
  Mail,
  MessageCircle,
  Phone,
  QrCode,
  Type,
  Wifi,
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

type TipoQrCode =
  | "url"
  | "texto"
  | "whatsapp"
  | "telefone"
  | "email"
  | "wifi";

type NivelCorrecao = "L" | "M" | "Q" | "H";

type TipoConfig = {
  valor: TipoQrCode;
  titulo: string;
  descricao: string;
  icone: typeof Link2;
};

const TIPOS: TipoConfig[] = [
  {
    valor: "url",
    titulo: "URL",
    descricao: "Sites e páginas",
    icone: Link2,
  },
  {
    valor: "texto",
    titulo: "Texto",
    descricao: "Mensagens e informações",
    icone: Type,
  },
  {
    valor: "whatsapp",
    titulo: "WhatsApp",
    descricao: "Conversas diretas",
    icone: MessageCircle,
  },
  {
    valor: "telefone",
    titulo: "Telefone",
    descricao: "Chamadas rápidas",
    icone: Phone,
  },
  {
    valor: "email",
    titulo: "E-mail",
    descricao: "Mensagens por e-mail",
    icone: Mail,
  },
  {
    valor: "wifi",
    titulo: "Wi-Fi",
    descricao: "Acesso à rede",
    icone: Wifi,
  },
];

const NIVEIS_CORRECAO: Array<{
  valor: NivelCorrecao;
  titulo: string;
  descricao: string;
}> = [
  {
    valor: "L",
    titulo: "Baixa",
    descricao: "QR Code mais simples e compacto.",
  },
  {
    valor: "M",
    titulo: "Média",
    descricao: "Equilíbrio recomendado para uso geral.",
  },
  {
    valor: "Q",
    titulo: "Alta",
    descricao: "Maior resistência a pequenas perdas.",
  },
  {
    valor: "H",
    titulo: "Máxima",
    descricao: "Maior tolerância a danos e interferências.",
  },
];

function escaparWifi(valor: string) {
  return valor.replace(/([\\;,":])/g, "\\$1");
}

function normalizarUrl(valor: string) {
  const texto = valor.trim();

  if (!texto) {
    return "";
  }

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(texto)) {
    return texto;
  }

  return `https://${texto}`;
}

function somenteDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export default function GeradorDeQrCodeClient() {
  const [tipo, setTipo] = useState<TipoQrCode>("url");

  const [url, setUrl] = useState("");
  const [texto, setTexto] = useState("");

  const [whatsappNumero, setWhatsappNumero] = useState("");
  const [whatsappMensagem, setWhatsappMensagem] = useState("");

  const [telefone, setTelefone] = useState("");

  const [emailDestino, setEmailDestino] = useState("");
  const [emailAssunto, setEmailAssunto] = useState("");
  const [emailMensagem, setEmailMensagem] = useState("");

  const [wifiNome, setWifiNome] = useState("");
  const [wifiSenha, setWifiSenha] = useState("");
  const [wifiSeguranca, setWifiSeguranca] = useState<
    "WPA" | "WEP" | "nopass"
  >("WPA");
  const [wifiOculta, setWifiOculta] = useState(false);

  const [corQr, setCorQr] = useState("#111827");
  const [corFundo, setCorFundo] = useState("#ffffff");
  const [tamanho, setTamanho] = useState(320);
  const [margem, setMargem] = useState(2);
  const [nivelCorrecao, setNivelCorrecao] =
    useState<NivelCorrecao>("M");

  const [qrDataUrl, setQrDataUrl] = useState("");
  const [gerando, setGerando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState("");

  const conteudoQr = useMemo(() => {
    switch (tipo) {
      case "url":
        return normalizarUrl(url);

      case "texto":
        return texto.trim();

      case "whatsapp": {
        const numero = somenteDigitos(whatsappNumero);

        if (!numero) {
          return "";
        }

        const mensagem = whatsappMensagem.trim();

        return mensagem
          ? `https://wa.me/${numero}?text=${encodeURIComponent(
              mensagem
            )}`
          : `https://wa.me/${numero}`;
      }

      case "telefone": {
        const numero = telefone.trim();

        return numero ? `tel:${numero}` : "";
      }

      case "email": {
        const destino = emailDestino.trim();

        if (!destino) {
          return "";
        }

        const parametros = new URLSearchParams();

        if (emailAssunto.trim()) {
          parametros.set("subject", emailAssunto.trim());
        }

        if (emailMensagem.trim()) {
          parametros.set("body", emailMensagem.trim());
        }

        const query = parametros.toString();

        return `mailto:${destino}${query ? `?${query}` : ""}`;
      }

      case "wifi": {
        const nome = wifiNome.trim();

        if (!nome) {
          return "";
        }

        return [
          "WIFI:",
          `T:${wifiSeguranca};`,
          `S:${escaparWifi(nome)};`,
          wifiSeguranca !== "nopass"
            ? `P:${escaparWifi(wifiSenha)};`
            : "",
          `H:${wifiOculta ? "true" : "false"};;`,
        ].join("");
      }

      default:
        return "";
    }
  }, [
    tipo,
    url,
    texto,
    whatsappNumero,
    whatsappMensagem,
    telefone,
    emailDestino,
    emailAssunto,
    emailMensagem,
    wifiNome,
    wifiSenha,
    wifiSeguranca,
    wifiOculta,
  ]);

  useEffect(() => {
    let ativo = true;

    async function gerarPreview() {
      if (!conteudoQr) {
        setQrDataUrl("");
        setErro("");
        return;
      }

      setGerando(true);

      try {
        const QRCode = await import("qrcode");

const dataUrl = await QRCode.toDataURL(conteudoQr, {
          width: tamanho,
          margin: margem,
          errorCorrectionLevel: nivelCorrecao,
          color: {
            dark: corQr,
            light: corFundo,
          },
        });

        if (ativo) {
          setQrDataUrl(dataUrl);
          setErro("");
        }
      } catch {
        if (ativo) {
          setQrDataUrl("");
          setErro("Não foi possível gerar o QR Code.");
        }
      } finally {
        if (ativo) {
          setGerando(false);
        }
      }
    }

    gerarPreview();

    return () => {
      ativo = false;
    };
  }, [
    conteudoQr,
    tamanho,
    margem,
    nivelCorrecao,
    corQr,
    corFundo,
  ]);

  function trocarTipo(novoTipo: TipoQrCode) {
    setTipo(novoTipo);
    setErro("");
    setCopiado(false);
  }

  async function copiarConteudo() {
    if (!conteudoQr) {
      setErro("Preencha os dados antes de copiar o conteúdo.");
      return;
    }

    try {
      await navigator.clipboard.writeText(conteudoQr);
      setCopiado(true);
      setErro("");

      window.setTimeout(() => {
        setCopiado(false);
      }, 1800);
    } catch {
      setErro("Não foi possível copiar o conteúdo.");
    }
  }

  function baixarPng() {
    if (!qrDataUrl) {
      setErro("Preencha os dados antes de baixar o QR Code.");
      return;
    }

    const link = document.createElement("a");

    link.href = qrDataUrl;
    link.download = `nexion-tools-qrcode-${tipo}.png`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function baixarSvg() {
    if (!conteudoQr) {
      setErro("Preencha os dados antes de baixar o QR Code.");
      return;
    }

    try {
     const QRCode = await import("qrcode");

const svg = await QRCode.toString(conteudoQr, {
        type: "svg",
        width: tamanho,
        margin: margem,
        errorCorrectionLevel: nivelCorrecao,
        color: {
          dark: corQr,
          light: corFundo,
        },
      });

      const blob = new Blob([svg], {
        type: "image/svg+xml;charset=utf-8",
      });

      const urlBlob = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = urlBlob;
      link.download = `nexion-tools-qrcode-${tipo}.svg`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(urlBlob);
      setErro("");
    } catch {
      setErro("Não foi possível gerar o arquivo SVG.");
    }
  }

  function renderizarCampos() {
    const inputClassName =
      "h-11 w-full border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

    const textareaClassName =
      "min-h-28 w-full resize-y border border-border bg-background px-3 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

    switch (tipo) {
      case "url":
        return (
          <div>
            <label
              htmlFor="qr-url"
              className="text-sm font-medium"
            >
              Endereço do site
            </label>

            <input
              id="qr-url"
              type="text"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="exemplo.com.br"
              className={`${inputClassName} mt-2`}
            />

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Se você não informar o protocolo, adicionaremos
              https:// automaticamente.
            </p>
          </div>
        );

      case "texto":
        return (
          <div>
            <label
              htmlFor="qr-texto"
              className="text-sm font-medium"
            >
              Conteúdo do texto
            </label>

            <textarea
              id="qr-texto"
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              placeholder="Digite a mensagem ou informação"
              className={`${textareaClassName} mt-2`}
            />
          </div>
        );

      case "whatsapp":
        return (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="qr-whatsapp-numero"
                className="text-sm font-medium"
              >
                Número com DDI e DDD
              </label>

              <input
                id="qr-whatsapp-numero"
                type="tel"
                value={whatsappNumero}
                onChange={(event) =>
                  setWhatsappNumero(event.target.value)
                }
                placeholder="5511999999999"
                className={`${inputClassName} mt-2`}
              />
            </div>

            <div>
              <label
                htmlFor="qr-whatsapp-mensagem"
                className="text-sm font-medium"
              >
                Mensagem inicial
              </label>

              <textarea
                id="qr-whatsapp-mensagem"
                value={whatsappMensagem}
                onChange={(event) =>
                  setWhatsappMensagem(event.target.value)
                }
                placeholder="Olá, gostaria de mais informações."
                className={`${textareaClassName} mt-2`}
              />
            </div>
          </div>
        );

      case "telefone":
        return (
          <div>
            <label
              htmlFor="qr-telefone"
              className="text-sm font-medium"
            >
              Número de telefone
            </label>

            <input
              id="qr-telefone"
              type="tel"
              value={telefone}
              onChange={(event) =>
                setTelefone(event.target.value)
              }
              placeholder="+55 11 99999-9999"
              className={`${inputClassName} mt-2`}
            />
          </div>
        );

      case "email":
        return (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="qr-email-destino"
                className="text-sm font-medium"
              >
                E-mail de destino
              </label>

              <input
                id="qr-email-destino"
                type="email"
                value={emailDestino}
                onChange={(event) =>
                  setEmailDestino(event.target.value)
                }
                placeholder="contato@exemplo.com"
                className={`${inputClassName} mt-2`}
              />
            </div>

            <div>
              <label
                htmlFor="qr-email-assunto"
                className="text-sm font-medium"
              >
                Assunto
              </label>

              <input
                id="qr-email-assunto"
                type="text"
                value={emailAssunto}
                onChange={(event) =>
                  setEmailAssunto(event.target.value)
                }
                placeholder="Assunto da mensagem"
                className={`${inputClassName} mt-2`}
              />
            </div>

            <div>
              <label
                htmlFor="qr-email-mensagem"
                className="text-sm font-medium"
              >
                Mensagem
              </label>

              <textarea
                id="qr-email-mensagem"
                value={emailMensagem}
                onChange={(event) =>
                  setEmailMensagem(event.target.value)
                }
                placeholder="Escreva a mensagem inicial"
                className={`${textareaClassName} mt-2`}
              />
            </div>
          </div>
        );

      case "wifi":
        return (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="qr-wifi-nome"
                className="text-sm font-medium"
              >
                Nome da rede
              </label>

              <input
                id="qr-wifi-nome"
                type="text"
                value={wifiNome}
                onChange={(event) =>
                  setWifiNome(event.target.value)
                }
                placeholder="Nome do Wi-Fi"
                className={`${inputClassName} mt-2`}
              />
            </div>

            <div>
              <label
                htmlFor="qr-wifi-seguranca"
                className="text-sm font-medium"
              >
                Segurança
              </label>

              <select
                id="qr-wifi-seguranca"
                value={wifiSeguranca}
                onChange={(event) =>
                  setWifiSeguranca(
                    event.target.value as
                      | "WPA"
                      | "WEP"
                      | "nopass"
                  )
                }
                className={`${inputClassName} mt-2`}
              >
                <option value="WPA">WPA / WPA2 / WPA3</option>
                <option value="WEP">WEP</option>
                <option value="nopass">Sem senha</option>
              </select>
            </div>

            {wifiSeguranca !== "nopass" && (
              <div>
                <label
                  htmlFor="qr-wifi-senha"
                  className="text-sm font-medium"
                >
                  Senha da rede
                </label>

                <input
                  id="qr-wifi-senha"
                  type="text"
                  value={wifiSenha}
                  onChange={(event) =>
                    setWifiSenha(event.target.value)
                  }
                  placeholder="Digite a senha"
                  className={`${inputClassName} mt-2`}
                />
              </div>
            )}

            <label className="flex cursor-pointer items-center gap-3 border border-border bg-muted/20 p-4">
              <input
                type="checkbox"
                checked={wifiOculta}
                onChange={(event) =>
                  setWifiOculta(event.target.checked)
                }
                className="size-4 accent-primary"
              />

              <span>
                <span className="block text-sm font-medium">
                  Rede oculta
                </span>

                <span className="mt-1 block text-xs text-muted-foreground">
                  Marque se o nome da rede não é exibido
                  publicamente.
                </span>
              </span>
            </label>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <section className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft
              className="size-4"
              aria-hidden="true"
            />
            Voltar para o início
          </Link>
        </div>

        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Compartilhamento rápido
          </p>

          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Gerador de QR Code
          </h1>

          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Crie QR Codes personalizados para sites, textos,
            WhatsApp, telefone, e-mail e redes Wi-Fi diretamente
            no navegador.
          </p>
        </div>

        <Card className="mx-auto max-w-4xl overflow-hidden">
          <CardHeader>
            <CardTitle>Crie seu QR Code</CardTitle>

            <CardDescription>
              Escolha o tipo de conteúdo, personalize a aparência
              e baixe em PNG ou SVG.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tipo de QR Code
              </p>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {TIPOS.map((item) => {
                  const Icone = item.icone;
                  const selecionado = tipo === item.valor;

                  return (
                    <button
                      key={item.valor}
                      type="button"
                      onClick={() => trocarTipo(item.valor)}
                      className={[
                        "border p-4 text-left transition-colors",
                        selecionado
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background hover:bg-muted/40",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={[
                            "flex size-10 shrink-0 items-center justify-center border",
                            selecionado
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-border bg-muted/20 text-muted-foreground",
                          ].join(" ")}
                        >
                          <Icone
                            className="size-4"
                            aria-hidden="true"
                          />
                        </div>

                        <div>
                          <p className="text-sm font-medium">
                            {item.titulo}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {item.descricao}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-6">
                <div className="border border-border bg-muted/20 p-4 sm:p-5">
                  <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Conteúdo
                  </p>

                  {renderizarCampos()}
                </div>

                <div className="border border-border bg-muted/20 p-4 sm:p-5">
                  <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Personalização
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="qr-cor"
                        className="text-sm font-medium"
                      >
                        Cor do QR Code
                      </label>

                      <div className="mt-2 flex h-11 border border-border bg-background">
                        <input
                          id="qr-cor"
                          type="color"
                          value={corQr}
                          onChange={(event) =>
                            setCorQr(event.target.value)
                          }
                          className="h-full w-14 cursor-pointer border-0 bg-transparent p-1"
                        />

                        <input
                          type="text"
                          value={corQr}
                          onChange={(event) =>
                            setCorQr(event.target.value)
                          }
                          className="min-w-0 flex-1 bg-transparent px-3 text-sm uppercase outline-none"
                          aria-label="Código hexadecimal da cor do QR Code"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="qr-fundo"
                        className="text-sm font-medium"
                      >
                        Cor de fundo
                      </label>

                      <div className="mt-2 flex h-11 border border-border bg-background">
                        <input
                          id="qr-fundo"
                          type="color"
                          value={corFundo}
                          onChange={(event) =>
                            setCorFundo(event.target.value)
                          }
                          className="h-full w-14 cursor-pointer border-0 bg-transparent p-1"
                        />

                        <input
                          type="text"
                          value={corFundo}
                          onChange={(event) =>
                            setCorFundo(event.target.value)
                          }
                          className="min-w-0 flex-1 bg-transparent px-3 text-sm uppercase outline-none"
                          aria-label="Código hexadecimal da cor de fundo"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="qr-tamanho"
                        className="text-sm font-medium"
                      >
                        Tamanho: {tamanho} px
                      </label>

                      <input
                        id="qr-tamanho"
                        type="range"
                        min="200"
                        max="1000"
                        step="20"
                        value={tamanho}
                        onChange={(event) =>
                          setTamanho(Number(event.target.value))
                        }
                        className="mt-3 w-full accent-primary"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="qr-margem"
                        className="text-sm font-medium"
                      >
                        Margem: {margem}
                      </label>

                      <input
                        id="qr-margem"
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={margem}
                        onChange={(event) =>
                          setMargem(Number(event.target.value))
                        }
                        className="mt-3 w-full accent-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-border bg-muted/20 p-4 sm:p-5">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Correção de erro
                  </p>

                  <div className="space-y-3">
                    {NIVEIS_CORRECAO.map((item) => {
                      const selecionado =
                        nivelCorrecao === item.valor;

                      return (
                        <button
                          key={item.valor}
                          type="button"
                          onClick={() =>
                            setNivelCorrecao(item.valor)
                          }
                          className={[
                            "w-full border p-4 text-left transition-colors",
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
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Pré-visualização
                </p>

                <div className="flex min-h-[28rem] flex-col items-center justify-center border border-border bg-muted/20 p-5">
                  {gerando ? (
                    <div className="flex flex-col items-center text-center">
                      <LoaderCircle
                        className="size-7 animate-spin text-primary"
                        aria-hidden="true"
                      />

                      <p className="mt-3 text-sm text-muted-foreground">
                        Gerando QR Code...
                      </p>
                    </div>
                  ) : qrDataUrl ? (
                    <>
                      <div className="flex w-full max-w-sm items-center justify-center border border-border bg-background p-5">
                        <img
                          src={qrDataUrl}
                          alt="Pré-visualização do QR Code gerado"
                          className="h-auto max-h-80 w-full object-contain"
                        />
                      </div>

                      <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
                        Teste o QR Code com a câmera do celular
                        antes de publicar ou imprimir.
                      </p>
                    </>
                  ) : (
                    <div className="flex max-w-xs flex-col items-center text-center">
                      <div className="flex size-14 items-center justify-center border border-border bg-background">
                        <QrCode
                          className="size-5"
                          aria-hidden="true"
                        />
                      </div>

                      <h2 className="mt-5 font-heading text-lg font-medium">
                        Seu QR Code aparecerá aqui
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Preencha os dados do conteúdo para gerar a
                        pré-visualização automaticamente.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <Button
                    type="button"
                    size="lg"
                    onClick={baixarPng}
                    disabled={!qrDataUrl || gerando}
                  >
                    <Download
                      className="size-4"
                      aria-hidden="true"
                    />
                    Baixar PNG
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={baixarSvg}
                    disabled={!conteudoQr || gerando}
                  >
                    <Download
                      className="size-4"
                      aria-hidden="true"
                    />
                    Baixar SVG
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="mt-3 w-full"
                  onClick={copiarConteudo}
                  disabled={!conteudoQr}
                >
                  {copiado ? (
                    <>
                      <Check
                        className="size-4"
                        aria-hidden="true"
                      />
                      Conteúdo copiado
                    </>
                  ) : (
                    <>
                      <Copy
                        className="size-4"
                        aria-hidden="true"
                      />
                      Copiar conteúdo
                    </>
                  )}
                </Button>

                <div className="mt-4 border border-border bg-muted/20 p-4">
                  <p className="text-xs leading-5 text-muted-foreground">
                    O QR Code é gerado localmente no navegador.
                    Seus dados não precisam ser enviados para um
                    servidor para criar a imagem.
                  </p>
                </div>
              </div>
            </div>

            {erro && (
              <div
                role="alert"
                className="mt-6 border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
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