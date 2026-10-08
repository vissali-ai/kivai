"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Star } from "lucide-react";
import { getToolBySlug, toolCategories } from "@/lib/tools";
import { getCurrentUser, getStoredSession, supabaseUserFetch } from "@/lib/user-auth";

type AccountState = "loading" | "guest" | "member";

// Os textos destacam usos reais e diferentes de cada ferramenta, sem repetir o mesmo bloco editorial.
const specificInvitations: Record<string, string> = {
  "removedor-de-fundo": "Remove fundos de fotos com frequência? Guarde o Removedor de Fundo no seu painel e encontre a ferramenta pronta para a próxima imagem.",
  "conversor-de-imagens": "Precisa alternar entre JPG, PNG e WebP? Favoritar o Conversor de Imagens deixa esse atalho sempre à mão na sua conta.",
  "compressor-de-imagens": "Costuma reduzir o peso de fotos para publicar ou enviar? Deixe o Compressor de Imagens entre os seus acessos rápidos.",
  "redimensionar-imagem": "Ajusta tamanhos de fotos para lojas e redes sociais? Salve o Redimensionador de Imagens e volte aqui em poucos cliques.",
  "recortar-imagem": "Recorta imagens em diferentes proporções? Adicione esta ferramenta aos favoritos para agilizar as próximas edições.",
  "conversor-heic": "Recebe fotos de iPhone em HEIC? Mantenha o Conversor HEIC nos favoritos e encontre a conversão quando precisar.",
  "gerador-de-qr-code": "Cria QR Codes para links, produtos ou contatos? Adicione o Gerador de QR Code ao seu painel para reutilizá-lo facilmente.",
  "removedor-de-metadados-e-rotulos-de-ia": "Precisa revisar metadados de imagens com frequência? Salve esta ferramenta e mantenha o acesso organizado.",
  "pdf-para-imagens": "Transforma PDFs em imagens para compartilhar ou editar? Guarde PDF para Imagens em suas ferramentas favoritas.",
  "imagens-para-pdf": "Monta documentos PDF a partir de fotos? Adicione Imagens para PDF aos favoritos e retorne quando tiver novos arquivos.",
  "unir-pdfs": "Junta documentos em um só arquivo? Salve Unir PDFs no seu painel para repetir essa tarefa sem procurar pela ferramenta.",
  "dividir-pdf": "Separa páginas de documentos com frequência? Favorite Dividir PDF e deixe a ferramenta ao alcance da sua conta.",
  "compactar-pdf": "Precisa enviar PDFs menores? Mantenha Compactar PDF entre suas ferramentas preferidas para acessar novamente.",
  "editar-pdf": "Faz ajustes em documentos PDF? Organize o acesso ao Editor de PDF salvando esta ferramenta em seus favoritos.",
  "imprimir-frente-e-verso": "Imprime documentos dos dois lados da folha? Salve o guia de impressão frente e verso para consultar sempre que precisar.",
  "calculadora-de-margem": "Confere a margem dos produtos antes de vender? Salve a Calculadora de Margem para suas próximas decisões de preço.",
  "calculadora-de-markup": "Define preços usando markup? Adicione esta calculadora ao seu painel e agilize os próximos cálculos.",
  "calculadora-de-roas": "Analisa o retorno do investimento em anúncios? Deixe a Calculadora de ROAS salva para conferir novas campanhas.",
  "calculadora-de-roi": "Avalia o retorno de investimentos com frequência? Favorite a Calculadora de ROI e encontre-a diretamente na sua conta.",
  "contador-de-palavras": "Revisa o tamanho de textos e conteúdos? Adicione o Contador de Palavras aos favoritos para consultar sempre que precisar.",
  "consulta-cnpj": "Pesquisa empresas pelo CNPJ? Guarde a Consulta de CNPJ no seu painel e agilize futuras verificações.",
  "verificador-de-dominio-br": "Costuma conferir a disponibilidade de domínios .br? Salve o Verificador de Domínio entre seus atalhos.",
  "analisador-de-seguidores-instagram": "Acompanha seguidores e contas seguidas no Instagram? Favorite o Analisador para encontrá-lo nas próximas análises.",
  "calendario-editorial-redes-sociais": "Planeja publicações nas redes sociais? Deixe o Calendário Editorial salvo entre suas ferramentas mais utilizadas.",
  "gerador-de-relatorio-social-media": "Produz relatórios para redes sociais? Guarde o Gerador de Relatório no painel para acessá-lo quando precisar.",
  "radar-de-tendencias": "Gosta de acompanhar tendências e notícias do mercado? Salve o Radar de Tendências para voltar sempre que quiser.",
};

function invitationText(slug: string, name: string, description?: string, category?: string) {
  if (specificInvitations[slug]) return specificInvitations[slug];
  const context = (description ?? "").replace(/\s+/g, " ").split(/[.!?]/)[0].trim();
  const purpose = context && context.length <= 115 ? context + "." : "";
  const variants = [
    `Gostou de ${name}? Adicione esta ferramenta à sua coleção pessoal para encontrá-la rapidamente na próxima visita.`,
    `Usa ${name} no dia a dia? Favoritar é uma maneira simples de deixar este recurso sempre ao alcance da sua conta.`,
    `Quer voltar a ${name} sem pesquisar outra vez? Guarde esta página em Minhas Ferramentas no Kivai.`,
    `Trabalha com ${name} com frequência? Crie seu atalho pessoal no painel e economize tempo nos próximos acessos.`,
    `Achou ${name} útil? Salve esta ferramenta na sua conta para reencontrá-la quando surgir uma nova tarefa.`,
    `Mantenha ${name} por perto. Com um favorito, você abre esta ferramenta diretamente do seu painel Kivai.`,
    `Pretende usar ${name} novamente? Organize seus acessos preferidos em Minhas Ferramentas, na sua conta.`,
    `Facilite sua rotina com ${name}. Adicione a ferramenta aos favoritos para voltar a ela sem procurar.`,
  ];
  let hash = 0;
  for (const c of slug) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  const variant = variants[hash % variants.length];
  if (purpose && (category === "empresas" || category === "social" || category === "video" || category === "audio")) {
    return `${purpose} ${variant}`;
  }
  return variant;
}

function findDescriptionAnchor(): HTMLElement | null {
  const heading = document.querySelector<HTMLElement>("main h1") ?? document.querySelector<HTMLElement>("section h1");
  if (!heading) return null;
  const parent = heading.parentElement;
  if (!parent) return heading;
  const siblings = Array.from(parent.children);
  const headingIndex = siblings.indexOf(heading);
  const firstDescription = siblings.slice(headingIndex + 1).find((element) => element.tagName.toLowerCase() === "p");
  return firstDescription as HTMLElement | undefined ?? heading;
}

export function ToolFavoriteControl() {
  const pathname = usePathname();
  const match = /^\/ferramentas\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/.exec(pathname);
  const slug = match?.[1] ?? "";
  const isHub = toolCategories.some((category) => category.href === pathname);
  const eligible = Boolean(slug) && !isHub;
  const tool = getToolBySlug(slug);
  const defaultTitle = tool?.name || slug.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
  const [title, setTitle] = useState(defaultTitle);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [state, setState] = useState<AccountState>("loading");
  const [userId, setUserId] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const invitation = useMemo(
    () => invitationText(slug, title, tool?.description, tool?.category),
    [slug, title, tool?.description, tool?.category]
  );

  // O destaque participa do fluxo da página, após a descrição, sem posição fixa.
  // O portal evita alterações nos processadores das dezenas de ferramentas existentes.
  useEffect(() => {
    if (!eligible) { setPortalTarget(null); return; }
    let anchor: HTMLElement | null = null;
    let container: HTMLDivElement | null = null;
    const observer = new MutationObserver(() => {
      if (container?.isConnected) return;
      const next = findDescriptionAnchor();
      if (!next) return;
      anchor = next;
      container = document.createElement("div");
      container.setAttribute("data-kivai-favorite-invitation", slug);
      next.insertAdjacentElement("afterend", container);
      const heading = document.querySelector<HTMLElement>("main h1") ?? document.querySelector<HTMLElement>("section h1");
      setTitle(heading?.textContent?.trim() || defaultTitle);
      setPortalTarget(container);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const immediate = findDescriptionAnchor();
    if (immediate) {
      anchor = immediate;
      container = document.createElement("div");
      container.setAttribute("data-kivai-favorite-invitation", slug);
      immediate.insertAdjacentElement("afterend", container);
      const heading = document.querySelector<HTMLElement>("main h1") ?? document.querySelector<HTMLElement>("section h1");
      setTitle(heading?.textContent?.trim() || defaultTitle);
      setPortalTarget(container);
    }
    return () => {
      observer.disconnect();
      setPortalTarget(null);
      container?.remove();
      anchor = null;
    };
  }, [slug, eligible, defaultTitle]);

  useEffect(() => {
    if (!eligible) return;
    let alive = true;
    async function load() {
      setState("loading"); setSaved(false); setUserId(""); setError("");
      const session = getStoredSession();
      if (!session?.access_token) { if (alive) setState("guest"); return; }
      try {
        const user = await getCurrentUser(session);
        if (!user?.id) { if (alive) setState("guest"); return; }
        const response = await supabaseUserFetch(
          `/rest/v1/user_tool_favorites?select=tool_slug&user_id=eq.${encodeURIComponent(user.id)}&tool_slug=eq.${encodeURIComponent(slug)}&limit=1`
        );
        if (!response.ok) throw new Error("Não foi possível carregar seus favoritos.");
        const rows = await response.json() as Array<{ tool_slug: string }>;
        let isSaved = rows.length > 0;
        if (new URLSearchParams(window.location.search).get("favorite") === "1") {
          if (!isSaved) {
            const add = await supabaseUserFetch("/rest/v1/user_tool_favorites?on_conflict=user_id,tool_slug", {
              method: "POST",
              headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
              body: JSON.stringify({ user_id: user.id, tool_slug: slug, tool_title: title }),
            });
            if (!add.ok) throw new Error("Não foi possível salvar a ferramenta.");
            isSaved = true;
          }
          const url = new URL(window.location.href);
          url.searchParams.delete("favorite");
          window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
        }
        if (!alive) return;
        setUserId(user.id); setSaved(isSaved); setState("member");
      } catch (cause) {
        if (alive) { setState("member"); setError(cause instanceof Error ? cause.message : "Falha ao consultar favoritos."); }
      }
    }
    void load();
    return () => { alive = false; };
  }, [slug, eligible, title]);

  if (!eligible || !portalTarget) return null;

  async function toggle() {
    if (saving || !userId) return;
    setSaving(true); setError("");
    try {
      const response = saved
        ? await supabaseUserFetch(`/rest/v1/user_tool_favorites?user_id=eq.${encodeURIComponent(userId)}&tool_slug=eq.${encodeURIComponent(slug)}`, { method: "DELETE" })
        : await supabaseUserFetch("/rest/v1/user_tool_favorites?on_conflict=user_id,tool_slug", {
          method: "POST",
          headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
          body: JSON.stringify({ user_id: userId, tool_slug: slug, tool_title: title }),
        });
      if (!response.ok) throw new Error("Não foi possível atualizar os favoritos.");
      setSaved(!saved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao salvar.");
    } finally { setSaving(false); }
  }

  const returnPath = pathname + "?favorite=1";
  const query = encodeURIComponent(returnPath);
  return createPortal(
    <aside aria-label="Salvar ferramenta no painel" className="mt-4 rounded-xl border border-primary/25 bg-primary/[0.045] p-3 text-left sm:p-4">
      <div className="flex items-start gap-2.5">
        <Star className={`mt-0.5 size-4 shrink-0 text-primary ${saved ? "fill-primary" : ""}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-6 text-foreground">{invitation}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {state === "guest" ? <>
              <Link className="inline-flex min-h-9 items-center justify-center rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 sm:text-sm" href={`/conta/login?next=${query}`}>Entrar e favoritar</Link>
              <Link className="inline-flex min-h-9 items-center justify-center rounded-lg border border-primary/25 px-3 py-2 text-xs font-medium text-foreground hover:bg-primary/10 sm:text-sm" href={`/conta/cadastro?next=${query}`}>Criar conta grátis</Link>
            </> : state === "member" ? (
              <button type="button" disabled={saving || !userId} onClick={toggle} aria-pressed={saved} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 sm:text-sm">
                <Star aria-hidden="true" className={`size-4 ${saved ? "fill-current" : ""}`} />
                {saving ? "Salvando..." : saved ? "Remover dos favoritos" : "Salvar nos favoritos"}
              </button>
            ) : <span className="text-xs text-muted-foreground">Verificando sua conta...</span>}
          </div>
          {state === "guest" ? <p className="mt-2 text-xs leading-5 text-muted-foreground">Ao entrar ou criar sua conta, esta ferramenta ficará salva em Minhas Ferramentas.</p> : null}
          {error ? <p role="alert" className="mt-2 text-xs text-red-400">{error}</p> : null}
        </div>
      </div>
    </aside>,
    portalTarget
  );
}
