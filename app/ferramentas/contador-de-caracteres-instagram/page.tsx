import { InstagramTextClient } from "@/components/tools/instagram-text-client";
import { getToolMetadata } from "@/lib/seo";
export const metadata = getToolMetadata("contador-de-caracteres-instagram");
const schema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Contador de Caracteres Instagram", applicationCategory: "BusinessApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" } };
export default function Page() { return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><InstagramTextClient mode="characters" /></>; }
