"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu, UserRound } from "lucide-react";
import { GlobalSearch } from "@/components/marketing/global-search";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getCurrentUser, getStoredSession } from "@/lib/user-auth";

const navItems = [
  { label: "Ferramentas", href: "/ferramentas" },
  { label: "Serviços", href: "/servicos" },
  { label: "Blog", href: "/blog" },
  { label: "Sobre", href: "/sobre" },
];

export function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin") || pathname === "/login";

  useEffect(() => {
    let active = true;
    if (isAdmin) { setIsLoggedIn(false); return () => { active = false; }; }
    const session = getStoredSession();
    if (!session?.access_token) { setIsLoggedIn(false); return () => { active = false; }; }
    setIsLoggedIn(true);
    getCurrentUser(session).then((user) => { if (active) setIsLoggedIn(Boolean(user?.id)); }).catch(() => { if (active) setIsLoggedIn(false); });
    return () => { active = false; };
  }, [isAdmin]);

  return <header className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-background/75 backdrop-blur-xl">
    <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
      <Link href="/" className="group flex shrink-0 items-center gap-2" aria-label="Kivai — Página inicial"><Image src="/logo.png" alt="Kivai" width={25} height={25} priority className="transition-transform duration-300 group-hover:scale-105" /><span className="hidden text-lg font-semibold tracking-tight text-foreground sm:inline">Kivai</span></Link>
      {!isAdmin ? <nav className="ml-auto hidden items-center gap-7 lg:flex" aria-label="Navegação principal">{navItems.map((item) => <Link key={item.label} href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{item.label}</Link>)}</nav> : <div className="ml-auto hidden text-xs font-semibold uppercase tracking-[0.18em] text-primary lg:block">Administração Kivai</div>}
      {!isAdmin ? <div className="ml-auto w-[min(48vw,240px)] sm:w-64 lg:ml-3 lg:w-72"><GlobalSearch /></div> : null}
      {!isAdmin ? <Button asChild variant={isLoggedIn ? "default" : "outline"} className="hidden h-9 lg:inline-flex"><Link href={isLoggedIn ? "/conta" : "/conta/login"}>{isLoggedIn ? <LayoutDashboard /> : <UserRound />}{isLoggedIn ? "Meu painel" : "Entrar"}</Link></Button> : null}
      {!isAdmin ? <div className="lg:hidden"><Sheet><SheetTrigger asChild><Button variant="outline" size="icon" className="rounded-xl border-white/10 bg-white/[0.03]" aria-label="Abrir menu"><Menu className="size-5" /></Button></SheetTrigger><SheetContent side="right" className="w-[88%] border-white/10 bg-background/95 p-0 backdrop-blur-2xl sm:max-w-sm"><SheetHeader className="border-b border-white/8 px-6 py-5 text-left"><SheetTitle className="flex items-center gap-3"><Image src="/logo.png" alt="Kivai" width={25} height={25} priority /><span className="text-lg font-semibold">Kivai</span></SheetTitle><SheetDescription>Ferramentas inteligentes para resultados reais.</SheetDescription></SheetHeader><div className="flex flex-col px-4 py-5"><nav className="flex flex-col gap-1" aria-label="Navegação mobile">{navItems.map((item) => <SheetClose asChild key={item.label}><Link href={item.href} className="rounded-xl px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground">{item.label}</Link></SheetClose>)}<SheetClose asChild><Link href={isLoggedIn ? "/conta" : "/conta/login"} className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-white/[0.04]">{isLoggedIn ? <LayoutDashboard className="size-4" /> : <UserRound className="size-4" />}{isLoggedIn ? "Acessar meu painel" : "Entrar na conta"}</Link></SheetClose></nav><div className="mt-5 border-t border-white/8 pt-5"><p className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Suporte e transparência</p><div className="mt-2 flex flex-col gap-1"><SheetClose asChild><Link href="/ajuda" className="rounded-xl px-3 py-2.5 text-sm text-muted-foreground">Central de Ajuda</Link></SheetClose><SheetClose asChild><Link href="/contato" className="rounded-xl px-3 py-2.5 text-sm text-muted-foreground">Entre em contato</Link></SheetClose></div></div></div></SheetContent></Sheet></div> : null}
    </div>
  </header>;
}
