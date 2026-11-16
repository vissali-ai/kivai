"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Library, LogIn, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getStoredSession } from "@/lib/user-auth";

export function MusicSiteHeader() {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    let active = true;
    getCurrentUser(getStoredSession()).then((user) => { if (active) setLoggedIn(Boolean(user?.id)); }).catch(() => { if (active) setLoggedIn(false); });
    return () => { active = false; };
  }, []);
  return <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
    <Link href="/" className="flex items-center gap-2"><Image src="/logo.png" alt="" width={28} height={28} priority /><span className="font-semibold">Kivai Música</span></Link>
    <nav className="flex items-center gap-2"><Button asChild variant="ghost" size="sm"><Link href="/"><Music2 className="size-4" />Explorar</Link></Button><Button asChild size="sm" variant={loggedIn ? "default" : "outline"}><Link href={loggedIn ? "/minha-biblioteca" : "/conta/login?next=%2Fminha-biblioteca"}>{loggedIn ? <Library className="size-4" /> : <LogIn className="size-4" />}<span className="hidden sm:inline">{loggedIn ? "Minha biblioteca" : "Entrar"}</span><span className="sm:hidden">{loggedIn ? "Biblioteca" : "Entrar"}</span></Link></Button></nav>
  </div></header>;
}