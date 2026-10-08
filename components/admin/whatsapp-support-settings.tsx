"use client";

import { FormEvent, useState } from "react";
import { MessageCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WhatsappSupportConfig } from "@/lib/site-support/whatsapp";

export function WhatsappSupportSettings({
  initialSettings,
}: {
  initialSettings: WhatsappSupportConfig;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [hasError, setHasError] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback("");

    try {
      const response = await fetch("/api/admin/whatsapp-widget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível salvar.");
      setSettings(result as WhatsappSupportConfig);
      setHasError(false);
      setFeedback("Configurações do WhatsApp salvas.");
    } catch (error) {
      setHasError(true);
      setFeedback(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <MessageCircle aria-hidden="true" className="mt-1 size-6 text-primary" />
        <div>
          <h2 className="text-xl font-semibold">Atendimento pelo WhatsApp</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Configure o botão flutuante das páginas públicas. Não aparece no Admin nem nas áreas de conta e pagamento.
          </p>
        </div>
      </div>
      <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="flex items-center gap-3 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.checked }))}
            className="size-4 accent-primary"
          />
          Exibir botão do WhatsApp no site público
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Número com DDD</span>
          <Input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={settings.phone}
            onChange={(event) => setSettings((current) => ({ ...current, phone: event.target.value }))}
            placeholder="(31) 99620-5058"
            required
          />
        </label>
        <label className="grid gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium">Mensagem única de atendimento</span>
          <textarea
            className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            maxLength={500}
            required
            value={settings.message}
            onChange={(event) => setSettings((current) => ({ ...current, message: event.target.value }))}
          />
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Button type="submit" disabled={busy}>
            <Save className="size-4" />{busy ? "Salvando..." : "Salvar WhatsApp"}
          </Button>
          {feedback ? <p role="status" className={hasError ? "text-sm text-red-400" : "text-sm text-emerald-400"}>{feedback}</p> : null}
        </div>
      </form>
    </section>
  );
}
