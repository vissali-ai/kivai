"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdminApi } from "@/lib/blog/auth";
import { supabaseRest } from "@/lib/blog/supabase";
import {
  automationAudienceOptions,
  automationTriggerOptions,
  type AutomationAudience,
  type AutomationTrigger,
} from "@/lib/marketing/automation-flows";

function clean(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

function validUrl(value: string) {
  return !value || /^https:\/\//i.test(value) || value.includes("{{link}}");
}

function readFlow(formData: FormData) {
  const name = clean(formData, "name", 140);
  const triggerKey = clean(formData, "triggerKey", 60) as AutomationTrigger;
  const audience = clean(formData, "audience", 30) as AutomationAudience;
  const delayHours = Math.max(0, Math.min(720, Number(formData.get("delayHours") ?? 0) || 0));
  const subject = clean(formData, "subject", 200);
  const message = clean(formData, "message", 30000);
  const ctaLabel = clean(formData, "ctaLabel", 80);
  const ctaUrl = clean(formData, "ctaUrl", 1000);
  const secondaryCtaLabel = clean(formData, "secondaryCtaLabel", 80);
  const secondaryCtaUrl = clean(formData, "secondaryCtaUrl", 1000);
  const enabled = formData.get("enabled") === "on";

  if (!name || !subject || !message) throw new Error("Nome, assunto e conteúdo do e-mail são obrigatórios.");
  if (!automationTriggerOptions.some((item) => item.key === triggerKey)) throw new Error("Gatilho inválido.");
  if (!automationAudienceOptions.some((item) => item.key === audience)) throw new Error("Público inválido.");
  if ((ctaLabel && !ctaUrl) || (!ctaLabel && ctaUrl)) throw new Error("O botão principal precisa de texto e link.");
  if ((secondaryCtaLabel && !secondaryCtaUrl) || (!secondaryCtaLabel && secondaryCtaUrl)) throw new Error("O segundo botão precisa de texto e link.");
  if (!validUrl(ctaUrl) || !validUrl(secondaryCtaUrl)) throw new Error("Os links devem começar com https:// ou usar {{link}}.");

  return {
    name,
    trigger_key: triggerKey,
    audience,
    delay_hours: delayHours,
    subject,
    message,
    cta_label: ctaLabel || null,
    cta_url: ctaUrl || null,
    secondary_cta_label: secondaryCtaLabel || null,
    secondary_cta_url: secondaryCtaUrl || null,
    enabled,
    updated_at: new Date().toISOString(),
  };
}

export async function createAutomationFlow(formData: FormData) {
  await assertAdminApi();
  const payload = readFlow(formData);
  await supabaseRest("automation_flows", {
    method: "POST",
    body: JSON.stringify({ ...payload, created_at: new Date().toISOString() }),
  });
  revalidatePath("/admin/fluxos-automaticos");
  redirect("/admin/fluxos-automaticos?created=1");
}

export async function updateAutomationFlow(formData: FormData) {
  await assertAdminApi();
  const id = clean(formData, "id", 80);
  if (!id) throw new Error("Fluxo inválido.");
  const payload = readFlow(formData);
  await supabaseRest(`automation_flows?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  revalidatePath("/admin/fluxos-automaticos");
  redirect("/admin/fluxos-automaticos?saved=1");
}

export async function toggleAutomationFlow(formData: FormData) {
  await assertAdminApi();
  const id = clean(formData, "id", 80);
  const enabled = formData.get("enabled") === "true";
  if (!id) throw new Error("Fluxo inválido.");
  await supabaseRest(`automation_flows?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ enabled, updated_at: new Date().toISOString() }),
  });
  revalidatePath("/admin/fluxos-automaticos");
}

export async function deleteAutomationFlow(formData: FormData) {
  await assertAdminApi();
  const id = clean(formData, "id", 80);
  const confirmation = clean(formData, "confirmation", 20);
  if (!id || confirmation !== "EXCLUIR") throw new Error("Confirmação inválida.");
  await supabaseRest(`automation_flows?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
  revalidatePath("/admin/fluxos-automaticos");
}
