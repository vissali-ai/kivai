import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Metodologia e Política Editorial",
  description:
    "Veja como o Kivai desenvolve, testa, documenta, revisa e seleciona ferramentas para publicação e indexação.",
  pathname: "/metodologia",
});

const criteria = [
  ["Funcionalidade", "O fluxo principal precisa executar a tarefa descrita e apresentar retorno compreensível em caso de sucesso ou erro."],
  ["Clareza", "Título, instruções, formatos aceitos e ação principal devem corresponder ao que a ferramenta realmente entrega."],
  ["Limitações", "Restrições de tamanho, compatibilidade, precisão ou fidelidade devem ser informadas sem esconder diferenças previsíveis."],
  ["Conteúdo próprio", "A página deve explicar seu problema específico, casos de uso, processo, riscos e dúvidas reais; textos genéricos não são usados para preencher espaço."],
  ["Privacidade", "A página informa quando o processamento é local e evita afirmar que nenhum dado é enviado quando o recurso depende de serviços externos."],
  ["Experiência", "A interface deve ser utilizável em telas compatíveis, não confundir conteúdo com publicidade e não criar ações enganosas."],
] as const;

export default function MetodologiaPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-24">
      <p className="text-sm font-medium uppercase tracking-wider text-primary">Transparência</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
        Metodologia e política editorial
      </h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
        Esta página registra os critérios usados para desenvolver, revisar e selecionar as
        ferramentas do Kivai. O objetivo é separar páginas realmente documentadas de recursos
        que ainda precisam de melhoria antes de serem apresentados aos mecanismos de busca.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Critérios de revisão</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {criteria.map(([title, description]) => (
            <article key={title} className="rounded-xl border border-border p-6">
              <CheckCircle2 className="size-5 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-muted/10 p-6 sm:p-8">
        <h2 className="text-2xl font-semibold">Publicação e indexação são decisões diferentes</h2>
        <div className="mt-5 space-y-4 leading-8 text-muted-foreground">
          <p>
            Uma ferramenta pode estar acessível para testes e ainda não fazer parte do sitemap.
            Isso permite corrigir problemas e criar documentação própria antes de recomendar a
            página como resultado de pesquisa.
          </p>
          <p>
            A seleção inicial utiliza uma lista explícita. Novas páginas não entram no índice
            automaticamente: precisam atender aos critérios acima e passar por uma revisão
            individual de conteúdo e funcionamento.
          </p>
        </div>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <article className="rounded-xl border border-border p-6">
          <h2 className="text-xl font-semibold">Fontes e afirmações</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Explicações técnicas devem refletir o comportamento implementado. Informações que
            podem mudar, como limites de plataformas externas, precisam ser tratadas como
            referência e revisadas quando houver atualização conhecida.
          </p>
        </article>
        <article className="rounded-xl border border-border p-6">
          <h2 className="text-xl font-semibold">Apoio de automação e IA</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Tecnologia pode auxiliar desenvolvimento e revisão, mas não é usada como justificativa
            para publicar páginas em escala sem utilidade própria. A responsabilidade final pelo
            conteúdo e pelas correções permanece com o Kivai.
          </p>
        </article>
      </section>

      <section className="mt-8 rounded-xl border border-border p-6 sm:p-8">
        <h2 className="text-2xl font-semibold">Como enviar uma correção</h2>
        <p className="mt-4 leading-7 text-muted-foreground">
          Informe a URL, descreva o trecho ou comportamento observado e, quando possível,
          explique como reproduzir o problema. Não envie senhas nem documentos confidenciais.
        </p>
        <Link href="/contato" className="mt-5 inline-flex items-center gap-2 font-medium text-primary hover:underline">
          Abrir página de contato <ArrowRight className="size-4" />
        </Link>
      </section>

      <p className="mt-10 text-sm text-muted-foreground">Última revisão: 6 de agosto de 2026.</p>
    </main>
  );
}
