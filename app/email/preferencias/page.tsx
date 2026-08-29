import type { Metadata } from "next";
import { supabaseRest } from "@/lib/blog/supabase";

export const metadata: Metadata = {
  title: "Preferências de e-mail | Kivai",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PreferenceRow = {
  user_id: string;
  marketing_opt_out: boolean;
  unsubscribe_token: string;
};

async function unsubscribeMarketing(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "").trim();
  if (!token) return;
  const rows = await supabaseRest<PreferenceRow[]>(`customer_email_preferences?select=user_id,marketing_opt_out,unsubscribe_token&unsubscribe_token=eq.${encodeURIComponent(token)}&limit=1`);
  const row = rows[0];
  if (!row) return;
  const now = new Date().toISOString();
  await supabaseRest(`customer_email_preferences?user_id=eq.${encodeURIComponent(row.user_id)}`, {
    method: "PATCH",
    body: JSON.stringify({ marketing_opt_out: true, unsubscribed_at: now, updated_at: now }),
  });
  await supabaseRest("customer_marketing_events", {
    method: "POST",
    body: JSON.stringify({ user_id: row.user_id, event_type: "marketing_email_unsubscribed", description: "Usuário optou por não receber mais e-mails de marketing.", metadata: { source: "email_unsubscribe" } }),
  });
}

export default async function EmailPreferencesPage({ searchParams }: { searchParams: Promise<{ token?: string; done?: string }> }) {
  const params = await searchParams;
  const token = String(params.token ?? "").trim();
  const rows = token
    ? await supabaseRest<PreferenceRow[]>(`customer_email_preferences?select=user_id,marketing_opt_out,unsubscribe_token&unsubscribe_token=eq.${encodeURIComponent(token)}&limit=1`)
    : [];
  const preference = rows[0] ?? null;

  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-2xl px-4 py-20 sm:px-6">
      <section className="rounded-3xl border border-white/10 bg-card p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Preferências de e-mail</p>
        <h1 className="mt-3 text-3xl font-semibold">Comunicações do Kivai</h1>
        {!preference ? (
          <p className="mt-4 text-sm leading-6 text-muted-foreground">Este link de preferência não é válido ou não está mais disponível.</p>
        ) : preference.marketing_opt_out ? (
          <div className="mt-5 space-y-3">
            <p className="font-medium">Você não receberá mais e-mails de marketing do Kivai.</p>
            <p className="text-sm leading-6 text-muted-foreground">Mensagens essenciais de conta, segurança, pagamento ou assinatura ainda podem ser enviadas quando necessárias.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <p className="text-sm leading-6 text-muted-foreground">Deseja continuar recebendo nossos contatos de marketing? Se preferir, você pode interromper esses e-mails a qualquer momento.</p>
            <form action={unsubscribeMarketing}>
              <input type="hidden" name="token" value={token} />
              <button className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">Não quero receber mais e-mails de marketing</button>
            </form>
            <p className="text-xs leading-5 text-muted-foreground">Esta opção não bloqueia comunicações transacionais importantes relacionadas à sua conta.</p>
          </div>
        )}
      </section>
    </main>
  );
}
