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
import { downloadBlob } from "@/lib/image-tools/canvas";
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

type ModeloVisual = "padrao" | "topo" | "lateral" | "marca" | "selo";

type ModeloQrCode = {
  id: ModeloVisual;
  titulo: string;
  descricao: string;
};

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

const MODELOS_QR_CODE: ModeloQrCode[] = [
  {
    id: "padrao",
    titulo: "Padrão",
    descricao: "Somente o QR Code, sem elementos adicionais.",
  },
  {
    id: "topo",
    titulo: "Chamada superior",
    descricao: "Título destacado acima do código para cartazes e vitrines.",
  },
  {
    id: "lateral",
    titulo: "Etiqueta lateral",
    descricao: "QR Code e chamada lado a lado para embalagens e balcões.",
  },
  {
    id: "marca",
    titulo: "Cartão de marca",
    descricao: "Inclui nome, logo e chamada em uma peça completa.",
  },
  {
    id: "selo",
    titulo: "Selo promocional",
    descricao: "Moldura marcante com chamada inferior para campanhas.",
  },
];

function escaparXml(valor: string) {
  return valor.replace(/[<>&"']/g, (caractere) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;",
  })[caractere] ?? caractere);
}

function criarArteSvg({
  qrDataUrl,
  modelo,
  tamanho,
  corQr,
  corFundo,
  chamada,
  nomeMarca,
  logoDataUrl,
}: {
  qrDataUrl: string;
  modelo: ModeloVisual;
  tamanho: number;
  corQr: string;
  corFundo: string;
  chamada: string;
  nomeMarca: string;
  logoDataUrl: string;
}) {
  if (!qrDataUrl) return "";
  const texto = escaparXml(chamada.trim() || "ESCANEIE AQUI");
  const marca = escaparXml(nomeMarca.trim() || "SUA MARCA");
  const fonte = "Arial, Helvetica, sans-serif";
  const logo = logoDataUrl
    ? `<image href="${logoDataUrl}" x="${tamanho * 0.08}" y="${tamanho * 0.055}" width="${tamanho * 0.16}" height="${tamanho * 0.16}" preserveAspectRatio="xMidYMid meet"/>`
    : "";

  if (modelo === "padrao") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho}" viewBox="0 0 ${tamanho} ${tamanho}"><image href="${qrDataUrl}" width="${tamanho}" height="${tamanho}"/></svg>`;
  }

  if (modelo === "topo") {
    const cabecalho = Math.round(tamanho * 0.25);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho + cabecalho}" viewBox="0 0 ${tamanho} ${tamanho + cabecalho}"><rect width="100%" height="100%" rx="${tamanho * 0.035}" fill="${corFundo}"/><rect width="100%" height="${cabecalho}" rx="${tamanho * 0.035}" fill="${corQr}"/><rect y="${cabecalho * 0.75}" width="100%" height="${cabecalho * 0.25}" fill="${corQr}"/><text x="50%" y="${cabecalho * 0.62}" text-anchor="middle" font-family="${fonte}" font-size="${tamanho * 0.085}" font-weight="800" fill="${corFundo}">${texto}</text><image href="${qrDataUrl}" y="${cabecalho}" width="${tamanho}" height="${tamanho}"/></svg>`;
  }

  if (modelo === "lateral") {
    const largura = Math.round(tamanho * 1.58);
    const painelX = tamanho;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${tamanho}" viewBox="0 0 ${largura} ${tamanho}"><rect width="100%" height="100%" rx="${tamanho * 0.09}" fill="${corQr}"/><image href="${qrDataUrl}" width="${tamanho}" height="${tamanho}"/><text x="${painelX + (largura - painelX) / 2}" y="${tamanho * 0.43}" text-anchor="middle" font-family="${fonte}" font-size="${tamanho * 0.075}" font-weight="800" fill="${corFundo}">${texto}</text><text x="${painelX + (largura - painelX) / 2}" y="${tamanho * 0.58}" text-anchor="middle" font-family="${fonte}" font-size="${tamanho * 0.042}" font-weight="600" fill="${corFundo}">${marca}</text></svg>`;
  }

  if (modelo === "marca") {
    const altura = Math.round(tamanho * 1.36);
    const topo = Math.round(tamanho * 0.24);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${altura}" viewBox="0 0 ${tamanho} ${altura}"><rect width="100%" height="100%" rx="${tamanho * 0.045}" fill="${corFundo}" stroke="${corQr}" stroke-width="${tamanho * 0.025}"/>${logo}<text x="${logoDataUrl ? tamanho * 0.28 : tamanho * 0.08}" y="${topo * 0.56}" font-family="${fonte}" font-size="${tamanho * 0.065}" font-weight="800" fill="${corQr}">${marca}</text><image href="${qrDataUrl}" y="${topo}" width="${tamanho}" height="${tamanho}"/><rect x="${tamanho * 0.08}" y="${tamanho * 1.245}" width="${tamanho * 0.84}" height="${tamanho * 0.08}" rx="${tamanho * 0.04}" fill="${corQr}"/><text x="50%" y="${tamanho * 1.302}" text-anchor="middle" font-family="${fonte}" font-size="${tamanho * 0.04}" font-weight="700" fill="${corFundo}">${texto}</text></svg>`;
  }

  const altura = Math.round(tamanho * 1.2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${altura}" viewBox="0 0 ${tamanho} ${altura}"><rect x="${tamanho * 0.02}" y="${tamanho * 0.02}" width="${tamanho * 0.96}" height="${altura - tamanho * 0.04}" rx="${tamanho * 0.12}" fill="${corFundo}" stroke="${corQr}" stroke-width="${tamanho * 0.035}"/><image href="${qrDataUrl}" x="${tamanho * 0.05}" y="${tamanho * 0.03}" width="${tamanho * 0.9}" height="${tamanho * 0.9}"/><path d="M ${tamanho * 0.17} ${tamanho * 0.94} H ${tamanho * 0.83} Q ${tamanho * 0.9} ${tamanho * 0.94} ${tamanho * 0.9} ${tamanho * 1.01} V ${tamanho * 1.1} H ${tamanho * 0.1} V ${tamanho * 1.01} Q ${tamanho * 0.1} ${tamanho * 0.94} ${tamanho * 0.17} ${tamanho * 0.94}" fill="${corQr}"/><text x="50%" y="${tamanho * 1.055}" text-anchor="middle" font-family="${fonte}" font-size="${tamanho * 0.055}" font-weight="800" fill="${corFundo}">${texto}</text></svg>`;
}

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

function normalizarEntradaTelefoneBrasil(valor: string) {
  const digitos = somenteDigitos(valor);
  const numeroNacional = digitos.length > 11 && digitos.startsWith("55")
    ? digitos.slice(2)
    : digitos;

  return numeroNacional.slice(0, 11);
}

function numeroTelefoneBrasil(valor: string) {
  const numeroNacional = normalizarEntradaTelefoneBrasil(valor);

  if (!/^\d{10,11}$/.test(numeroNacional)) {
    return "";
  }

  return `55${numeroNacional}`;
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
  const [modeloVisual, setModeloVisual] = useState<ModeloVisual>("padrao");
  const [chamada, setChamada] = useState("ESCANEIE AQUI");
  const [nomeMarca, setNomeMarca] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState("");

  const [qrDataUrl, setQrDataUrl] = useState("");
  const [gerando, setGerando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState("");

  const arteSvg = useMemo(() => criarArteSvg({
    qrDataUrl,
    modelo: modeloVisual,
    tamanho,
    corQr,
    corFundo,
    chamada,
    nomeMarca,
    logoDataUrl,
  }), [qrDataUrl, modeloVisual, tamanho, corQr, corFundo, chamada, nomeMarca, logoDataUrl]);

  const arteDataUrl = useMemo(
    () => arteSvg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(arteSvg)}` : "",
    [arteSvg]
  );

  const conteudoQr = useMemo(() => {
    switch (tipo) {
      case "url":
        return normalizarUrl(url);

      case "texto":
        return texto.trim();

      case "whatsapp": {
        const numero = numeroTelefoneBrasil(whatsappNumero);

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
        const numero = numeroTelefoneBrasil(telefone);

        return numero ? `tel:+${numero}` : "";
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

  function aplicarModelo(modelo: ModeloQrCode) {
    setModeloVisual(modelo.id);
    setErro("");
  }

  function carregarLogo(arquivo?: File) {
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) {
      setErro("Escolha uma imagem válida para a logo.");
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () => {
      setLogoDataUrl(typeof leitor.result === "string" ? leitor.result : "");
      setErro("");
    };
    leitor.onerror = () => setErro("Não foi possível carregar a logo.");
    leitor.readAsDataURL(arquivo);
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

  async function baixarPng() {
    if (!arteDataUrl) {
      setErro("Preencha os dados antes de baixar o QR Code.");
      return;
    }

    try {
      const imagem = new Image();
      imagem.src = arteDataUrl;
      await imagem.decode();
      const canvas = document.createElement("canvas");
      canvas.width = imagem.naturalWidth;
      canvas.height = imagem.naturalHeight;
      const contexto = canvas.getContext("2d");
      if (!contexto) throw new Error("Canvas indisponível");
      contexto.drawImage(imagem, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("PNG indisponível");
      downloadBlob(blob, `kivai-qrcode-${tipo}.png`);
      setErro("");
    } catch {
      setErro("Não foi possível baixar o QR Code em PNG.");
    }
  }

  async function baixarSvg() {
    if (!arteSvg) {
      setErro("Preencha os dados antes de baixar o QR Code.");
      return;
    }

    try {
      const blob = new Blob([arteSvg], {
        type: "image/svg+xml;charset=utf-8",
      });

      downloadBlob(blob, `kivai-qrcode-${tipo}.svg`);
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
                Número com DDD
              </label>

              <div className="mt-2 flex h-11 border border-border bg-background focus-within:border-primary">
                <span className="flex items-center border-r border-border px-3 text-sm font-medium text-foreground">+55</span>
                <input
                  id="qr-whatsapp-numero"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={11}
                  value={whatsappNumero}
                  onChange={(event) => setWhatsappNumero(normalizarEntradaTelefoneBrasil(event.target.value))}
                  placeholder="31999999999"
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>

              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Digite apenas DDD e número. O código do Brasil (+55) será incluído automaticamente.
              </p>
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

            <div className="mt-2 flex h-11 border border-border bg-background focus-within:border-primary">
              <span className="flex items-center border-r border-border px-3 text-sm font-medium text-foreground">+55</span>
              <input
                id="qr-telefone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={11}
                value={telefone}
                onChange={(event) => setTelefone(normalizarEntradaTelefoneBrasil(event.target.value))}
                placeholder="(71) 99999-0000"
                className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Digite apenas DDD e número. O código do Brasil (+55) será incluído automaticamente.
            </p>
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
            Voltar para ferramentas
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
            Crie QR Codes para links, textos, Wi-Fi, e-mail,
            telefone e WhatsApp. Nos números brasileiros, o +55
            é aplicado automaticamente. Personalize a aparência
            ou transforme o código em uma peça visual com texto,
            marca e logo.
          </p>
        </div>

        <Card className="mx-auto max-w-4xl overflow-hidden">
          <CardHeader>
            <CardTitle>Crie seu QR Code</CardTitle>

            <CardDescription>
              Escolha o conteúdo, confira a prévia, personalize a
              composição visual e baixe a arte completa em PNG ou SVG.
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

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="qr-chamada" className="text-sm font-medium">
                        Texto exibido na arte
                      </label>
                      <input
                        id="qr-chamada"
                        type="text"
                        maxLength={28}
                        value={chamada}
                        onChange={(event) => setChamada(event.target.value)}
                        placeholder="Ex.: Aponte a câmera"
                        className="mt-2 h-11 w-full border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                      />
                    </div>

                    <div>
                      <label htmlFor="qr-marca" className="text-sm font-medium">
                        Nome da marca
                      </label>
                      <input
                        id="qr-marca"
                        type="text"
                        maxLength={24}
                        value={nomeMarca}
                        onChange={(event) => setNomeMarca(event.target.value)}
                        placeholder="Ex.: Minha Loja"
                        className="mt-2 h-11 w-full border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="qr-logo" className="text-sm font-medium">
                      Logo opcional
                    </label>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <input
                        id="qr-logo"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={(event) => carregarLogo(event.target.files?.[0])}
                        className="min-w-0 flex-1 border border-border bg-background p-2 text-xs file:mr-3 file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-medium file:text-primary-foreground"
                      />
                      {logoDataUrl && (
                        <Button type="button" variant="outline" onClick={() => setLogoDataUrl("")}>
                          Remover logo
                        </Button>
                      )}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      A logo aparece no modelo Cartão de marca, sem cobrir a área de leitura do QR Code.
                    </p>
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
                          src={arteDataUrl}
                          alt="Pré-visualização da arte com QR Code"
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
                    disabled={!arteDataUrl || gerando}
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
                    disabled={!arteSvg || gerando}
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

                {qrDataUrl && (
                  <div className="mt-5 border border-border bg-muted/20 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Composições criativas
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      Escolha uma composição. O texto, a marca, a logo e as cores podem ser personalizados.
                    </p>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      {MODELOS_QR_CODE.map((modelo) => {
                        const selecionado = modeloVisual === modelo.id;

                        return (
                          <button
                            key={modelo.titulo}
                            type="button"
                            onClick={() => aplicarModelo(modelo)}
                            aria-pressed={selecionado}
                            className={[
                              "flex min-h-20 items-start gap-3 border p-3 text-left transition-colors",
                              selecionado
                                ? "border-primary bg-primary/5"
                                : "border-border bg-background hover:bg-muted/40",
                            ].join(" ")}
                          >
                            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-border bg-muted/30 text-[10px] font-bold text-primary" aria-hidden="true">
                              {modelo.id === "padrao" ? "QR" : modelo.id === "topo" ? "↑" : modelo.id === "lateral" ? "→" : modelo.id === "marca" ? "M" : "●"}
                            </span>
                            <span>
                              <span className="block text-sm font-medium">{modelo.titulo}</span>
                              <span className="mt-1 block text-xs leading-4 text-muted-foreground">{modelo.descricao}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

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
