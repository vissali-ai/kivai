import Link from "next/link";
import {
  ArrowRight,
  FileImage,
  ImageIcon,
  QrCode,
  WandSparkles,
  Images,
} from "lucide-react";

type Tool = {
  title: string;
  description: string;
  icon: any;
  badge: string;
  href: string;
};

const tools: Tool[] = [
  {
    title: "Removedor de fundo",
    description:
      "Remova fundos de imagens para produtos, anúncios e projetos.",
    icon: ImageIcon,
    badge: "Imagem",
    href: "/ferramentas/removedor-de-fundo",
  },
  {
    title: "Conversor de imagens",
    description:
      "Converta arquivos entre PNG, JPG e WebP com controle de qualidade.",
    icon: FileImage,
    badge: "Imagem",
    href: "/ferramentas/conversor-de-imagens",
  },
  {
    title: "Compressor de imagens",
    description:
      "Reduza o tamanho de imagens JPG, PNG e WebP para sites, lojas e compartilhamento.",
    icon: WandSparkles,
    badge: "Imagem",
    href: "/ferramentas/compressor-de-imagens",
  },
  {
    title: "PDF para imagens",
    description:
      "Transforme páginas de arquivos PDF em imagens JPG ou PNG rapidamente.",
    icon: Images,
    badge: "Documentos",
    href: "/ferramentas/pdf-para-imagens",
  },
  {
    title: "Gerador de QR Code",
    description:
      "Crie QR Codes para links, textos, WhatsApp, e-mail, telefone e Wi-Fi.",
    icon: QrCode,
    badge: "Utilidades",
    href: "/ferramentas/gerador-de-qr-code",
  },
];

export function FeaturedToolsSection() {
  return (
    <section className="border-t border-white/5 bg-background py-12 sm:py-14">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Mais usadas
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {tools.map((tool) => {
            const Icon = tool.icon;

            return (
              <Link
                key={tool.title}
                href={tool.href}
                className="group relative min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] p-4 ring-1 ring-primary/20 transition duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-white/[0.055]"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-cyan-400/5" />

                <div className="relative flex h-full min-h-[190px] flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary transition duration-300 group-hover:scale-105">
                      <Icon className="size-4" />
                    </span>

                    <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {tool.badge}
                    </span>
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
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}