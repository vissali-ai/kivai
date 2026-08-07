import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const workspace = process.cwd();
const environmentFiles = [".env.production.local", ".env.local", ".env.production", ".env"];

function readSetting(name) {
  if (process.env[name] !== undefined) return process.env[name].trim();

  for (const filename of environmentFiles) {
    const path = resolve(workspace, filename);
    if (!existsSync(path)) continue;

    const line = readFileSync(path, "utf8")
      .split(/\r?\n/)
      .find((candidate) => candidate.startsWith(`${name}=`));

    if (line) return line.slice(name.length + 1).trim().replace(/^['"]|['"]$/g, "");
  }

  return "";
}

function fail(message) {
  console.error(`[AdSense] ${message}`);
  process.exitCode = 1;
}

const adsTxtPath = resolve(workspace, "public", "ads.txt");
const adsTxt = existsSync(adsTxtPath) ? readFileSync(adsTxtPath, "utf8") : "";
const googleLines = adsTxt
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#") && line.startsWith("google.com,"));
const validGoogleLine = /^google\.com,\s*pub-(\d{16}),\s*DIRECT,\s*f08c47fec0942fa0$/i;
const validEntries = googleLines
  .map((line) => line.match(validGoogleLine))
  .filter(Boolean);

if (!adsTxt) fail("public/ads.txt não foi encontrado ou está vazio.");
if (googleLines.length === 0) fail("ads.txt não contém uma autorização do Google.");
if (validEntries.length !== googleLines.length) {
  fail("ads.txt contém uma linha do Google com formato inválido.");
}

const enabled = readSetting("NEXT_PUBLIC_ADS_ENABLED") === "true";
const clientId = readSetting("NEXT_PUBLIC_ADSENSE_CLIENT");
const clientMatch = clientId.match(/^ca-pub-(\d{16})$/);

if (enabled && !clientId) {
  fail("NEXT_PUBLIC_ADS_ENABLED=true exige NEXT_PUBLIC_ADSENSE_CLIENT.");
} else if (clientId && !clientMatch) {
  fail("NEXT_PUBLIC_ADSENSE_CLIENT deve seguir o formato ca-pub + 16 dígitos.");
} else if (clientMatch && !validEntries.some((entry) => entry[1] === clientMatch[1])) {
  fail("o publisher do client AdSense não coincide com public/ads.txt.");
}

if (!process.exitCode) {
  console.log(
    enabled
      ? "[AdSense] Configuração ativa, client e ads.txt consistentes."
      : "[AdSense] Configuração segura: anúncios desativados neste ambiente e ads.txt válido."
  );
}
