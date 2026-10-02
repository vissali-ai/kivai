import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabaseRest } from "@/lib/blog/supabase";
import { MailNavigation } from "@/app/admin/marketing/fila/mail-navigation";

export const dynamic = "force-dynamic";

type CountRow = { id: string; is_read?: boolean };

export default async function CommunicationQueueLayout({ children }: { children: React.ReactNode }) {
  const [inbox, sent, discardedInbox, discardedSent] = await Promise.all([
    supabaseRest<CountRow[]>("customer_inbox_messages?select=id,is_read&discarded_at=is.null&order=received_at.desc&limit=500"),
    supabaseRest<CountRow[]>("customer_communications?select=id&channel=eq.email&discarded_at=is.null&order=created_at.desc&limit=500"),
    supabaseRest<CountRow[]>("customer_inbox_messages?select=id&discarded_at=not.is.null&order=discarded_at.desc&limit=500"),
    supabaseRest<CountRow[]>("customer_communications?select=id&channel=eq.email&discarded_at=not.is.null&order=discarded_at.desc&limit=500"),
  ]);

  const counts = {
    inbox: inbox.length,
    unread: inbox.filter((item) => !item.is_read).length,
    sent: sent.length,
    discarded: discardedInbox.length + discardedSent.length,
  };

  return (
    <div className="space-y-6">
      <section className="border border-white/10 bg-card p-5 sm:p-6">
        <Link href="/admin/marketing" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> Voltar ao Marketing
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Fila de comunicações</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Caixa postal do Kivai para acompanhar mensagens recebidas, envios realizados e itens descartados.
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <MailNavigation counts={counts} />
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
