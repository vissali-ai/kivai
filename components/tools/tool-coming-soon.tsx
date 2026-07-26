import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";

type ToolComingSoonProps = {
  name: string;
  description: string;
};

export function ToolComingSoon({ name, description }: ToolComingSoonProps) {
  return (
    <section className="flex min-h-[80vh] items-center justify-center px-6 py-24">
      <div className="max-w-2xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Clock className="h-8 w-8 text-primary" />
        </div>

        <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          Em breve
        </span>

        <h1 className="mt-6 text-4xl font-bold tracking-tight">{name}</h1>

        <p className="mt-4 text-lg text-muted-foreground">{description}</p>

        <p className="mt-2 text-muted-foreground">
          Estamos preparando esta ferramenta. Ela estará disponível em breve.
        </p>

        <div className="mt-8">
          <Link
            href="/ferramentas/imagens"
            className="inline-flex items-center rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:opacity-90"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para ferramentas de imagens
          </Link>
        </div>
      </div>
    </section>
  );
}
