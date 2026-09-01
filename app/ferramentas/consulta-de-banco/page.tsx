import { getToolMetadataAsync } from "@/lib/seo";
import ConsultaDeBancoClient from "./consulta-de-banco-client";

const FAQ = [
  { question: "Como consultar um banco?", answer: "Digite o código numérico do banco e clique em Consultar banco." },
  { question: "O que é o código do banco?", answer: "É o código utilizado para identificar a instituição bancária em operações e sistemas financeiros." },
  { question: "Quais informações aparecem?", answer: "A consulta pode apresentar código, nome, nome completo e ISPB, conforme os dados disponibilizados pela fonte." },
  { question: "A consulta é gratuita?", answer: "A ferramenta do Kivai não cobra pela consulta. A disponibilidade depende da fonte pública utilizada." },
];

export async function generateMetadata() {
  return getToolMetadataAsync("consulta-de-banco");
}

export default function Page() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "SoftwareApplication", name: "Consulta de Banco", applicationCategory: "BusinessApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" } },
      { "@type": "FAQPage", mainEntity: FAQ.map((x) => ({ "@type": "Question", name: x.question, acceptedAnswer: { "@type": "Answer", text: x.answer } })) },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Ferramentas", item: "https://www.kivai.com.br/ferramentas" },
        { "@type": "ListItem", position: 2, name: "Consulta de Banco", item: "https://www.kivai.com.br/ferramentas/consulta-de-banco" },
      ]},
    ],
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><ConsultaDeBancoClient /></>;
}