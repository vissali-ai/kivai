"use client";

import Link from "next/link";
import { Inbox, Send, Trash2 } from "lucide-react";
import { usePathname } from "next/navigation";

type Counts = {
  inbox: number;
  unread: number;
  sent: number;
  discarded: number;
};

const items = [
  { href: "/admin/marketing/fila/entrada", label: "Caixa de entrada", icon: Inbox, key: "inbox" as const },
  { href: "/admin/marketing/fila/enviados", label: "Enviados", icon: Send, key: "sent" as const },
  { href: "/admin/marketing/fila/descartados", label: "Descartados", icon: Trash2, key: "discarded" as const },
];

export function MailNavigation({ counts }: { counts: Counts }) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-2 sm:grid-cols-3 lg:block lg:space-y-1">
      {items.map(({ href, label, icon: Icon, key }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        const count = counts[key];
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center justify-between gap-3 border px-3 py-3 text-sm transition-colors ${active ? "border-primary/30 bg-primary/10 text-primary" : "border-white/10 bg-background/20 text-muted-foreground hover:border-primary/20 hover:text-foreground"}`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Icon className="size-4 shrink-0" />
              <span className="truncate font-medium">{label}</span>
            </span>
            <span className="shrink-0 text-xs font-semibold">
              {key === "inbox" && counts.unread > 0 ? `${counts.unread}/${count}` : count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
