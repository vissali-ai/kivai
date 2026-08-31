import { getToolMetadataAsync } from "@/lib/seo";
import ConsultaDeCnaeClient from "./consulta-de-cnae-client";

const FAQ = [
  {
    question: "Como consultar um CNAE no Kivai?",
    answer: "Digite o código da classe CNAE com 5 dígitos e clique em Consultar CNAE. O Kivai encaminha a solicitação para a BrasilAPI e organiza os dados retornados.",
  },
  {
    question: "O que é CNAE?",
    answer: "CNAE é a Classificação Nacional de Atividades Econômicas, utilizada para identificar e classificar atividades econômicas.",
  },
  {
    question: "Quais informações aparecem na consulta?",
    answer: "A consulta pode apresentar o código e a descrição da classe, além da seção, divisão, grupo e observações disponibilizadas pela fonte consultada.",
  },
  {
    question: "A consulta de CNAE é gratuita?",
    answer: "A ferramenta do Kivai não cobra pela consulta. A disponibilidade dos dados depende da fonte pública utilizada.",
  },
];

export async function generateMetadata() {
  return getToolMetadataAsync("consulta-de-cnae");
}

export default function ConsultaDeCnaePage() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Consulta de CNAE",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: "Consulte a classificação de uma atividade econômica pelo código CNAE e visualize sua hierarquia no IBGE.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Ferramentas", item: "https://www.kivai.com.br/ferramentas" },
          { "@type": "ListItem", position: 2, name: "Consulta de CNAE", item: "https://www.kivai.com.br/ferramentas/consulta-de-cnae" },
        ],
      },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\u003c") }} />
      <ConsultaDeCnaeClient />
    </>
  );
}
