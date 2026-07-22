import Link from "next/link";

import {
  ArrowRight,
  Calculator,
  FileImage,
  FileText,
  ImageIcon,
  Maximize2,
  QrCode,
  Type,
  Video,
  WandSparkles,
} from "lucide-react";
type Tool = {
  title: string;
  description: string;
  icon: any;
  badge?: string;
  href?: string;
  featured?: boolean;
  premium?: boolean;
};

type Category = {
  title: string;
  tools: Tool[];
};
const tools: Tool[] = [
  {
    title: "Imagens",
    description:
      "Remova fundo, converta formatos, comprima arquivos e utilize outras ferramentas para edição de imagens.",
    icon: ImageIcon,
    badge: "Categoria",
    href: "/ferramentas/imagens",
  },
  {
    title: "PDFs",
    description:
      "Converta, organize, extraia imagens e utilize diversas ferramentas para arquivos PDF.",
    icon: FileText,
    badge: "Categoria",
    href: "/ferramentas/pdfs",
  },
  {
    title: "Calculadoras",
    description:
      "Ferramentas para ROAS, ROI, margem, markup, desconto, porcentagem e muito mais.",
    icon: Calculator,
    badge: "Categoria",
    href: "/ferramentas/calculadoras",
  },
  {
    title: "Vídeos",
    description:
      "Converta vídeos entre formatos compatíveis para diferentes plataformas.",
    icon: Video,
    badge: "Categoria",
    href: "/ferramentas/videos",
  },
  {
    title: "Texto",
    description:
      "Conte palavras, caracteres, tempo de leitura e utilize outras ferramentas para textos.",
    icon: Type,
    badge: "Categoria",
    href: "/ferramentas/texto",
  },
];

export function ToolsSection() {
  return (
    <section
      id="ferramentas"
      className="relative overflow-hidden border-t border-white/5 bg-background py-12 sm:py-14 lg:py-16"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[320px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
    Explorar categorias
  </h2>

  <p className="mt-2 text-sm text-muted-foreground">
    Encontre rapidamente a ferramenta ideal para cada necessidade.
  </p>
</div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {tools.map((tool) => {
            const Icon = tool.icon;

            const cardClassName = [
              "group relative min-w-0 overflow-hidden rounded-xl border p-4 transition duration-300",
              "border-white/10 bg-white/[0.035]",
              "hover:-translate-y-1 hover:border-primary/35 hover:bg-white/[0.055]",
              tool.featured ? "ring-1 ring-primary/20" : "",
              tool.premium ? "border-primary/25 bg-primary/[0.045]" : "",
            ].join(" ");

            const cardContent = (
              <>
                {tool.featured && (
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-cyan-400/5" />
                )}

                {tool.premium && (
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-primary/5" />
                )}

                <div className="relative flex h-full min-h-[190px] flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary transition duration-300 group-hover:scale-105">
                      <Icon className="size-4" />
                    </span>

                    {tool.badge && (
                      <span
                        className={[
                          "shrink-0 rounded-full border px-2 py-0.5 text-[10px]",
                          tool.premium
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-white/10 bg-white/5 text-muted-foreground",
                        ].join(" ")}
                      >
                        {tool.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 text-[15px] font-semibold leading-5 tracking-tight text-foreground">
                    {tool.title}
                  </h3>

                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
                    {tool.description}
                  </p>

                  <div className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-medium text-foreground transition duration-300 group-hover:text-primary">
                    Explorar
                    <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </>
            );

            if (tool.href) {
              return (
                <Link
                  key={tool.title}
                  href={tool.href}
                  className={cardClassName}
                >
                  {cardContent}
                </Link>
              );
            }

            return (
              <article key={tool.title} className={cardClassName}>
                {cardContent}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}