export const AI_CREDIT_PACKS = {
  starter: { label: "Inicial", credits: 50, cents: 990 },
  professional: { label: "Profissional", credits: 150, cents: 1990 },
  agency: { label: "Agência", credits: 400, cents: 3990 },
} as const;
export type AiCreditPackCode = keyof typeof AI_CREDIT_PACKS;
export function isAiCreditPackCode(input: unknown): input is AiCreditPackCode {
  return typeof input === "string" && Object.hasOwn(AI_CREDIT_PACKS, input);
}
export function aiCreditSalesEnabled() {
  return process.env.AI_CREDIT_SALES_ENABLED === "true";
}
