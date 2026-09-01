import { getToolMetadataAsync } from "@/lib/seo";
import ConsultaDeCnpjClient from "./consulta-de-cnpj-client";

const FAQ = [
  {
    question: "Como consultar um CNPJ no Kivai?",
    answer:
      "Digite o CNPJ com ou sem pontuação e clique em Consultar CNPJ. O Kivai envia a solicitação para a BrasilAPI e organiza os dados retornados.",
  },
  {
    question: "A consulta de CNPJ é gratuita?",
    answer:
      "A ferramenta do Kivai não cobra pela consulta. A disponibilidade dos dados depende do serviço público utilizado como fonte.",
  },
  {
    question: "Quais dados podem aparecer na consulta?",
    answer:
      "A resposta pode incluir razão social, nome fantasia, situação cadastral, endereço, CNAE principal, atividades secundárias, contatos, quadro societário e informações tributárias disponibilizadas pela fonte.",
  },
  {
    question: "O Kivai armazena os dados consultados?",
    answer:
      "A ferramenta não salva o resultado da consulta. O CNPJ é encaminhado à BrasilAPI para obter a resposta solicitada.",
  },
];

export async function generateMetadata() {
  return getToolMetadataAsync("consulta-cnpj");
}

export default function ConsultaDeCnpjPage() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Consulta de CNPJ",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
          "Consulte dados cadastrais, situação, atividades, endereço, contatos e outras informações disponíveis de uma empresa pelo CNPJ.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "BRL",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Ferramentas",
            item: "https://www.kivai.com.br/ferramentas",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Consulta de CNPJ",
            item: "https://www.kivai.com.br/ferramentas/consulta-cnpj",
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />
      <ConsultaDeCnpjClient />
    </>
  );
}
