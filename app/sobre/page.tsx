import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Layers3,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { getPageMetadata, SITE_URL } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Sobre o Kivai",
  description:
    "Conheça o Kivai, seu propósito, quem mantém o projeto, como as ferramentas são desenvolvidas e os compromissos de qualidade, transparência e privacidade.",
  pathname: "/sobre",
});

const schema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "Sobre o Kivai",
  description:
    "Página institucional do Kivai com informações sobre propósito, funcionamento, responsável pelo projeto e critérios de desenvolvimento.",
  url: `${SITE_URL}/sobre`,
  mainEntity: {
    "@type": "Organization",
    name: "Kivai",
    url: SITE_URL,
    founder: {
      "@type": "Person",
      name: "Marcus Vissali",
    },
  },
};

const principles = [
  "Resolver tarefas digitais com fluxos claros e objetivos.",
  "Explicar capacidades, formatos aceitos e limitações sem promessas exageradas.",
  "Priorizar boa experiência em computador e dispositivos móveis.",
  "Revisar ferramentas, páginas e conteúdos de forma contínua.",
];

const ecosystem = [
  "Imagens e arquivos",
  "PDFs e documentos",
  "Vídeos e mídia",
  "Calculadoras",
  "Social media",
  "Marketing e produtividade",
];

export default function SobrePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />

      <section>
        <p className="text-sm font-medium uppercase tracking-wider text-primary">
          Institucional
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Sobre o Kivai
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
          O Kivai é um ecossistema de ferramentas online criado para simplificar
          tarefas digitais do dia a dia. A plataforma reúne recursos para trabalhar
          com imagens, documentos, vídeos, cálculos, conteúdo e outras atividades em
          um único lugar, com foco em utilidade, clareza e rapidez.
        </p>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-muted/10 p-6 sm:p-8">
          <Compass className="size-7 text-primary" />
          <h2 className="mt-5 text-2xl font-semibold">Por que o Kivai existe</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Muitas tarefas simples acabam exigindo programas diferentes, cadastros,
            instalações ou processos desnecessariamente longos. O Kivai busca reduzir
            essas etapas oferecendo ferramentas acessíveis pelo navegador e organizadas
            de acordo com a necessidade do usuário.
          </p>
        </article>

        <article className="rounded-2xl border border-border bg-muted/10 p-6 sm:p-8">
          <UserRound className="size-7 text-primary" />
          <h2 className="mt-5 text-2xl font-semibold">Quem mantém o projeto</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            O Kivai é mantido por Marcus Vissali, responsável pela evolução do produto,
            organização do ecossistema e coordenação do conteúdo publicado. O projeto
            está em desenvolvimento contínuo, com novas ferramentas, correções e
            melhorias sendo incorporadas à plataforma.
          </p>
        </article>
      </section>

      <section className="mt-8 rounded-2xl border border-border p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <Layers3 className="mt-1 size-7 shrink-0 text-primary" />
          <div>
            <h2 className="text-2xl font-semibold">O que você encontra no Kivai</h2>
            <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
              A plataforma é organizada em categorias para facilitar a descoberta de
              ferramentas relacionadas. O catálogo cresce de forma gradual, priorizando
              recursos que resolvam problemas concretos e possam ser utilizados de forma
              simples.
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ecosystem.map((item) => (
            <div
              key={item}
              className="rounded-xl border border-border bg-muted/10 px-4 py-3 text-sm text-muted-foreground"
            >
              {item}
            </div>
          ))}
        </div>

        <Link
          href="/ferramentas"
          className="mt-7 inline-flex items-center gap-2 font-medium text-primary hover:underline"
        >
          Explorar ferramentas <ArrowRight className="size-4" />
        </Link>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-border p-6 sm:p-8">
          <CheckCircle2 className="size-7 text-primary" />
          <h2 className="mt-5 text-2xl font-semibold">Como desenvolvemos as ferramentas</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Cada ferramenta parte de uma tarefa específica. O desenvolvimento considera
            o fluxo principal, formatos aceitos, validações, mensagens de erro,
            comportamento responsivo e clareza das instruções. Recursos podem funcionar
            de maneiras diferentes conforme a tecnologia necessária para cada caso.
          </p>
          <p className="mt-4 leading-7 text-muted-foreground">
            Quando o processamento ocorre localmente no navegador, essa informação pode
            ser apresentada na própria ferramenta. Quando uma função depende de servidor
            ou serviço externo, a página deve informar as condições relevantes de uso.
          </p>
        </article>

        <article className="rounded-2xl border border-border p-6 sm:p-8">
          <ShieldCheck className="size-7 text-primary" />
          <h2 className="mt-5 text-2xl font-semibold">Transparência e privacidade</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Nosso objetivo é explicar de forma direta o que cada recurso faz e evitar
            afirmações que não correspondam ao funcionamento real da ferramenta. Também
            mantemos páginas institucionais com informações sobre privacidade, termos de
            uso e critérios editoriais.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm">
            <Link href="/privacidade" className="font-medium text-primary hover:underline">
              Política de Privacidade
            </Link>
            <Link href="/termos" className="font-medium text-primary hover:underline">
              Termos de Uso
            </Link>
            <Link href="/metodologia" className="font-medium text-primary hover:underline">
              Metodologia
            </Link>
          </div>
        </article>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-muted/10 p-6 sm:p-8">
        <h2 className="text-2xl font-semibold">Princípios do projeto</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {principles.map((principle) => (
            <li key={principle} className="flex gap-3 leading-7 text-muted-foreground">
              <CheckCircle2 className="mt-1 size-5 shrink-0 text-primary" />
              <span>{principle}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <article className="rounded-xl border border-border p-6">
          <h2 className="text-xl font-semibold">Correções e sugestões</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Resultados podem variar conforme navegador, arquivo, formato e dispositivo.
            Relatos claros ajudam a reproduzir problemas e orientar melhorias.
          </p>
          <Link
            href="/contato"
            className="mt-5 inline-flex items-center gap-2 font-medium text-primary hover:underline"
          >
            Entre em contato <ArrowRight className="size-4" />
          </Link>
        </article>

        <article className="rounded-xl border border-border p-6">
          <h2 className="text-xl font-semibold">Um ecossistema em evolução</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            O catálogo do Kivai continuará crescendo, mas o objetivo não é apenas aumentar
            o número de ferramentas. Cada nova página deve acrescentar uma função útil,
            contexto suficiente para o usuário e integração coerente com o restante do
            ecossistema.
          </p>
        </article>
      </section>

      <p className="mt-10 text-sm text-muted-foreground">
        Última revisão: 21 de agosto de 2026.
      </p>
    </main>
  );
}
