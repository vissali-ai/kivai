import { getRateableTool, getToolRatingSummary } from "@/lib/tool-ratings";
import { ToolRatingControl } from "@/components/tools/tool-rating-control";
import { SITE_URL } from "@/lib/seo";
export async function ToolRatingSection({slug}:{slug:string}) {
  const tool = await getRateableTool(slug);
  if (!tool) return null;
  const summary = await getToolRatingSummary(slug);
  const url = `${SITE_URL}/ferramentas/${slug}`;
  const schema = summary ? {
    "@context":"https://schema.org",
    "@type":"SoftwareApplication",
    "@id":`${url}#software`,
    name:tool.name,
    url,
    description: tool.description,
    applicationCategory:"UtilitiesApplication",
    operatingSystem:"Qualquer sistema com navegador moderno",
    offers:{"@type":"Offer",price:"0",priceCurrency:"BRL"},
    aggregateRating:{"@type":"AggregateRating",ratingValue:summary.ratingValue,ratingCount:summary.ratingCount,bestRating:5,worstRating:1}
  } : null;
  return <>
    {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}} />}
    <ToolRatingControl slug={slug} initial={summary}/>
  </>;
}
