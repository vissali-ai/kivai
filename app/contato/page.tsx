import type { Metadata } from "next";
import { Headphones, Lightbulb, MessageCircle } from "lucide-react";

import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: { absolute: "Entre em contato | Kivai" },
  description:
    "Entre em contato com o Kivai para relatar problemas, sugerir ferramentas ou enviar dúvidas.",
  alternates: { canonical: "/contato" },
};

const contactReasons = [
  { icon: Headphones, label: "Problemas técnicos" },
  { icon: Lightbulb, label: "Sugestões de ferramentas" },
  { icon: MessageCircle, label: "Dúvidas sobre o Kivai" },
];

export default function ContactPage() {
  return (
    <main className="relative flex-1 overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-12rem] top-16 size-[30rem] rounded-full bg-primary/[0.08] blur-[140px]" />
        <div className="absolute bottom-0 right-[-10rem] size-[26rem] rounded-full bg-primary/[0.05] blur-[120px]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-20 lg:px-8 lg:py-28">
        <section className="lg:sticky lg:top-28">
          <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Fale com a gente
          </span>
          <h1 className="mt-6 max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
            Entre em contato
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
            Entre em contato para relatar um problema, sugerir uma nova
            ferramenta, esclarecer dúvidas ou saber mais sobre o Kivai.
          </p>

          <ul className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {contactReasons.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </section>

        <ContactForm />
      </div>
    </main>
  );
}
