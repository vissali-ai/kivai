import { InstagramTextClient } from "@/components/tools/instagram-text-client";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("quebra-de-linha-instagram");
const schema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Quebra de Linha para Instagram", applicationCategory: "BusinessApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" } };
export default function Page() { return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><InstagramTextClient mode="lines" /></>; }
