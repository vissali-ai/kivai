import Link from "next/link";
import {
  FileLock2,
  GlobeLock,
  HardDrive,
  Info,
  ServerCog,
  ShieldCheck,
} from "lucide-react";

import { getPageMetadata, SITE_URL } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Segurança e privacidade das ferramentas",
  description:
    "Entenda como o Kivai aborda segurança, processamento de arquivos, serviços externos, privacidade e boas práticas ao utilizar as ferramentas.",
  pathname: "/seguranca",
});

const schema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Segurança e privacidade das ferramentas | Kivai",
  url: `${SITE_URL}/seguranca`,
  description:
    "Informações sobre segurança, privacidade e processamento de arquivos nas ferramentas do Kivai.",
  isPartOf: {
    "@type": "WebSite",
    name: "Kivai",
    url: SITE_URL,
  },
};

const principles = [
  {
    icon: GlobeLock,
    title: "Conexão protegida",
    description:
      "O Kivai é disponibilizado por HTTPS. Isso protege a comunicação entre o navegador e o site durante o acesso às páginas e aos recursos online.",
  },
  {
    icon: HardDrive,
    title: "Processamento local quando possível",
    description:
      "Algumas ferramentas conseguem executar o processamento diretamente no navegador. Nesses casos, o arquivo não precisa ser enviado a um servidor para que a função principal seja concluída.",
  },
  {
    icon: ServerCog,
    title: "Processamento pode variar por ferramenta",
    description:
      "Nem toda ferramenta funciona da mesma forma. Recursos que dependem de servidor, infraestrutura externa ou serviços de terceiros podem exigir transmissão de dados para concluir o processamento.",
  },
  {
    icon: FileLock2,
    title: "Transparência sobre arquivos",
    description:
      "A forma de processamento, formatos aceitos, limitações e particularidades relevantes devem ser informadas na própria ferramenta sempre que isso afetar a privacidade ou o resultado.",
  },
];

export default function SecurityPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />

      <p className="text-sm font-medium uppercase tracking-wider text-primary">
        Institucional
      </p>

      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
        Segurança e privacidade no Kivai
      </h1>

      <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
        O Kivai reúne ferramentas com tecnologias e fluxos diferentes. Esta página explica os
        princípios gerais de segurança e privacidade da plataforma sem presumir que todas as
        ferramentas processam arquivos da mesma maneira.
      </p>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {principles.map(({ icon: Icon, title, description }) => (
          <article
            key={title}
            className="rounded-2xl border border-border bg-muted/10 p-6 sm:p-7"
          >
            <Icon className="size-6 text-primary" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
          </article>
        ))}
      </div>

      <section className="mt-10 rounded-2xl border border-border p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <ShieldCheck className="mt-1 size-7 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="text-2xl font-semibold">Como interpretar a segurança de cada ferramenta</h2>
            <div className="mt-4 space-y-4 leading-8 text-muted-foreground">
              <p>
                Antes de enviar um arquivo, observe as informações disponíveis na própria página
                da ferramenta. Quando uma função puder ser executada inteiramente no navegador,
                essa característica pode ser indicada como processamento local. Quando houver
                necessidade de servidor ou serviço externo, a ferramenta não deve ser tratada como
                processamento exclusivamente local.
              </p>
              <p>
                O comportamento também pode depender do formato do arquivo, do navegador, do
                dispositivo e da tecnologia empregada. Por isso, o Kivai evita aplicar uma única
                promessa de armazenamento ou exclusão a recursos tecnicamente diferentes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-border p-6">
          <h2 className="text-xl font-semibold">Dados pessoais e serviços externos</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Recursos como analytics, publicidade, contato ou funcionalidades que dependam de
            terceiros podem envolver tecnologias e tratamentos próprios. A Política de
            Privacidade reúne as informações gerais sobre dados pessoais, cookies e serviços
            utilizados pelo Kivai.
          </p>
          <Link
            href="/privacidade"
            className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
          >
            Ler Política de Privacidade
          </Link>
        </article>

        <article className="rounded-2xl border border-border p-6">
          <h2 className="text-xl font-semibold">Boas práticas para quem utiliza o Kivai</h2>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">
            <li>Evite enviar arquivos com informações sensíveis quando isso não for necessário.</li>
            <li>Confira o resultado antes de compartilhar ou substituir o arquivo original.</li>
            <li>Mantenha uma cópia do arquivo original para operações importantes.</li>
            <li>Use dispositivos e navegadores atualizados sempre que possível.</li>
          </ul>
        </article>
      </section>

      <section className="mt-8 rounded-2xl border border-primary/20 bg-primary/[0.04] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <Info className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="text-xl font-semibold">Encontrou um problema de segurança ou privacidade?</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Se você identificar comportamento inesperado, exposição de informações ou uma
              inconsistência entre o funcionamento de uma ferramenta e sua descrição, utilize o
              canal oficial de contato e informe a ferramenta, o navegador e as etapas que levaram
              ao problema. Não envie senhas ou dados confidenciais no relato.
            </p>
            <Link
              href="/contato"
              className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
            >
              Entrar em contato
            </Link>
          </div>
        </div>
      </section>

      <p className="mt-10 text-sm text-muted-foreground">
        Última revisão: 21 de agosto de 2026.
      </p>
    </main>
  );
}
