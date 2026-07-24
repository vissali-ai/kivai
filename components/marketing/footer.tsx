import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const productLinks = [
  { label: "Ferramentas", href: "/#ferramentas" },
  { label: "Como funciona", href: "/#como-funciona" },
  { label: "Serviços", href: "/servicos" },
  { label: "Premium", href: "/premium" },
];

const ecosystemLinks = [
  { label: "Removedor de fundo", href: "/ferramentas/removedor-de-fundo" },
  { label: "Conversor de imagens", href: "/ferramentas/conversor-de-imagens" },
  { label: "PDF para Imagens", href: "/ferramentas/pdf-para-imagens" },
  { label: "Gerador de QR Code", href: "/ferramentas/gerador-de-qr-code" },
];

const companyLinks = [
  { label: "Entrar", href: "/em-breve" },
  { label: "Criar conta", href: "/em-breve" },
  { label: "Termos de uso", href: "/termos" },
  { label: "Política de Privacidade", href: "/privacidade" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-black/10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute bottom-0 left-1/2 h-[320px] w-[760px] -translate-x-1/2 rounded-full bg-primary/[0.045] blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 sm:pt-20 lg:px-8">
        <div className="grid gap-12 border-b border-white/10 pb-12 lg:grid-cols-[1.35fr_2fr] lg:gap-16">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-3"
              aria-label="Kivai, página inicial"
            >
              <Image
                src="/logo.png"
                alt="Kivai"
                width={28}
                height={28}
                className="h-8 w-auto"
              />

              <span className="text-lg font-semibold tracking-tight text-foreground">
                Kivai
              </span>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">
              Kivai é um ecossistema inteligente que transforma tarefas digitais
              em experiências simples, rápidas e produtivas.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Ferramentas inteligentes para resultados reais
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Produto
              </h3>

              <ul className="mt-5 space-y-3">
                {productLinks.map((link) => (
                  <li key={`${link.label}-${link.href}`}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
                    >
                      {link.label}
                      <ArrowUpRight className="size-3 opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Ecossistema
              </h3>

              <ul className="mt-5 space-y-3">
                {ecosystemLinks.map((link) => (
                  <li key={`${link.label}-${link.href}`}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
                    >
                      {link.label}
                      <ArrowUpRight className="size-3 opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Conta e legal
              </h3>

              <ul className="mt-5 space-y-3">
                {companyLinks.map((link) => (
                  <li key={`${link.label}-${link.href}`}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
                    >
                      {link.label}
                      <ArrowUpRight className="size-3 opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-7 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Kivai. Todos os direitos reservados.
          </p>

          <p>
            Transformando tarefas digitais em experiências simples, rápidas e
            produtivas.
          </p>
        </div>
      </div>
    </footer>
  );
}