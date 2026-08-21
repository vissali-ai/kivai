import Link from "next/link";
import { Archive, ArrowLeft, ArrowRight } from "lucide-react";

const tools = [
  {
    name: "Descompactar ZIP",
    description: "Abra arquivos ZIP e extraia o conteúdo para usar os arquivos normalmente.",
    badge: "ZIP",
    href: "/ferramentas/descompactar-zip",
  },
  {
    name: "Descompactar RAR",
    description: "Abra arquivos RAR e extraia os arquivos contidos no pacote.",
    badge: "RAR",
    href: "/ferramentas/descompactar-rar",
  },
  {
    name: "Compactar Arquivos em ZIP",
    description: "Reúna vários arquivos em um único pacote ZIP para organizar e compartilhar.",
    badge: "ZIP",
    href: "/ferramentas/compactar-arquivos-zip",
  },
  {
    name: "Renomear Arquivos em Lote",
    description: "Padronize vários nomes de arquivo com numeração automática e extensões preservadas.",
    badge: "LOTE",
    href: "/ferramentas/renomear-arquivos-em-lote",
  },
  {
    name: "Adicionar Prefixo ou Sufixo",
    description: "Acrescente texto antes ou depois do nome de vários arquivos sem apagar o nome atual.",
    badge: "LOTE",
    href: "/ferramentas/adicionar-prefixo-sufixo-arquivos",
  },
] as const;

export default function ArquivosPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden bg-background pb-12 pt-24 sm:pb-14 lg:pb-16">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Voltar para o início
            </Link>
          </div>

          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              Ferramentas para arquivos
            </p>
            <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Arquivos
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              Ferramentas para compactar, descompactar, organizar e gerenciar arquivos diretamente no navegador.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {tools.map((tool) => (
              <Link
                key={tool.name}
                href={tool.href}
                className="group relative min-h-[220px] overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-white/[0.055] sm:aspect-square sm:p-4"
              >
                <div className="flex h-full flex-col">
                  <div className="flex items-start justify-between">
                    <span className="flex size-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                      <Archive className="size-4" />
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {tool.badge}
                    </span>
                  </div>

                  <h2 className="mt-4 text-[15px] font-semibold">{tool.name}</h2>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {tool.description}
                  </p>
                  <div className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-medium group-hover:text-primary">
                    Explorar
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
