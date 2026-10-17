/**
 * Data civil do último dia completamente encerrado no fuso da conta.
 * Padrão de sugestão para contas brasileiras: America/Sao_Paulo.
 * A pessoa deve confirmar o período exportado e o fuso do cliente.
 */
export function lastCompletedDayInTimeZone(timeZone: string, at = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(at);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  if (!year || !month || !day) throw new Error("Fuso ou data inválida");
  return new Date(Date.UTC(year, month - 1, day - 1, 12)).toISOString().slice(0, 10);
}

export function firstDayOfMonthISO(isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) throw new Error("Data inválida");
  return isoDate.slice(0, 7) + "-01";
}
