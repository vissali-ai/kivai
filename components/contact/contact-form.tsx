"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, Send } from "lucide-react";

const MIN_MESSAGE_LENGTH = 20;
const MAX_MESSAGE_LENGTH = 3000;

type Fields = {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string;
};

type FieldErrors = Partial<Record<keyof Fields, string>>;

const initialFields: Fields = {
  name: "",
  email: "",
  subject: "",
  message: "",
  website: "",
};

const fieldClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 hover:border-white/20 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/15 disabled:cursor-not-allowed disabled:opacity-60";

function validate(fields: Fields): FieldErrors {
  const errors: FieldErrors = {};
  const name = fields.name.trim();
  const email = fields.email.trim();
  const message = fields.message.trim();

  if (!name) errors.name = "Informe seu nome.";
  else if (name.length > 100) errors.name = "Use no máximo 100 caracteres.";

  if (!email) errors.email = "Informe seu e-mail.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Informe um e-mail válido.";

  if (!fields.subject) errors.subject = "Selecione um assunto.";

  if (!message) errors.message = "Escreva sua mensagem.";
  else if (message.length < MIN_MESSAGE_LENGTH)
    errors.message = `Escreva pelo menos ${MIN_MESSAGE_LENGTH} caracteres.`;

  return errors;
}

export function ContactForm() {
  const [fields, setFields] = useState(initialFields);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof Fields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (status !== "idle") setStatus("idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validate(fields);
    setErrors(nextErrors);
    setStatus("idle");
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      if (!response.ok) throw new Error("Contact request failed");
      setFields(initialFields);
      setErrors({});
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-card/80 p-5 shadow-2xl shadow-black/15 backdrop-blur-sm sm:p-8" aria-labelledby="contact-form-title">
      <div className="mb-7">
        <h2 id="contact-form-title" className="text-xl font-semibold tracking-tight sm:text-2xl">
          Como podemos ajudar?
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Preencha os campos abaixo. Todos os campos marcados com * são obrigatórios.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nome" id="name" error={errors.name}>
            <input id="name" name="name" type="text" required autoComplete="name" maxLength={100} placeholder="Seu nome" value={fields.name} onChange={(event) => updateField("name", event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} className={fieldClass} />
          </Field>
          <Field label="E-mail" id="email" error={errors.email}>
            <input id="email" name="email" type="email" required autoComplete="email" inputMode="email" maxLength={254} placeholder="Seu melhor e-mail" value={fields.email} onChange={(event) => updateField("email", event.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} className={fieldClass} />
          </Field>
        </div>

        <Field label="Assunto" id="subject" error={errors.subject}>
          <select id="subject" name="subject" required value={fields.subject} onChange={(event) => updateField("subject", event.target.value)} aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject ? "subject-error" : undefined} className={`${fieldClass} cursor-pointer bg-card text-foreground [&>option]:bg-card [&>option]:text-foreground`}>
            <option value="" disabled>Selecione um assunto</option>
            <option value="Problema técnico">Problema técnico</option>
            <option value="Sugerir ferramenta">Sugerir ferramenta</option>
            <option value="Dúvidas">Dúvidas</option>
          </select>
        </Field>

        <Field label="Mensagem" id="message" error={errors.message}>
          <textarea id="message" name="message" required rows={7} minLength={MIN_MESSAGE_LENGTH} maxLength={MAX_MESSAGE_LENGTH} placeholder="Escreva sua mensagem" value={fields.message} onChange={(event) => updateField("message", event.target.value)} aria-invalid={Boolean(errors.message)} aria-describedby={`message-help${errors.message ? " message-error" : ""}`} className={`${fieldClass} min-h-40 resize-y`} />
          <div id="message-help" className="mt-2 flex justify-between gap-4 text-xs text-muted-foreground">
            <span>Mínimo de {MIN_MESSAGE_LENGTH} caracteres.</span>
            <span>{fields.message.length}/{MAX_MESSAGE_LENGTH}</span>
          </div>
        </Field>

        <div className="absolute left-[-10000px] top-auto size-px overflow-hidden" aria-hidden="true">
          <label htmlFor="website">Não preencha este campo</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={fields.website} onChange={(event) => updateField("website", event.target.value)} />
        </div>

        <div aria-live="polite" aria-atomic="true" className="min-h-6 text-sm">
          {status === "success" && <p className="text-emerald-400">Mensagem enviada com sucesso. Em breve entraremos em contato.</p>}
          {status === "error" && <p className="text-destructive">Não foi possível enviar sua mensagem. Tente novamente em alguns instantes.</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? <><LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Enviando...</> : <><Send className="size-4" aria-hidden="true" /> Enviar mensagem</>}
        </button>
      </form>
    </section>
  );
}

function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-foreground">{label} <span className="text-primary" aria-hidden="true">*</span><span className="sr-only"> (obrigatório)</span></label>
      {children}
      {error && <p id={`${id}-error`} role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
