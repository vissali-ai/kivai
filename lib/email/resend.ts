import "server-only";

const KIVAI_FROM = "Kivai <contato@kivai.com.br>";
const KIVAI_LEADS_EMAIL = "contatokivai@gmail.com";

export async function sendKivaiEmail(input: {
  subject: string;
  text: string;
  replyTo?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY não configurada.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: KIVAI_FROM,
      to: [KIVAI_LEADS_EMAIL],
      reply_to: input.replyTo,
      subject: input.subject,
      text: input.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend rejeitou o envio (${response.status}).`);
  }
}
