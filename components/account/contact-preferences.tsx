"use client";

import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabaseUserFetch } from "@/lib/user-auth";

export function ContactPreferences() {
  const [phone, setPhone] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabaseUserFetch("/rest/v1/user_profiles?select=phone,whatsapp_opt_in,email_marketing_opt_in&limit=1").then(async (response) => {
      if (response.ok) {
        const rows = await response.json() as Array<{ phone?: string | null; whatsapp_opt_in?: boolean; email_marketing_opt_in?: boolean }>;
        const row = rows[0];
        setPhone(row?.phone ?? "");
        setWhatsappOptIn(Boolean(row?.whatsapp_opt_in));
        setEmailOptIn(row?.email_marketing_opt_in !== false);
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  async function save() {
    setSaved(false);
    const response = await supabaseUserFetch("/rest/v1/user_profiles", {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ phone: phone.trim() || null, whatsapp_opt_in: whatsappOptIn, email_marketing_opt_in: emailOptIn, updated_at: new Date().toISOString() }),
    });
    if (response.ok) setSaved(true);
  }

  if (!loaded) return null;
  return <section className="rounded-2xl border border-white/10 bg-card p-5 sm:p-6">
    <div className="flex items-start gap-3"><div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-primary"><BellRing className="size-5" /></div><div><h2 className="font-semibold">Preferências de contato</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Escolha como o Kivai pode avisar sobre vencimento, renovação e benefícios da sua conta.</p></div></div>
    <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
      <label className="text-sm"><span className="mb-2 block font-medium">WhatsApp</span><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(71) 99999-0000" /></label>
      <Button onClick={save}>Salvar preferências</Button>
    </div>
    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
      <label className="flex items-start gap-3 border border-white/10 p-3"><input type="checkbox" checked={emailOptIn} onChange={(e) => setEmailOptIn(e.target.checked)} className="mt-1" /><span><strong className="block font-medium">Avisos por e-mail</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">Vencimento, renovação e comunicações relacionadas à sua conta.</span></span></label>
      <label className="flex items-start gap-3 border border-white/10 p-3"><input type="checkbox" checked={whatsappOptIn} onChange={(e) => setWhatsappOptIn(e.target.checked)} className="mt-1" /><span><strong className="flex items-center gap-1 font-medium"><MessageCircle className="size-3.5" /> Avisos por WhatsApp</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">Autoriza o Kivai a usar o número acima para mensagens de relacionamento.</span></span></label>
    </div>
    {saved ? <p className="mt-3 flex items-center gap-2 text-xs text-primary"><CheckCircle2 className="size-4" /> Preferências salvas.</p> : null}
  </section>;
}
