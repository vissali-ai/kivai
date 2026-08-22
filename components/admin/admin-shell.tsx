"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, BookOpen, FolderTree, Images, LayoutDashboard, LogOut, Plus, Wrench } from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/admin/blog", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/blog/nova", label: "Nova matéria", icon: Plus },
  { href: "/admin/blog/midias", label: "Biblioteca", icon: Images },
  { href: "/admin/blog/categorias", label: "Categorias", icon: FolderTree },
  { href: "/admin/blog/agente", label: "Agente", icon: Bot },
  { href: "/admin/blog/manutencao", label: "Manutenção", icon: Wrench },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.endsWith("/preview")) return <>{children}</>;
  return (
    <div className="mx-auto grid w-full max-w-[1500px] flex-1 gap-6 px-4 pb-6 pt-24 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-6">
      <aside className="h-fit border border-white/10 bg-card p-4 lg:sticky lg:top-6">
        <div className="mb-5 flex items-center gap-2"><BookOpen className="text-primary" /><div><p className="font-semibold">Kivai CMS</p><p className="text-xs text-muted-foreground">Painel editorial</p></div></div>
        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
          {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex items-center gap-2 border border-transparent px-3 py-2 text-sm text-muted-foreground transition hover:border-white/10 hover:bg-white/5 hover:text-foreground"><Icon className="size-4" />{label}</Link>)}
        </nav>
        <form action={logoutAction} className="mt-5 border-t border-white/10 pt-4"><Button variant="ghost" className="w-full justify-start"><LogOut />Sair</Button></form>
      </aside>
      <section className="min-w-0">{children}</section>
    </div>
  );
}
