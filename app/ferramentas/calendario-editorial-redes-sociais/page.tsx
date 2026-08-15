import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/seo";
import CalendarioEditorialClient from "./calendario-editorial-client";

const url = "https://www.kivai.com.br/ferramentas/calendario-editorial-redes-sociais";
const title = "Calendário Editorial para Redes Sociais Grátis | Kivai";
const description = "Crie um calendário editorial para Instagram, TikTok, LinkedIn e outras redes. Planeje publicações, filtre conteúdos e exporte seu plano em CSV.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  keywords: ["calendário editorial", "calendário de conteúdo", "planejamento de redes sociais", "calendário social media", "planejamento de conteúdo", "calendário Instagram"],
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "website", siteName: "Kivai", locale: "pt_BR", images: [{ url: DEFAULT_SOCIAL_IMAGE, width: 1200, height: 630, alt: "Kivai" }] },
  twitter: { card: "summary_large_image", title, description, images: [DEFAULT_SOCIAL_IMAGE] },
};

const faq = [
  ["O que é um calendário editorial para redes sociais?", "É um planejamento visual que organiza temas, formatos, canais, objetivos e etapas de cada publicação ao longo do mês."],
  ["Preciso criar uma conta para usar a ferramenta?", "Não. O calendário funciona sem login e pode ser usado gratuitamente no navegador."],
  ["Onde as publicações ficam salvas?", "Os dados são guardados no armazenamento local do navegador e permanecem somente no dispositivo em que o calendário foi criado."],
  ["Posso planejar mais de uma rede social?", "Sim. É possível organizar Instagram, Facebook, TikTok, YouTube, LinkedIn, X, Threads, Pinterest e outras redes no mesmo calendário."],
  ["É possível adicionar várias publicações no mesmo dia?", "Sim. Cada data aceita quantas publicações forem necessárias, mesmo quando pertencem a redes, formatos ou campanhas diferentes."],
  ["Como acompanho a produção do conteúdo?", "Use os status de ideia, planejado, em produção, em revisão, aprovado, agendado e publicado para visualizar a evolução de cada peça."],
  ["Posso duplicar uma publicação recorrente?", "Sim. A opção de duplicar cria uma cópia editável; depois basta escolher a nova data e ajustar os detalhes desejados."],
  ["Como mover uma publicação para outro dia?", "Abra a publicação e escolha Mover para outra data. O conteúdo e os demais campos são mantidos automaticamente."],
  ["Os filtros alteram ou apagam meu planejamento?", "Não. Eles apenas exibem conteúdos por rede, formato, objetivo ou status, sem modificar as publicações salvas."],
  ["Posso exportar o calendário editorial?", "Sim. A exportação em CSV reúne todas as publicações e pode ser aberta em programas de planilha para compartilhar ou arquivar."],
  ["O calendário sincroniza entre celular e computador?", "Não automaticamente. Como o armazenamento é local, cada navegador e dispositivo mantém seu próprio planejamento."],
  ["O que acontece se eu limpar os dados do navegador?", "O calendário local pode ser removido. Para manter uma cópia de segurança, exporte o CSV periodicamente antes de limpar o navegador."],
];

const schema = [
  { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Calendário Editorial para Redes Sociais", applicationCategory: "BusinessApplication", operatingSystem: "Navegador moderno", url, description, offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" }, featureList: ["Calendário mensal", "Planejamento multirrede", "Filtros editoriais", "Persistência local", "Exportação CSV"] },
  { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: "https://www.kivai.com.br" }, { "@type": "ListItem", position: 2, name: "Social Media", item: "https://www.kivai.com.br/ferramentas/social-media" }, { "@type": "ListItem", position: 3, name: "Calendário Editorial para Redes Sociais", item: url }] },
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) },
];

const benefits = ["Centraliza ideias e campanhas em uma visão mensal", "Evita lacunas, repetições e conflitos de publicação", "Facilita a divisão do trabalho entre criação, revisão e aprovação", "Permite equilibrar redes, formatos e objetivos", "Mantém o planejamento acessível sem cadastro", "Gera um arquivo CSV para compartilhar ou arquivar"];

export default function Page() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><CalendarioEditorialClient /><section className="border-t border-border bg-muted/10 py-12"><div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
    <article className="border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">O que é um calendário editorial para redes sociais?</h2><p className="mt-4 leading-7 text-muted-foreground">O calendário editorial é a base de um planejamento de conteúdo consistente. Ele transforma ideias soltas em publicações com data, canal, formato, objetivo e etapa de produção definidos. Com essa visão, marcas, criadores e equipes conseguem enxergar o mês inteiro, distribuir temas com equilíbrio e acompanhar o que ainda precisa ser produzido, revisado, aprovado ou publicado.</p></article>
    <div className="grid gap-6 lg:grid-cols-2"><article className="border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Quando utilizar</h2><p className="mt-4 leading-7 text-muted-foreground">Use antes de iniciar uma campanha, organizar a rotina semanal, preparar um lançamento ou coordenar conteúdos em várias redes. O planejamento também ajuda em datas comemorativas, séries recorrentes, ações sazonais e períodos com grande volume de publicações. Mesmo um profissional que trabalha sozinho ganha clareza ao separar a ideia da produção e da data de postagem.</p></article><article className="border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Principais vantagens</h2><ul className="mt-4 grid gap-3 text-sm text-muted-foreground">{benefits.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{item}</li>)}</ul></article></div>
    <article className="border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Como criar seu calendário de conteúdo</h2><ol className="mt-4 grid gap-4 text-muted-foreground sm:grid-cols-2 lg:grid-cols-4"><li><strong className="block text-foreground">1. Defina o objetivo</strong>Escolha o resultado esperado, como alcance, relacionamento, tráfego ou vendas.</li><li><strong className="block text-foreground">2. Distribua os temas</strong>Adicione cada pauta na data adequada e indique a rede e o formato.</li><li><strong className="block text-foreground">3. Acompanhe o status</strong>Atualize as etapas conforme o conteúdo avança da ideia até a publicação.</li><li><strong className="block text-foreground">4. Revise e exporte</strong>Use filtros para conferir o equilíbrio do mês e gere o CSV como apoio.</li></ol></article>
    <article className="border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Dicas para um planejamento editorial eficiente</h2><div className="mt-4 grid gap-5 text-sm leading-6 text-muted-foreground md:grid-cols-3"><p><strong className="block text-foreground">Misture formatos e intenções</strong>Combine conteúdo educativo, entretenimento, autoridade e conversão. A variedade reduz a sensação de repetição e atende diferentes momentos da audiência.</p><p><strong className="block text-foreground">Planeje com antecedência realista</strong>Considere o tempo necessário para roteiro, criação, aprovação e agendamento. Um calendário útil respeita a capacidade da equipe e deixa espaço para oportunidades.</p><p><strong className="block text-foreground">Revise o histórico</strong>Após publicar, mantenha o status atualizado. O calendário se torna um registro que ajuda a identificar frequência, excesso de um formato e lacunas de conteúdo.</p></div></article>
    <article className="border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Perguntas frequentes</h2><div className="mt-5 space-y-3">{faq.map(([question, answer]) => <details key={question} className="border border-border p-4"><summary className="cursor-pointer font-medium">{question}</summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p></details>)}</div></article>
    <nav aria-label="Ferramentas relacionadas" className="border border-border bg-background p-5 sm:p-6"><h2 className="text-2xl font-semibold">Ferramentas relacionadas</h2><div className="mt-4 flex flex-wrap gap-3"><Related href="/ferramentas/contador-de-caracteres-instagram">Contador de Caracteres para Instagram</Related><Related href="/ferramentas/contador-de-hashtags-instagram">Contador de Hashtags para Instagram</Related><Related href="/ferramentas/quebra-de-linha-instagram">Quebra de Linha para Instagram</Related></div></nav>
  </div></section></>;
}

function Related({ href, children }: { href: string; children: React.ReactNode }) { return <Link href={href} className="border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary">{children}</Link>; }
