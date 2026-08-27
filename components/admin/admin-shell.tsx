"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bot, BookOpen, FolderTree, Images, LayoutDashboard, LogOut, Plus, PanelsTopLeft, Wrench } from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

const navigation = [
  {
    label: "Blog",
    links: [
      { href: "/admin/blog", label: "Painel do Blog", icon: LayoutDashboard },
      { href: "/admin/blog/nova", label: "Nova matéria", icon: Plus },
      { href: "/admin/blog/midias", label: "Biblioteca", icon: Images },
      { href: "/admin/blog/categorias", label: "Categorias", icon: FolderTree },
      { href: "/admin/blog/agente", label: "Agente", icon: Bot },
    ],
  },
  {
    label: "Site",
    links: [{ href: "/admin/site", label: "Conteúdo do site", icon: PanelsTopLeft }],
  },
  {
    label: "Sistema",
    links: [{ href: "/admin/blog/manutencao", label: "Manutenção", icon: Wrench }],
  },
];

const originPanels = new Set([
  "/admin/blog",
  "/admin/blog/midias",
  "/admin/blog/categorias",
  "/admin/blog/agente",
  "/admin/site",
  "/admin/blog/manutencao",
]);

function isAdminSaveRequest(input: RequestInfo | URL, init?: RequestInit) {
  const method = String(init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  if (!["POST", "PUT", "PATCH"].includes(method)) return false;
  const rawUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  try {
    const url = new URL(rawUrl, window.location.origin);
    if (url.origin !== window.location.origin || !url.pathname.startsWith("/api/admin/")) return false;
    if (url.pathname.startsWith("/api/admin/media")) return false;
    return [
      "/api/admin/posts",
      "/api/admin/site-content",
      "/api/admin/site-services",
      "/api/admin/site-hubs",
      "/api/admin/categories",
      "/api/admin/instagram-follow-analyzer-config",
    ].some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`));
  } catch {
    return false;
  }
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!originPanels.has(pathname)) return;
    sessionStorage.setItem("kivai-admin-origin", `${window.location.pathname}${window.location.search}`);
  }, [pathname]);

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const shouldReturn = isAdminSaveRequest(input, init);
      const response = await originalFetch(input, init);
      if (shouldReturn && response.ok) {
        const origin = sessionStorage.getItem("kivai-admin-origin");
        const current = `${window.location.pathname}${window.location.search}`;
        if (origin && origin.startsWith("/admin/") && origin !== current) {
          window.setTimeout(() => {
            router.replace(origin);
            router.refresh();
          }, 150);
        }
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, [router]);

  if (pathname.endsWith("/preview")) return <>{children}</>;
  return (
    <div className="mx-auto grid w-full max-w-[1500px] flex-1 gap-6 px-4 pb-6 pt-24 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-6">
      <aside className="h-fit border border-white/10 bg-card p-4 lg:sticky lg:top-6">
        <div className="mb-5 flex items-center gap-2"><BookOpen className="text-primary" /><div><p className="font-semibold">Kivai CMS</p><p className="text-xs text-muted-foreground">Administração editorial</p></div></div>
        <nav aria-label="Administração do Kivai" className="space-y-4">
          {navigation.map((group) => <section key={group.label} aria-labelledby={`admin-nav-${group.label.toLowerCase()}`}><p id={`admin-nav-${group.label.toLowerCase()}`} className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{group.label}</p><div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-1">{group.links.map(({ href, label, icon: Icon }) => { const active = pathname === href || (href !== "/admin/blog" && pathname.startsWith(`${href}/`)); return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-w-0 items-center gap-2 border px-3 py-2 text-sm transition ${active ? "border-primary/30 bg-primary/10 text-primary" : "border-transparent text-muted-foreground hover:border-white/10 hover:bg-white/5 hover:text-foreground"}`}><Icon className="size-4 shrink-0" /><span className="truncate">{label}</span></Link>; })}</div></section>)}
        </nav>
        <form action={logoutAction} className="mt-5 border-t border-white/10 pt-4"><Button variant="ghost" className="w-full justify-start"><LogOut />Sair</Button></form>
      </aside>
      <section className="min-w-0">{children}</section>
    </div>
  );
}
