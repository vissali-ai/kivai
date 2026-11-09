/**
 * First recurring-payment due date for a Brazilian Asaas Checkout.
 *
 * Target a near-immediate due date rather than imposing a 24-hour delay.
 * A due date is NOT proof of payment. Access remains pending until the
 * verified financial payment webhook applies the paid charge.
 *
 * The Asaas checkout API accepts YYYY-MM-DD HH:mm:ss (without an offset).
 * Format the intended local São Paulo time explicitly, not UTC server time.
 */
export function nextAsaasFirstDueDate(now: Date = new Date()): string {
  if (Number.isNaN(now.getTime())) throw Error("ASAAS_INVALID_CURRENT_TIME");
  // A short buffer prevents a timestamp that is already in the past when
  // checkout creation and card verification complete.
  const due = new Date(now.getTime() + 5 * 60 * 1000);
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
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
