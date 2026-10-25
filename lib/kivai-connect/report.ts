import { z } from "zod";

const label = z.string().trim().min(1).max(160);
export const reportSchema = z.object({
  schemaVersion: z.literal(1), collectedAt: z.string().datetime(),
  manufacturer: label, model: label, androidVersion: label,
  sdk: z.number().int().min(21).max(100),
  storageRaw: z.string().max(8000), memoryRaw: z.string().max(16000),
  apps: z.array(z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z0-9_]+)+$/).max(240)).max(2000),
  warnings: z.array(z.string().max(240)).max(20),
});
export type TvReport = z.infer<typeof reportSchema>;
export function parseReport(raw: string): TvReport {
  if (new TextEncoder().encode(raw).length > 600_000) throw Error("O relatório excede 600 KB.");
  const result = reportSchema.safeParse(JSON.parse(raw.replace(/^\uFEFF/, "")));
  if (!result.success) throw Error("Relatório incompatível. Gere um novo arquivo no Kivai Connect.");
  if (Date.parse(result.data.collectedAt) > Date.now() + 300_000) throw Error("Data do relatório inválida. Confira o relógio do computador.");
  return result.data;
}
export function summarize(report: TvReport) {
  const row = report.storageRaw.split(/\r?\n/).find(line => /\s\/data\s*$/.test(line));
  const cells = row?.trim().split(/\s+/);
  const total = cells && /^\d+$/.test(cells[1]) ? Number(cells[1]) * 1024 : null;
  const available = cells && /^\d+$/.test(cells[3]) ? Number(cells[3]) * 1024 : null;
  const memory = report.memoryRaw.match(/^MemTotal:\s+(\d+)\s+kB/m);
  const freeMemory = report.memoryRaw.match(/^MemAvailable:\s+(\d+)\s+kB/m);
  return { manufacturer: report.manufacturer, model: report.model, androidVersion: report.androidVersion,
    sdk: report.sdk, appCount: new Set(report.apps).size,
    storageTotal: total && Number.isSafeInteger(total) ? total : null,
    storageAvailable: total && available !== null && available <= total && available >= 0 ? available : null,
    memoryTotal: memory ? Number(memory[1]) * 1024 : null,
    memoryAvailable: freeMemory ? Number(freeMemory[1]) * 1024 : null };
}
export const actions = {
  storage: { title: "Revisar armazenamento", text: "Abra Configurações → Armazenamento na TV. Revise downloads e arquivos pessoais antes de excluir qualquer item. Preserve uma cópia do que deseja manter." },
  apps: { title: "Revisar aplicativos pessoais", text: "Abra Configurações → Aplicativos. Avalie apenas os apps que você instalou e reconhece. A lista de pacotes não informa frequência de uso. Não desative componentes do sistema." },
  updates: { title: "Conferir atualizações oficiais", text: "Consulte a atualização do sistema nas configurações e a atualização de apps na loja oficial. Mantenha a TV ligada à energia e siga as instruções do fabricante." },
  restart: { title: "Considerar uma reinicialização", text: "Se houver lentidão temporária, encerre atividades em andamento e utilize a opção Reiniciar do sistema. Não interrompa uma atualização. Memória ocupada, sozinha, não indica defeito." },
  support: { title: "Consultar suporte do fabricante", text: "Se o problema persistir, anote o modelo e a versão e procure o suporte oficial. Não instale firmware de terceiros nem execute comandos encontrados em recomendações não verificadas." },
} as const;
export const actionIds = ["storage", "apps", "updates", "restart", "support"] as const;
export const aiResultSchema = z.object({ actions: z.array(z.enum(actionIds)).min(1).max(5) }).strict();
export type TvAiResult = z.infer<typeof aiResultSchema>;
export const aiInputSchema = z.object({ consent: z.literal(true), goal: z.enum(["entender", "armazenamento", "lentidao"]),
  summary: z.object({ manufacturer: label, model: label, androidVersion: label, sdk: z.number().int().min(21).max(100), appCount: z.number().int().min(0).max(2000),
    storageTotal: z.number().nonnegative().max(1e15).nullable(), storageAvailable: z.number().nonnegative().max(1e15).nullable(),
    memoryTotal: z.number().nonnegative().max(1e15).nullable(), memoryAvailable: z.number().nonnegative().max(1e15).nullable() }).strict(),
}).strict();
