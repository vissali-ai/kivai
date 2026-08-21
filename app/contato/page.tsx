import Link from "next/link";
import { Headphones, Lightbulb, MessageCircle, ShieldCheck } from "lucide-react";

import { ContactForm } from "@/components/contact/contact-form";
import { getPageMetadata, SITE_URL } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Entre em contato",
  description:
    "Entre em contato com o Kivai para relatar problemas técnicos, sugerir ferramentas, esclarecer dúvidas ou enviar comentários sobre a plataforma.",
  pathname: "/contato",
});

const contactReasons = [
  { icon: Headphones, label: "Problemas técnicos" },
  { icon: Lightbulb, label: "Sugestões de ferramentas" },
  { icon: MessageCircle, label: "Dúvidas sobre o Kivai" },
];

const schema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Entre em contato | Kivai",
  url: `${SITE_URL}/contato`,
  description:
    "Canal oficial para contato com o Kivai sobre dúvidas, sugestões e problemas técnicos.",
  mainEntity: {
    "@type": "Organization",
    name: "Kivai",
    url: SITE_URL,
  },
};

export default function ContactPage() {
  return (
    <main className="relative flex-1 overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-12rem] top-16 size-[30rem] rounded-full bg-primary/[0.08] blur-[140px]" />
        <div className="absolute bottom-0 right-[-10rem] size-[26rem] rounded-full bg-primary/[0.05] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-20">
          <section className="lg:sticky lg:top-28">
            <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Canal oficial do Kivai
            </span>

            <h1 className="mt-6 max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
              Entre em contato
            </h1>

            <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
              Este é o canal oficial para falar com o Kivai sobre funcionamento das ferramentas,
              problemas técnicos, sugestões, correções e dúvidas relacionadas à plataforma.
            </p>

            <ul className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {contactReasons.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-3 text-sm text-muted-foreground"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>

            <div className="mt-9 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h2 className="font-semibold text-foreground">Privacidade no contato</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Os dados enviados pelo formulário são utilizados para receber e responder à
                    sua solicitação. Para entender como o Kivai trata informações pessoais,
                    consulte nossa Política de Privacidade.
                  </p>
                  <Link
                    href="/privacidade"
                    className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
                  >
                    Ler Política de Privacidade
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <ContactForm />
        </div>

        <section className="mt-16 border-t border-white/10 pt-10 sm:mt-20">
          <div className="grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-muted/10 p-6">
              <h2 className="text-xl font-semibold">Para facilitar o atendimento</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Ao relatar um problema, informe qual ferramenta estava utilizando, o navegador
                ou dispositivo e o que aconteceu. Não envie senhas, dados bancários, documentos
                confidenciais ou outras informações sensíveis pelo formulário.
              </p>
            </article>

            <article className="rounded-2xl border border-border bg-muted/10 p-6">
              <h2 className="text-xl font-semibold">Sobre o projeto</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Quer entender melhor o propósito do Kivai, quem é responsável pelo projeto e
                como as ferramentas são desenvolvidas e revisadas?
              </p>
              <Link
                href="/sobre"
                className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
              >
                Conhecer o Kivai
              </Link>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
