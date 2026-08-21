import Link from "next/link";
import {
  ArrowRight,
  CircleHelp,
  FileQuestion,
  LockKeyhole,
  MonitorSmartphone,
  Wrench,
} from "lucide-react";

import { getPageMetadata, SITE_URL } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Central de Ajuda",
  description:
    "Encontre respostas sobre o funcionamento das ferramentas do Kivai, arquivos, navegadores, privacidade, erros e suporte.",
  pathname: "/ajuda",
});

const helpTopics = [
  {
    icon: Wrench,
    title: "Como usar as ferramentas",
    text: "Cada ferramenta possui um fluxo próprio. Leia as instruções da página, confira os formatos aceitos e revise as opções antes de iniciar o processamento.",
  },
  {
    icon: FileQuestion,
    title: "Arquivos e resultados",
    text: "Compatibilidade, tamanho, formato e características do arquivo podem influenciar o resultado. Quando houver limites específicos, eles devem ser informados na própria ferramenta.",
  },
  {
    icon: MonitorSmartphone,
    title: "Navegadores e dispositivos",
    text: "O Kivai é desenvolvido para funcionar em navegadores modernos no computador e no celular. Recursos que dependem do navegador podem apresentar diferenças entre dispositivos.",
  },
  {
    icon: LockKeyhole,
    title: "Privacidade e segurança",
    text: "Algumas ferramentas podem processar dados localmente no navegador e outras podem depender de infraestrutura ou serviços externos. Consulte as informações específicas da ferramenta e nossas páginas institucionais.",
  },
];

const faqs = [
  {
    question: "Preciso criar uma conta para usar o Kivai?",
    answer:
      "As ferramentas gratuitas disponíveis publicamente podem ser utilizadas conforme as condições apresentadas em cada página. Recursos futuros podem possuir regras próprias de acesso.",
  },
  {
    question: "Por que uma ferramenta pode não aceitar meu arquivo?",
    answer:
      "O arquivo pode estar em um formato não suportado, exceder um limite técnico, estar protegido, corrompido ou utilizar uma variação que o navegador não consegue processar. Confira as orientações exibidas na ferramenta.",
  },
  {
    question: "Meus arquivos ficam armazenados pelo Kivai?",
    answer:
      "Não existe uma única regra aplicável a todas as ferramentas. Quando o processamento ocorre somente no navegador, o arquivo não precisa ser enviado ao servidor para executar aquela função. Recursos que utilizem servidor ou terceiros devem informar essa condição de forma compatível com seu funcionamento.",
  },
  {
    question: "O resultado pode variar entre navegadores ou dispositivos?",
    answer:
      "Sim. Formatos, memória disponível, recursos do navegador e características do dispositivo podem afetar desempenho ou compatibilidade. Se encontrar um problema, envie os detalhes pelo canal de contato.",
  },
  {
    question: "Como relatar um erro?",
    answer:
      "Informe o nome da ferramenta, o que tentou fazer, o navegador ou dispositivo utilizado e o comportamento observado. Evite enviar senhas, dados bancários ou arquivos confidenciais pelo formulário de contato.",
  },
  {
    question: "Posso sugerir uma nova ferramenta?",
    answer:
      "Sim. A página de contato possui uma opção específica para sugestões de ferramentas. As sugestões ajudam a orientar melhorias e novas funcionalidades do ecossistema.",
  },
];

const schema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  url: `${SITE_URL}/ajuda`,
  name: "Central de Ajuda do Kivai",
  mainEntity: faqs.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function AjudaPage() {
  return (
    <main className="relative flex-1 overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[28rem] w-[48rem] -translate-x-1/2 rounded-full bg-primary/[0.07] blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
        <header className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <CircleHelp className="size-3.5" aria-hidden="true" />
            Suporte e orientações
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Central de Ajuda
          </h1>
          <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
            Encontre orientações sobre ferramentas, arquivos, compatibilidade, privacidade e
            solução de problemas comuns ao utilizar o Kivai.
          </p>
        </header>

        <section className="mt-14 grid gap-5 sm:grid-cols-2" aria-labelledby="help-topics-title">
          <h2 id="help-topics-title" className="sr-only">Principais assuntos de ajuda</h2>
          {helpTopics.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-border bg-muted/10 p-6 sm:p-7">
              <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p>
            </article>
          ))}
        </section>

        <section className="mt-16" aria-labelledby="faq-title">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-wider text-primary">Dúvidas frequentes</p>
            <h2 id="faq-title" className="mt-3 text-3xl font-semibold tracking-tight">
              Respostas para situações comuns
            </h2>
          </div>

          <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card/40 px-5 sm:px-7">
            {faqs.map((item) => (
              <details key={item.question} className="group py-5">
                <summary className="cursor-pointer list-none pr-6 font-medium text-foreground marker:hidden">
                  {item.question}
                </summary>
                <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-5 md:grid-cols-3">
          <article className="rounded-2xl border border-border p-6">
            <h2 className="text-lg font-semibold">Segurança</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Veja como abordamos processamento de arquivos, conexões e serviços externos.
            </p>
            <Link href="/seguranca" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              Ver Segurança <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </article>

          <article className="rounded-2xl border border-border p-6">
            <h2 className="text-lg font-semibold">Privacidade</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Consulte informações sobre dados pessoais, cookies e tratamento de informações.
            </p>
            <Link href="/privacidade" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              Ver Privacidade <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </article>

          <article className="rounded-2xl border border-border p-6">
            <h2 className="text-lg font-semibold">Ainda precisa de ajuda?</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Use nosso canal oficial para relatar problemas, enviar dúvidas ou sugerir melhorias.
            </p>
            <Link href="/contato" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              Entre em contato <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </article>
        </section>
      </div>
    </main>
  );
}
