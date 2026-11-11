import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { plainText } from "@/lib/blog/sanitize";

const MAX_HTML_BYTES = 1_000_000;
const MIN_ARTICLE_CHARS = 900;

/** Coleta somente páginas HTML públicas. Não acessa IPs literais, rede interna,
 * redirecionamentos para outros domínios ou mecanismos de autenticação.
 * Falhar fechado é preferível a criar matérias com conteúdo incompleto.
 */
function publicAddress(address: string) {
  if (address.includes(":")) {
    const first = parseInt(address.split(":")[0], 16);
    return first >= 0x2000 && first <= 0x3fff && !address.toLowerCase().startsWith("2001:db8:");
  }
  const n = address.split(".").map(Number);
  if (n.length !== 4 || n.some((v) => !Number.isInteger(v) || v < 0 || v > 255)) return false;
  return !(n[0] === 0 || n[0] === 10 || n[0] === 127 || n[0] >= 224 ||
    (n[0] === 100 && n[1] >= 64 && n[1] <= 127) ||
    (n[0] === 169 && n[1] === 254) ||
    (n[0] === 172 && n[1] >= 16 && n[1] <= 31) ||
    (n[0] === 192 && (n[1] === 168 || n[1] === 0)) ||
    (n[0] === 198 && (n[1] === 18 || n[1] === 19)) ||
    (n[0] === 203 && n[1] === 0 && n[2] === 113));
}

async function safePublicUrl(raw: string, originalHost?: string) {
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password || url.port ||
    isIP(url.hostname) !== 0 || url.hostname === "localhost" ||
    url.hostname.endsWith(".local") || url.hostname.endsWith(".internal") ||
    (originalHost && url.hostname.toLowerCase().replace(/^www\./, "") !== originalHost)) {
    throw new Error("URL de destino não permitida.");
  }
  const records = await lookup(url.hostname, { all: true });
  if (!records.length || records.some((r) => !publicAddress(r.address))) {
    throw new Error("Endereço não público.");
  }
  return url;
}

function articleText(html: string): string {
  const withoutNoise = html
    .replace(/<(?:script|style|noscript|svg|nav|footer|header|aside)\b[^>]*>[\s\S]*?<\/\s*(?:script|style|noscript|svg|nav|footer|header|aside)\s*>/gi, " ");
  // A presença de uma região semântica reduz a chance de enviar menus e listagens.
  const region = withoutNoise.match(/<article\b[^>]*>([\s\S]*?)<\/article\s*>/i)
    ?? withoutNoise.match(/<main\b[^>]*>([\s\S]*?)<\/main\s*>/i);
  if (!region) return "";
  return plainText(region[1]).replace(/\s+/g, " ").trim();
}

export async function readPublicEditorialArticle(sourceUrl: string) {
  const initial = await safePublicUrl(sourceUrl);
  const originalHost = initial.hostname.toLowerCase().replace(/^www\./, "");
  let current = initial;
  for (let redirects = 0; redirects < 3; redirects++) {
    const response = await fetch(current, {
      redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(10_000),
      headers: { Accept: "text/html", "User-Agent": "KivaiEditorial/1.0 (+https://www.kivai.com.br/blog)" },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirecionamento sem destino.");
      current = await safePublicUrl(new URL(location, current).toString(), originalHost);
      continue;
    }
    if (!response.ok) throw new Error("O site da fonte retornou HTTP " + response.status + ".");
    if (!(response.headers.get("content-type") || "").toLowerCase().includes("text/html")) {
      throw new Error("A fonte não retornou conteúdo HTML.");
    }
    if (Number(response.headers.get("content-length") || 0) > MAX_HTML_BYTES) {
      throw new Error("A página excedeu o tamanho permitido.");
    }
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > MAX_HTML_BYTES) throw new Error("A página excedeu o tamanho permitido.");
    const html = new TextDecoder().decode(bytes);
    if (/<meta[^>]+(?:article:content_tier|paywall)[^>]+(?:locked|premium|paid)/i.test(html)) {
      throw new Error("A fonte indica conteúdo restrito.");
    }
    const text = articleText(html);
    if (text.length < MIN_ARTICLE_CHARS) throw new Error("A página não disponibilizou texto público suficiente da reportagem.");
    return text.slice(0, 22_000);
  }
  throw new Error("A fonte excedeu o limite de redirecionamentos.");
}
