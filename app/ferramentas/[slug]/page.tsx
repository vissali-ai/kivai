import { notFound } from "next/navigation";
import { SocialMediaToolClient } from "@/components/tools/social-media-tool-client";
import { getToolBySlug, tools } from "@/lib/tools";
import { getToolMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return tools.filter((tool) => tool.category === "social").map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: Props) {
  return getToolMetadata((await params).slug);
}

export default async function SocialMediaToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool || tool.category !== "social") notFound();
  const faq = [
    [`${tool.name} é gratuito?`, "Sim. A ferramenta é gratuita e funciona diretamente no navegador."],
    ["Os dados são enviados para um servidor?", "Não. Os dados digitados são processados localmente no seu dispositivo."],
    ["Posso usar o resultado em qualquer rede social?", "Sim. Revise o resultado e adapte-o ao contexto da sua publicação antes de usar."],
  ];
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "SoftwareApplication", name: tool.name, applicationCategory: "BusinessApplication", operatingSystem: "Web", description: tool.description, offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" } },
      { "@type": "FAQPage", mainEntity: faq.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Ferramentas", item: "https://kivai.com.br/ferramentas" }, { "@type": "ListItem", position: 2, name: "Social Media", item: "https://kivai.com.br/ferramentas/social-media" }, { "@type": "ListItem", position: 3, name: tool.name }] },
    ],
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><SocialMediaToolClient slug={slug} /></>;
}
