/**
 * First recurring-payment due date for a Brazilian Asaas Checkout.
 *
 * Commercial policy: first due date must remain on the same Sao Paulo calendar
 * day that checkout was created. If a 60-minute checkout would cross midnight,
 * fail closed rather than silently schedule the first charge for tomorrow.
 * A due date is NOT proof of payment. Access remains pending until the
 * verified financial payment webhook applies the paid charge.
 *
 * The Asaas checkout API accepts YYYY-MM-DD HH:mm:ss (without an offset).
 * Format the intended local São Paulo time explicitly, not UTC server time.
 */
export function nextAsaasFirstDueDate(now: Date = new Date()): string {
  if (Number.isNaN(now.getTime())) throw Error("ASAAS_INVALID_CURRENT_TIME");
  // The checkout remains valid for 60 minutes. Keep the first due date
  // 10 minutes beyond that window so a valid completion never has an
  // already elapsed first due date. Commercial timing still needs approval.
  const due = new Date(now.getTime() + 70 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(due);
  const part = (name: string) => parts.find(p => p.type === name)?.value;
  const [year, month, day, hour, minute, second] =
    ["year", "month", "day", "hour", "minute", "second"].map(part);
  if (![year, month, day, hour, minute, second].every(Boolean)) {
    throw Error("ASAAS_INVALID_FORMATTED_DUE_DATE");
  }
  const nowParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const nowPart = (name: string) => nowParts.find(p => p.type === name)?.value;
  if (nowPart("year") !== year || nowPart("month") !== month || nowPart("day") !== day) {
    throw Error("ASAAS_SAME_DAY_CHECKOUT_WINDOW_CLOSED");
  }
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
