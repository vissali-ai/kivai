import { notFound } from "next/navigation";
import { SocialMediaToolClient } from "@/components/tools/social-media-tool-client";
import { PublicContentPage, PublicHubPage } from "@/components/site-cms/public-content-page";
import { getToolBySlug } from "@/lib/tools";
import { getCmsHubMetadata, getCmsPageMetadata, getToolMetadataAsync } from "@/lib/seo";
import { getPublishedSiteContentByPath, getSiteHubBySlug, listPublishedSiteContentsByHub, listSiteHubs } from "@/lib/site-cms/repository";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  // As ferramentas atuais possuem páginas literais. A rota dinâmica fica
  // reservada para futuras ferramentas sem gerar cópias das rotas existentes.
  return [];
}

export async function generateMetadata({ params }: Props) {
  const slug = (await params).slug;
  if (getToolBySlug(slug)) return getToolMetadataAsync(slug);
  if (await getPublishedSiteContentByPath(`/ferramentas/${slug}`)) return getCmsPageMetadata(`/ferramentas/${slug}`);
  return getCmsHubMetadata(slug);
}

export default async function SocialMediaToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) {
    const content = await getPublishedSiteContentByPath(`/ferramentas/${slug}`);
    if (content?.contentType === "tool") {
      const hub = content.hubId ? (await listSiteHubs()).find((item) => item.id === content.hubId) : null;
      return <PublicContentPage content={content} hub={hub} />;
    }
    const hub = await getSiteHubBySlug(slug, true);
    if (hub) return <PublicHubPage hub={hub} contents={await listPublishedSiteContentsByHub(hub.id)} />;
    notFound();
  }
  if (tool.category !== "social") notFound();
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
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Ferramentas", item: "https://www.kivai.com.br/ferramentas" }, { "@type": "ListItem", position: 2, name: "Social Media", item: "https://www.kivai.com.br/ferramentas/social-media" }, { "@type": "ListItem", position: 3, name: tool.name }] },
    ],
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><SocialMediaToolClient slug={slug} /></>;
}
