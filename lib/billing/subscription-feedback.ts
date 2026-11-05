/** Motivos de não renovação e dificuldade, compartilhados pelo formulário e pelo Admin. */
export const subscriptionFeedbackReasons = {
  value: "Não percebi vantagens suficientes no plano",
  usage: "Usei pouco as ferramentas",
  price: "O preço não compensou para mim",
  missing: "Faltou uma ferramenta ou funcionalidade",
  technical: "Encontrei problemas técnicos",
  payment: "Tive dificuldade com pagamento ou renovação",
  trial: "Eu queria apenas experimentar",
  other: "Outro motivo",
} as const;

export type SubscriptionFeedbackReason = keyof typeof subscriptionFeedbackReasons;
export function isSubscriptionFeedbackReason(reason: unknown): reason is SubscriptionFeedbackReason {
  return typeof reason === "string" && Object.prototype.hasOwnProperty.call(subscriptionFeedbackReasons, reason);
}
