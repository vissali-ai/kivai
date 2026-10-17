import { normalizeReportLabel } from "./campaign-types";
import { parseReportNumber, readCsvHeader } from "./csv-utils";

export type AuctionParticipant = {
  domain: string;
  impressionShare: number | null;
  overlapRate: number | null;
  positionAboveRate: number | null;
  outrankingShare: number | null;
};

export type AuctionChange = {
  domain: string;
  oldShare: number | null;
  currentShare: number | null;
  difference: number | null;
  state: "new_in_report" | "not_in_current_report" | "changed" | "unchanged";
};

function percentage(raw: string | undefined): number | null {
  if (!raw?.trim() || /^(--|—|n\/a|n\/d)$/i.test(raw.trim())) return null;
  const value = parseReportNumber(raw);
  if (!Number.isFinite(value) || value < 0) return null;
  // Percentuais exportados da interface geralmente têm o símbolo %. Quando o relatório
  // exporta proporções numéricas (0 a 1), converter para pontos percentuais.
  if (raw.includes("%")) return value;
  return value <= 1 ? value * 100 : value;
}

const required = {
  domain: [
    "dominio do url de visualizacao", "dominio do url de exibicao",
    "dominio do url de visualização", "display url domain", "display url domain (visible)",
    "display url", "dominio", "domain", "concorrente",
  ],
};

const optional = {
  impressionShare: ["parcela de impressoes", "parcela de impressões", "impression share", "parc. impressoes", "parc. impressões"],
  overlapRate: ["taxa de sobreposicao", "taxa de sobreposição", "overlap rate"],
  positionAboveRate: ["taxa de posicao superior", "taxa de posição superior", "position above rate"],
  outrankingShare: ["taxa de superacao", "taxa de superação", "outranking share"],
};

export function parseAuctionInsightsCsv(text: string): AuctionParticipant[] {
  const table = readCsvHeader(text, required, optional);
  if (!table) throw new Error("Não identifiquei a coluna Domínio do URL de visualização. Exporte o relatório Informações do leilão em CSV.");
  if (Object.entries(table.indices).filter(([key, value]) => key !== "domain" && value >= 0).length === 0) {
    throw new Error("O relatório deve incluir ao menos uma métrica de leilão, como Parcela de impressões ou Taxa de sobreposição.");
  }
  const found = new Map<string, AuctionParticipant>();
  for (const row of table.rows) {
    const domain = row[table.indices.domain]?.trim() ?? "";
    const clean = normalizeReportLabel(domain);
    if (!domain || /^(total|totais|you|voce|sua conta)(\s|$)/i.test(clean)) continue;
    const first: AuctionParticipant = {
      domain,
      impressionShare: percentage(row[table.indices.impressionShare]),
      overlapRate: percentage(row[table.indices.overlapRate]),
      positionAboveRate: percentage(row[table.indices.positionAboveRate]),
      outrankingShare: percentage(row[table.indices.outrankingShare]),
    };
    if (!found.has(clean)) found.set(clean, first);
  }
  if (!found.size) throw new Error("Nenhum domínio concorrente com dados válidos foi encontrado no relatório.");
  return [...found.values()];
}

export function compareAuctionReports(previous: AuctionParticipant[], current: AuctionParticipant[]): AuctionChange[] {
  const old = new Map(previous.map((item) => [normalizeReportLabel(item.domain), item]));
  const now = new Map(current.map((item) => [normalizeReportLabel(item.domain), item]));
  const combined = [...new Set([...old.keys(), ...now.keys()])];
  return combined.map((domain) => {
    const prev = old.get(domain), next = now.get(domain);
    const difference = prev?.impressionShare !== null && prev?.impressionShare !== undefined &&
      next?.impressionShare !== null && next?.impressionShare !== undefined
      ? next.impressionShare - prev.impressionShare
      : null;
    return {
      domain: next?.domain ?? prev?.domain ?? domain,
      oldShare: prev?.impressionShare ?? null,
      currentShare: next?.impressionShare ?? null,
      difference,
      state: !prev ? "new_in_report" : !next ? "not_in_current_report" : difference !== null && Math.abs(difference) >= 5 ? "changed" : "unchanged",
    } satisfies AuctionChange;
  }).sort((a, b) => {
    const score = (item: AuctionChange) => item.state === "new_in_report" ? 0 : item.state === "changed" ? 1 : item.state === "not_in_current_report" ? 2 : 3;
    return score(a) - score(b) || Math.abs(b.difference ?? 0) - Math.abs(a.difference ?? 0);
  });
}
