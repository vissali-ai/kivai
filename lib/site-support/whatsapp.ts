import "server-only";

import { supabaseRest } from "@/lib/blog/supabase";

export type WhatsappSupportConfig = {
  enabled: boolean;
  phone: string;
  message: string;
};

type ConfigRow = WhatsappSupportConfig;

export const DEFAULT_WHATSAPP_SUPPORT: WhatsappSupportConfig = {
  enabled: true,
  phone: "5531996205058",
  message: "Estou utilizando o kivai e gostaria de tirar uma dúvida.",
};

export class InvalidWhatsappConfig extends Error {}

function validateConfig(input: unknown): WhatsappSupportConfig {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new InvalidWhatsappConfig("Informe os dados do atendimento.");
  }

  const source = input as Record<string, unknown>;
  if (typeof source.enabled !== "boolean") {
    throw new InvalidWhatsappConfig("Escolha se o botão deve ficar ativo.");
  }

  const digits = typeof source.phone === "string" ? source.phone.replace(/\D/g, "") : "";
  const phone = digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
    ? digits
    : digits.length === 10 || digits.length === 11 ? `55${digits}` : "";
  if (!/^55[1-9][0-9]{9,10}$/.test(phone)) {
    throw new InvalidWhatsappConfig("Informe um WhatsApp brasileiro válido, com DDD.");
  }

  const message = typeof source.message === "string" ? source.message.trim() : "";
  if (!message || message.length > 500) {
    throw new InvalidWhatsappConfig("Escreva uma mensagem de 1 a 500 caracteres.");
  }

  return { enabled: source.enabled, phone, message };
}

export async function getWhatsappSupportConfig(): Promise<WhatsappSupportConfig> {
  const rows = await supabaseRest<ConfigRow[]>(
    "site_whatsapp_support?select=enabled,phone,message&id=eq.1&limit=1"
  );
  return rows[0] ?? DEFAULT_WHATSAPP_SUPPORT;
}

export async function saveWhatsappSupportConfig(input: unknown): Promise<WhatsappSupportConfig> {
  const config = validateConfig(input);
  const rows = await supabaseRest<ConfigRow[]>("site_whatsapp_support?id=eq.1", {
    method: "PATCH",
    body: JSON.stringify({ ...config, updated_at: new Date().toISOString() }),
  });
  if (!rows.length) throw new Error("Não foi possível encontrar a configuração do WhatsApp.");
  return { enabled: rows[0].enabled, phone: rows[0].phone, message: rows[0].message };
}
