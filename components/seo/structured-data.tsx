export default function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Kivai",
    alternateName: "Kivai Ferramentas",
    url: "https://kivai.com.br",
    description:
      "Ecossistema de ferramentas online gratuitas para produtividade, marketing, imagens, PDFs e cálculos.",
    inLanguage: "pt-BR",
    publisher: {
      "@type": "Organization",
      name: "Kivai",
      url: "https://kivai.com.br",
      logo: {
        "@type": "ImageObject",
        url: "https://kivai.com.br/logo.png",
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}