"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, FolderOpen, Heart, House, LifeBuoy, Wrench } from "lucide-react";

const entries = [
  { href: "/conta", label: "Início", icon: House },
  { href: "/conta/projetos", label: "Meus Projetos", icon: FolderOpen },
  { href: "/conta/rotinas", label: "Minhas Rotinas", icon: CalendarClock },
  { href: "/conta/favoritos", label: "Favoritos", icon: Heart },
  { href: "/ferramentas", label: "Ferramentas", icon: Wrench },
  { href: "/conta/atendimento", label: "Atendimento", icon: LifeBuoy },
] as const;

export function AccountWorkspaceNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navegação do espaço de trabalho" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-2xl border border-border bg-card p-2 lg:p-3">
        <p className="hidden px-3 pb-3 pt-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground lg:block">
          Espaço de trabalho
        </p>
        <div className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {entries.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:w-full ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
