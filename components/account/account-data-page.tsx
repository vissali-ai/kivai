"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Save, Settings, Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUser, getStoredSession, signOut, supabaseUserFetch, updateAccountEmail } from "@/lib/user-auth";

type Plan = "free" | "pro" | "agency";
type Profile = {
  full_name: string | null; plan_code: Plan; phone: string | null; secondary_contact: string | null;
  address_street: string | null; address_number: string | null; address_complement: string | null;
  address_neighborhood: string | null; address_city: string | null; address_state: string | null; address_postal_code: string | null;
  contracted_services: string[] | null;
};

const benefits: Record<Plan, string[]> = {
  free: ["1 conta do Instagram por análise", "Até 50 mil seguidores", "Quem não segue de volta, quem você não segue e seguidores mútuos", "Processamento local no navegador"],
  pro: ["Até 5 contas do Instagram", "Até 500 mil seguidores por perfil", "Histórico privado e comparação entre exportações", "Novos seguidores e unfollows entre períodos", "Indicadores avançados do perfil"],
  agency: ["Até 20 contas e clientes", "Operação de maior volume", "Históricos e comparações separados por conta", "Recursos avançados de análise", "Organização voltada para agências e social medias"],
};

export function AccountDataPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => { (async () => {
    const session = getStoredSession(); if (!session?.access_token) { window.location.replace("/conta/login?next=/conta/dados"); return; }
    const user = await getCurrentUser(session); if (!user?.id) { await signOut(); window.location.replace("/conta/login?next=/conta/dados"); return; }
    setUserId(user.id); setEmail(user.email ?? ""); setOriginalEmail(user.email ?? "");
    const response = await supabaseUserFetch(`/rest/v1/user_profiles?select=full_name,plan_code,phone,secondary_contact,address_street,address_number,address_complement,address_neighborhood,address_city,address_state,address_postal_code,contracted_services&user_id=eq.${encodeURIComponent(user.id)}&limit=1`);
    if (response.ok) { const rows = await response.json() as Profile[]; setProfile(rows[0] ?? null); }
    setLoading(false);
  })(); }, []);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) { setProfile((current) => current ? { ...current, [key]: value } : current); }

  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!profile || !userId) return; setSaving(true); setMessage("");
    try {
      const response = await supabaseUserFetch(`/rest/v1/user_profiles?user_id=eq.${encodeURIComponent(userId)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({
        full_name: profile.full_name?.trim() || null, phone: profile.phone?.trim() || null, secondary_contact: profile.secondary_contact?.trim() || null,
        address_street: profile.address_street?.trim() || null, address_number: profile.address_number?.trim() || null, address_complement: profile.address_complement?.trim() || null,
        address_neighborhood: profile.address_neighborhood?.trim() || null, address_city: profile.address_city?.trim() || null, address_state: profile.address_state?.trim() || null,
        address_postal_code: profile.address_postal_code?.trim() || null, updated_at: new Date().toISOString(),
      }) });
      if (!response.ok) throw new Error("Não foi possível salvar seus dados.");
      if (email.trim() && email.trim().toLowerCase() !== originalEmail.toLowerCase()) {
        const session = getStoredSession(); if (!session?.access_token) throw new Error("Sua sessão expirou.");
        await updateAccountEmail(session.access_token, email.trim());
        setOriginalEmail(email.trim());
        setMessage("Dados salvos. A alteração de e-mail pode exigir confirmação no novo endereço.");
      } else setMessage("Dados atualizados com sucesso.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível salvar."); } finally { setSaving(false); }
  }

  if (loading || !profile) return <div className="py-20 text-center text-sm text-muted-foreground">Carregando seus dados...</div>;
  const planLabel = profile.plan_code === "agency" ? "Agency" : profile.plan_code === "pro" ? "Pro" : "Grátis";

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><Button asChild variant="ghost"><Link href="/conta"><ArrowLeft /> Voltar ao painel</Link></Button><div className="flex items-center gap-2 text-sm font-semibold"><Settings className="size-4 text-primary" /> Configurações da conta</div></div>
    <section className="rounded-3xl border border-primary/20 bg-primary/[0.035] p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Plano {planLabel}</p><h1 className="mt-2 text-3xl font-semibold">Meus Dados e benefícios</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Gerencie seus dados de cadastro e consulte tudo o que sua conta Kivai oferece.</p><ul className="mt-6 grid gap-3 md:grid-cols-2">{benefits[profile.plan_code].map((item) => <li key={item} className="flex gap-2 border border-white/10 bg-card/60 p-3 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{item}</li>)}</ul><div className="mt-5 flex flex-wrap gap-2"><Button asChild><Link href="/ferramentas/instagram-follow-analyzer"><Sparkles /> Acessar Instagram Follow Analyzer</Link></Button><Button asChild variant="outline"><Link href="/servicos"><Wrench /> Conhecer nossos serviços</Link></Button></div>{profile.contracted_services?.length ? <div className="mt-6"><p className="text-sm font-semibold">Serviços contratados</p><p className="mt-2 text-sm text-muted-foreground">{profile.contracted_services.join(" • ")}</p></div> : null}</section>
    <form onSubmit={save} className="rounded-3xl border border-white/10 bg-card p-6 sm:p-8"><h2 className="text-xl font-semibold">Editar perfil</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm">Nome<Input className="mt-1.5" value={profile.full_name ?? ""} onChange={(e) => set("full_name", e.target.value)} /></label><label className="text-sm">E-mail<Input className="mt-1.5" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label><label className="text-sm">WhatsApp<Input className="mt-1.5" value={profile.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="(31) 99999-0000" /></label><label className="text-sm">Outro contato<Input className="mt-1.5" value={profile.secondary_contact ?? ""} onChange={(e) => set("secondary_contact", e.target.value)} /></label><label className="text-sm sm:col-span-2">Endereço<Input className="mt-1.5" value={profile.address_street ?? ""} onChange={(e) => set("address_street", e.target.value)} /></label><label className="text-sm">Número<Input className="mt-1.5" value={profile.address_number ?? ""} onChange={(e) => set("address_number", e.target.value)} /></label><label className="text-sm">Complemento<Input className="mt-1.5" value={profile.address_complement ?? ""} onChange={(e) => set("address_complement", e.target.value)} /></label><label className="text-sm">Bairro<Input className="mt-1.5" value={profile.address_neighborhood ?? ""} onChange={(e) => set("address_neighborhood", e.target.value)} /></label><label className="text-sm">Cidade<Input className="mt-1.5" value={profile.address_city ?? ""} onChange={(e) => set("address_city", e.target.value)} /></label><label className="text-sm">Estado<Input className="mt-1.5" value={profile.address_state ?? ""} onChange={(e) => set("address_state", e.target.value)} maxLength={2} /></label><label className="text-sm">CEP<Input className="mt-1.5" value={profile.address_postal_code ?? ""} onChange={(e) => set("address_postal_code", e.target.value)} /></label></div>{message ? <p className="mt-4 text-sm text-muted-foreground" role="status">{message}</p> : null}<Button className="mt-5" disabled={saving}><Save /> {saving ? "Salvando..." : "Salvar meus dados"}</Button></form>
  </div>;
}
