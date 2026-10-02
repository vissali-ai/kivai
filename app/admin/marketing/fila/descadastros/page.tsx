import { UserMinus } from "lucide-react";
import { listAdminCustomers } from "@/lib/admin/customer-users";
import { supabaseRest } from "@/lib/blog/supabase";

export const dynamic = "force-dynamic";

type EmailPreference = {
  user_id: string;
  unsubscribed_at: string | null;
};

export default async function UnsubscribesPage() {
  const [users, preferences] = await Promise.all([
    listAdminCustomers(),
    supabaseRest<EmailPreference[]>(
      "customer_email_preferences?select=user_id,unsubscribed_at&marketing_opt_out=eq.true&order=unsubscribed_at.desc.nullslast&limit=200"
    ),
  ]);
  const userMap = new Map(users.map((user) => [user.id, user]));

  return (
    <div className="border border-white/10 bg-card">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Preferências</p>
          <h2 className="mt-1 text-xl font-semibold">Descadastros de marketing</h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Usuários desta lista não recebem campanhas e newsletters. Comunicações essenciais da conta continuam permitidas.
          </p>
        </div>
        <UserMinus className="size-6 text-primary" />
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-white/[0.03] text-xs text-muted-foreground">
            <tr><th className="px-4 py-3">Nome</th><th className="px-4 py-3">E-mail</th><th className="px-4 py-3">Descadastro</th></tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {preferences.map((item) => {
              const user = userMap.get(item.user_id);
              return (
                <tr key={item.user_id}>
                  <td className="px-4 py-3">{user?.fullName || "Sem nome"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user?.email || item.user_id}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.unsubscribed_at ? new Date(item.unsubscribed_at).toLocaleString("pt-BR") : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!preferences.length ? <p className="p-8 text-center text-sm text-muted-foreground">Nenhum descadastro registrado.</p> : null}
      </div>
    </div>
  );
}
