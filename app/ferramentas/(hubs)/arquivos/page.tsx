import Link from "next/link";
import { Archive, ArrowLeft } from "lucide-react";

const plannedTools = [
  {
    name: "Descompactar ZIP",
    description: "Abra arquivos ZIP e extraia o conteúdo para usar os arquivos normalmente.",
    badge: "ZIP",
  },
  {
    name: "Descompactar RAR",
    description: "Abra arquivos RAR e extraia os arquivos contidos no pacote.",
    badge: "RAR",
  },
  {
    name: "Compactar Arquivos em ZIP",
    description: "Reúna vários arquivos em um único pacote ZIP para organizar e compartilhar.",
    badge: "ZIP",
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
              Ferramentas para compactar e descompactar arquivos ZIP e RAR de forma simples,
              com prioridade para processamento diretamente no navegador.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plannedTools.map((tool) => (
              <article
                key={tool.name}
                className="relative min-h-[220px] overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] p-5 sm:p-4"
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
                  <div className="mt-auto pt-4 text-xs font-medium text-muted-foreground">
                    Em desenvolvimento
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 max-w-4xl rounded-xl border border-border bg-muted/10 p-5 text-sm leading-7 text-muted-foreground">
            O Hub Arquivos está sendo implantado em etapas. As ferramentas serão liberadas
            individualmente depois de testes de funcionamento, compatibilidade, privacidade e
            experiência de uso.
          </div>
        </div>
      </section>
    </main>
  );
}
