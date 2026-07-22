import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="mx-auto max-w-xl text-center">
        <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          Erro 404
        </span>

        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
          Página não encontrada
        </h1>

        <p className="mt-4 text-muted-foreground">
          A página que você tentou acessar não existe, foi removida ou o endereço
          está incorreto.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground transition hover:opacity-90"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a Home
          </Link>

          <Link
            href="/#ferramentas"
            className="inline-flex items-center justify-center rounded-lg border px-5 py-3 font-medium transition hover:bg-muted"
          >
            <Search className="mr-2 h-4 w-4" />
            Explorar Ferramentas
          </Link>
        </div>
      </div>
    </main>
  );
}