"use client";

import { useEffect, useState } from "react";
import { BellRing, BellOff, Check, Clock } from "lucide-react";
import { getStoredSession } from "@/lib/user-auth";
import { defaultReminder, reminderToolChoices, reminderWeekdays, type ReminderPreference } from "@/lib/account/routine-reminder-options";

type ReminderResponse = { preference: ReminderPreference; vapidPublicKey: string; emailAvailable: boolean; emailAddress: string; whatsappAvailable: boolean };

function publicKeyBytes(encoded: string) {
  const raw = atob(encoded.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - encoded.length % 4) % 4));
  return Uint8Array.from(raw, char => char.charCodeAt(0));
}

async function api(method: "GET" | "POST", body?: object): Promise<ReminderResponse> {
  const token = getStoredSession()?.access_token;
  if (!token) throw new Error("Entre na sua conta para configurar os lembretes.");
  const response = await fetch("/api/account/routine-reminders", {
    method, cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json() as ReminderResponse & { error?: string };
  if (!response.ok) throw new Error(data.error || "Não foi possível salvar sua preferência.");
  return data;
}

export function RoutineReminderSettings() {
  const [preference, setPreference] = useState<ReminderPreference>(defaultReminder);
  const [publicKey, setPublicKey] = useState("");
  const [channel, setChannel] = useState<"browser" | "email" | "whatsapp">("browser");
  const [emailAvailable, setEmailAvailable] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailConsent, setEmailConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [installed, setInstalled] = useState(false);
  const supported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

  useEffect(() => {
    let active = true;
    const start = async () => {
      try {
        const result = await api("GET");
        if (!active) return;
        const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setPreference(result.preference.enabled ? result.preference : {
          ...result.preference, time_zone: zone || result.preference.time_zone,
        });
        setPublicKey(result.vapidPublicKey);
        setChannel(result.preference.delivery_channel || "browser");
        setEmailAvailable(result.emailAvailable);
        setEmailAddress(result.emailAddress);
        setInstalled(window.matchMedia("(display-mode: standalone)").matches ||
          Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar seus lembretes."); }
      finally { if (active) setLoading(false); }
    };
    void start();
    return () => { active = false; };
  }, []);

  async function enable() {
    if (busy) return;
    setBusy(true); setError(""); setFeedback("");
    try {
      if (channel === "whatsapp") throw new Error("O WhatsApp ainda não está disponível. Precisamos concluir a conexão oficial de mensagens do Kivai.");
      if (channel === "email") {
        if (!emailAvailable) throw new Error("O envio por e-mail ainda não está disponível nesta conta.");
        if (!emailConsent) throw new Error("Confirme que deseja receber os lembretes por e-mail.");
        await api("POST", { action: "save", ...preference, delivery_channel: "email", email_reminder_consent: true });
        setPreference(current => ({ ...current, delivery_channel: "email", enabled: true }));
        setFeedback("Lembrete semanal por e-mail ativado! O aviso será enviado ao endereço da sua conta, próximo ao horário escolhido.");
        return;
      }
      if (!supported || !publicKey) throw new Error("Este navegador ainda não permite notificações do Kivai.");
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent) && !installed) throw new Error("No iPhone, primeiro adicione o Kivai à Tela de Início e abra pelo ícone.");
      // Autorização solicitada somente neste clique, nunca automaticamente ao abrir o painel.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Permissão negada. Você pode habilitá-la nas configurações do navegador.");
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, applicationServerKey: publicKeyBytes(publicKey),
      });
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.auth || !json.keys.p256dh) throw new Error("Não foi possível registrar este dispositivo.");
      await api("POST", { action: "save", ...preference, delivery_channel: "browser", subscription: json });
      setPreference(current => ({ ...current, delivery_channel: "browser", enabled: true }));
      setFeedback("Lembrete ativado! Você receberá uma notificação no dia e horário escolhidos, conforme as permissões do dispositivo.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível ativar seus lembretes."); }
    finally { setBusy(false); }
  }

  async function disable() {
    if (busy) return;
    setBusy(true); setError(""); setFeedback("");
    try {
      await api("POST", { action: "disable" });
      setPreference(current => ({ ...current, enabled: false }));
      try {
        const registration = await navigator.serviceWorker.getRegistration("/");
        const subscription = await registration?.pushManager.getSubscription();
        await subscription?.unsubscribe();
      } catch { /* A preferência da conta já foi desligada no servidor. */ }
      setFeedback("Lembretes desativados nesta conta.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível desativar seus lembretes."); }
    finally { setBusy(false); }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-card p-5 sm:p-6" aria-labelledby="routine-reminders-title">
      <div className="flex items-start gap-3">
        <BellRing className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h2 id="routine-reminders-title" className="text-xl font-semibold">Lembretes da rotina</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">Organize sua rotina: escolha uma ferramenta, defina o dia e o horário e selecione como prefere receber seu lembrete semanal.</p>
        </div>
      </div>
      {loading ? <p className="mt-4 text-sm text-muted-foreground">Carregando preferências...</p> : (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block space-y-1.5 text-sm">
              <span>Minha atividade</span>
              <select value={preference.tool_slug} onChange={event => setPreference(current => ({ ...current, tool_slug: event.target.value }))} disabled={busy}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground">
                {reminderToolChoices.map(item => <option key={item.slug} value={item.slug}>{item.label}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm">
              <span>Dia da semana</span>
              <select value={preference.weekday} onChange={event => setPreference(current => ({ ...current, weekday: Number(event.target.value) }))} disabled={busy}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground">
                {reminderWeekdays.map((day, index) => <option key={day} value={index}>{day}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5 text-sm">
              <span>Horário aproximado</span>
              <select value={preference.hour} onChange={event => setPreference(current => ({ ...current, hour: Number(event.target.value) }))} disabled={busy}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground">
                {Array.from({ length: 14 }, (_, n) => n + 8).map(hour => <option key={hour} value={hour}>{String(hour).padStart(2, "0")}:00</option>)}
              </select>
            </label>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Onde deseja receber o lembrete?</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { value: "browser" as const, label: "Navegador", detail: "Notificação no dispositivo" },
                { value: "email" as const, label: "E-mail", detail: emailAddress || "E-mail da sua conta" },
                { value: "whatsapp" as const, label: "WhatsApp", detail: "Aguardando integração oficial" },
              ].map(option => (
                <label key={option.value} className={`flex min-w-0 cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition-colors ${channel === option.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                  <input type="radio" name="reminder-channel" className="mt-0.5 shrink-0 accent-primary" checked={channel === option.value} onChange={() => { setChannel(option.value); setError(""); setFeedback(""); }} />
                  <span className="min-w-0"><span className="block font-semibold">{option.label}</span><span className="mt-1 block break-words text-xs leading-4 text-muted-foreground">{option.detail}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
          {channel === "email" ? (
            <div className="space-y-2 rounded-lg border border-border bg-muted/10 p-3">
              <p className="text-xs leading-5 text-muted-foreground">{emailAvailable ? "Seu lembrete será enviado para o e-mail cadastrado nesta conta. Você poderá desativá-lo a qualquer momento." : "O canal de e-mail está indisponível no momento. Verifique se a conta tem um endereço de e-mail válido."}</p>
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 shrink-0" checked={emailConsent} onChange={e => setEmailConsent(e.target.checked)} />Autorizo o Kivai a me enviar um lembrete semanal por e-mail, referente à atividade escolhida.</label>
            </div>
          ) : null}
          {channel === "whatsapp" ? <p className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">O WhatsApp estará disponível após a configuração da API oficial da Meta e a aprovação do modelo de mensagem. Esse canal pode ter custos de envio. Por enquanto, escolha E-mail ou Navegador.</p> : null}
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="size-3.5" /> Fuso horário: {preference.time_zone}. Um lembrete por semana, próximo ao horário escolhido.</p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={busy || channel === "whatsapp" || (channel === "browser" && (!supported || !publicKey)) || (channel === "email" && (!emailAvailable || !emailConsent))} onClick={() => void enable()}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
              {preference.enabled ? <Check className="size-4" /> : <BellRing className="size-4" />}
              {busy ? "Salvando..." : preference.enabled ? "Atualizar lembrete" : "Ativar lembrete"}
            </button>
            {preference.enabled ? <button type="button" disabled={busy} onClick={() => void disable()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:border-primary/30 disabled:opacity-50"><BellOff className="size-4" /> Desativar</button> : null}
          </div>
          {channel === "browser" && !supported ? <p className="text-xs text-muted-foreground">Este navegador não oferece suporte a notificações push. Você pode escolher E-mail como alternativa.</p> : null}
          {channel === "browser" && supported && /iPhone|iPad|iPod/i.test(typeof navigator === "undefined" ? "" : navigator.userAgent) && !installed ? <p className="text-xs text-muted-foreground">No iPhone, abra o Kivai pelo ícone adicionado à Tela de Início antes de ativar os lembretes.</p> : null}
          {error ? <p role="alert" className="text-sm text-red-400">{error}</p> : null}
          {feedback ? <p role="status" className="text-sm text-emerald-400">{feedback}</p> : null}
          <p className="text-xs leading-5 text-muted-foreground">Você pode alterar ou desativar seu lembrete quando quiser. A entrega depende da disponibilidade do canal escolhido.</p>
        </div>
      )}
    </section>
  );
}
