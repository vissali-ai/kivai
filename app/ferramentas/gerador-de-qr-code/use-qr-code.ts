"use client";

import { useState, useMemo, useEffect } from "react";
import type { TipoQrCode, NivelCorrecao, ModeloVisual, ModeloQrCode } from "./qr-config";
import { criarArteSvg } from "./qr-artwork";
import { escaparWifi, normalizarUrl, numeroTelefoneBrasil } from "./qr-content";
import { downloadBlob } from "@/lib/image-tools/canvas";

export function useQrCode() {
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
        setGerando(false);
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


  return {
    tipo,
    url,
    setUrl,
    texto,
    setTexto,
    whatsappNumero,
    setWhatsappNumero,
    whatsappMensagem,
    setWhatsappMensagem,
    telefone,
    setTelefone,
    emailDestino,
    setEmailDestino,
    emailAssunto,
    setEmailAssunto,
    emailMensagem,
    setEmailMensagem,
    wifiNome,
    setWifiNome,
    wifiSenha,
    setWifiSenha,
    wifiSeguranca,
    setWifiSeguranca,
    wifiOculta,
    setWifiOculta,
    corQr,
    setCorQr,
    corFundo,
    setCorFundo,
    tamanho,
    setTamanho,
    margem,
    setMargem,
    nivelCorrecao,
    setNivelCorrecao,
    modeloVisual,
    chamada,
    setChamada,
    nomeMarca,
    setNomeMarca,
    logoDataUrl,
    setLogoDataUrl,
    qrDataUrl,
    gerando,
    copiado,
    erro,
    arteSvg,
    arteDataUrl,
    conteudoQr,
    trocarTipo,
    aplicarModelo,
    carregarLogo,
    copiarConteudo,
    baixarPng,
    baixarSvg,
  };
}
