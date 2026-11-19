"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Library, LogIn, Newspaper, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getStoredSession } from "@/lib/user-auth";
import { StreamingHomeActions } from "@/components/music/streaming-home-actions";
import { MusicGlobalSearch } from "@/components/music/music-global-search";

export function MusicSiteHeader() {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    let active = true;
    getCurrentUser(getStoredSession()).then((user) => { if (active) setLoggedIn(Boolean(user?.id)); }).catch(() => { if (active) setLoggedIn(false); });
    return () => { active = false; };
  }, []);
  return <header className="kivai-fixed-header fixed inset-x-0 top-0 z-50 border-b border-border bg-background shadow-sm">
    <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-0 px-4 sm:px-6">
      <Link href="/" className="order-1 flex h-16 shrink-0 items-center gap-2"><Image src="/logo-white.svg" alt="Kivai" width={28} height={28} priority /><span className="font-semibold text-foreground">Kivai Música</span></Link>
      <nav className="order-2 ml-auto flex h-16 min-w-0 items-center gap-1 sm:order-3 sm:gap-2">
        <Button asChild size="sm" variant="ghost"><Link href="/noticias" target="_blank" rel="noopener noreferrer" aria-label="Notícias"><Newspaper className="size-4 sm:mr-1" /><span className="hidden sm:inline">Notícias</span></Link></Button>
        <Button asChild size="sm" variant="ghost"><Link href="https://kivai.com.br" target="_blank" rel="noopener noreferrer" aria-label="Ferramentas Kivai"><Wrench className="size-4 sm:mr-1" /><span className="hidden sm:inline">Ferramentas Kivai</span></Link></Button>
        <StreamingHomeActions compact compactLabel="" />
        <Button asChild size="sm" variant={loggedIn ? "default" : "outline"}><Link aria-label={loggedIn ? "Minha biblioteca" : "Entrar na conta"} href={loggedIn ? "/minha-biblioteca" : "/conta/login?next=%2Fminha-biblioteca"}>{loggedIn ? <Library className="size-4" /> : <LogIn className="size-4" />}<span className="hidden sm:inline">{loggedIn ? "Minha biblioteca" : "Entrar"}</span></Link></Button>
      </nav>
      <div className="order-3 h-8 w-full pb-0 sm:order-2 sm:h-auto sm:w-[min(38vw,360px)]"><MusicGlobalSearch /></div>
    </div>
  </header>;
}
