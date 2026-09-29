import type { ModeloVisual } from "./qr-config";

function escaparXml(valor: string) {
  return valor.replace(/[<>&"']/g, (caractere) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;",
  })[caractere] ?? caractere);
}

export function criarArteSvg({
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
