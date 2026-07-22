"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Menu,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { label: "Ferramentas", href: "#ferramentas" },
  { label: "Recursos", href: "#recursos" },
  { label: "Preços", href: "#precos" },
];

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2"
          aria-label="Kivai — Página inicial"
        >
          <Image
            src="/logo.png"
            alt="Kivai"
            width={25}
            height={25}
            priority
            className="transition-transform duration-300 group-hover:scale-105"
          />

          <span className="text-lg font-semibold tracking-tight text-foreground">
            Kivai
          </span>
        </Link>

        <nav
          className="hidden items-center gap-7 md:flex"
          aria-label="Navegação principal"
        >
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" asChild>
            <Link href="/login">Em breve</Link>
          </Button>

          <Button asChild className="group rounded-xl">
            <Link href="/em-breve">
              Em breve
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl border-white/10 bg-white/[0.03]"
                aria-label="Abrir menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-[88%] border-white/10 bg-background/95 p-0 backdrop-blur-2xl sm:max-w-sm"
            >
              <SheetHeader className="border-b border-white/8 px-6 py-5 text-left">
                <SheetTitle className="flex items-center gap-3">
                  <Image
                    src="/logo.png"
                    alt="Kivai"
                    width={25}
                    height={25}
                    priority
                  />

                  <span className="text-lg font-semibold">
                    Kivai
                  </span>
                </SheetTitle>

                <SheetDescription>
                  Ferramentas inteligentes para resultados reais.
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-col px-4 py-5">
                <nav
                  className="flex flex-col gap-1"
                  aria-label="Navegação mobile"
                >
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.label}>
                      <Link
                        href={item.href}
                        className="rounded-xl px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>

                <div className="my-5 h-px bg-white/8" />

                <div className="flex flex-col gap-3">
                  <SheetClose asChild>
                    <Button
                      variant="outline"
                      asChild
                      className="h-11 rounded-xl border-white/10"
                    >
                      <Link href="/login">Em breve</Link>
                    </Button>
                  </SheetClose>

                  <SheetClose asChild>
                    <Button asChild className="group h-11 rounded-xl">
                      <Link href="/em-breve">
                        Em breve
                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}