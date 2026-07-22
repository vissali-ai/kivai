import Link from "next/link";
import { Clock, ArrowLeft } from "lucide-react";

export default function EmBrevePage() {
  return (
    <main className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Clock className="h-8 w-8 text-primary" />
        </div>

        <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          Em breve
        </span>

        <h1 className="mt-6 text-4xl font-bold tracking-tight">
          Novidades chegando ao Kivai
        </h1>

        <p className="mt-4 text-lg text-muted-foreground">
          Estamos preparando uma nova experiência com contas de usuário,
          dashboard, favoritos, histórico e recursos Premium.
        </p>

        <p className="mt-2 text-muted-foreground">
          Enquanto isso, todas as ferramentas continuam disponíveis gratuitamente.
        </p>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:opacity-90"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a Home
          </Link>
        </div>
      </div>
    </main>
  );
}