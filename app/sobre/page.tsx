import Link from "next/link";
import { ArrowRight, CheckCircle2, UserRound } from "lucide-react";

import { getPageMetadata, SITE_URL } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Sobre o Kivai",
  description:
    "Conheça o propósito do Kivai, quem é responsável pelo projeto e como as ferramentas são desenvolvidas e revisadas.",
  pathname: "/sobre",
});

const schema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "Sobre o Kivai",
  url: `${SITE_URL}/sobre`,
  mainEntity: {
    "@type": "Organization",
    name: "Kivai",
    url: SITE_URL,
    founder: { "@type": "Person", name: "Marcus Vissali" },
  },
};

export default function SobrePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />

      <p className="text-sm font-medium uppercase tracking-wider text-primary">Institucional</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Sobre o Kivai</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
        O Kivai reúne ferramentas digitais para reduzir etapas em tarefas com documentos,
        imagens, textos, vídeos e cálculos. O objetivo é oferecer funções claras, acessíveis
        pelo navegador e acompanhadas de explicações honestas sobre capacidades e limites.
      </p>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-muted/10 p-6 sm:p-8">
          <UserRound className="size-7 text-primary" />
          <h2 className="mt-5 text-2xl font-semibold">Responsável pelo projeto</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Marcus Vissali é o responsável pelo Kivai, pela manutenção do produto e pela
            coordenação do conteúdo publicado. Essa identificação não substitui autoria
            especializada quando uma página tratar de assunto que exija revisão profissional.
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-muted/10 p-6 sm:p-8">
          <CheckCircle2 className="size-7 text-primary" />
          <h2 className="mt-5 text-2xl font-semibold">O que buscamos entregar</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <li>Função principal disponível e descrita sem exageros.</li>
            <li>Limites, formatos e possíveis diferenças informados na página.</li>
            <li>Orientações úteis antes e depois do processamento.</li>
            <li>Revisão progressiva das ferramentas antes da indexação.</li>
          </ul>
        </article>
      </div>

      <section className="mt-8 rounded-2xl border border-border p-6 sm:p-8">
        <h2 className="text-2xl font-semibold">Como as ferramentas são desenvolvidas</h2>
        <div className="mt-5 space-y-4 leading-8 text-muted-foreground">
          <p>
            Cada ferramenta parte de uma tarefa específica. A implementação define formatos
            aceitos, validações, mensagens de erro e forma de gerar o resultado. Quando a
            tecnologia permite, o processamento acontece localmente no navegador; essa
            condição é informada na própria página e não deve ser presumida para todo recurso.
          </p>
          <p>
            Antes de uma página entrar na seleção indexável, avaliamos o fluxo principal,
            situações de erro previsíveis, clareza das instruções, comportamento responsivo e
            conteúdo editorial. Ferramentas em desenvolvimento podem permanecer disponíveis,
            mas ficam fora do índice até uma revisão individual.
          </p>
        </div>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <article className="rounded-xl border border-border p-6">
          <h2 className="text-xl font-semibold">Correções e atualizações</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Resultados podem variar conforme navegador, arquivo e dispositivo. Relatos claros
            ajudam a reproduzir falhas e priorizar melhorias.
          </p>
          <Link href="/contato" className="mt-5 inline-flex items-center gap-2 font-medium text-primary hover:underline">
            Falar com o Kivai <ArrowRight className="size-4" />
          </Link>
        </article>
        <article className="rounded-xl border border-border p-6">
          <h2 className="text-xl font-semibold">Critérios editoriais</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            A metodologia explica como selecionamos páginas, revisamos afirmações e tratamos
            limitações, privacidade e conteúdo criado com apoio de tecnologia.
          </p>
          <Link href="/metodologia" className="mt-5 inline-flex items-center gap-2 font-medium text-primary hover:underline">
            Ler metodologia <ArrowRight className="size-4" />
          </Link>
        </article>
      </section>

      <p className="mt-10 text-sm text-muted-foreground">Última revisão: 6 de agosto de 2026.</p>
    </main>
  );
}
