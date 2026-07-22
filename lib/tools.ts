export type ToolCategory =
  | "imagens"
  | "pdf"
  | "calculadoras"
  | "texto"
  | "video"
  | "audio"
  | "documentos"
  | "desenvolvimento"
  | "marketing"
  | "ecommerce"
  | "seo"
  | "ia"
  | "utilitarios";

export interface Tool {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  featured?: boolean;
  index?: boolean;
}

export const tools: Tool[] = [
  {
    slug: "removedor-de-fundo",
    name: "Removedor de Fundo",
    description: "Remova o fundo de imagens automaticamente.",
    category: "imagens",
    featured: true,
    index: true,
  },

  {
    slug: "compressor-de-imagens",
    name: "Compressor de Imagens",
    description: "Comprima imagens sem perder qualidade.",
    category: "imagens",
    featured: true,
    index: true,
  },

  {
    slug: "conversor-de-imagens",
    name: "Conversor de Imagens",
    description: "Converta imagens entre JPG, PNG e WebP.",
    category: "imagens",
    featured: true,
    index: true,
  },

  {
    slug: "conversor-heic",
    name: "Conversor HEIC",
    description: "Converta arquivos HEIC para JPG ou PNG.",
    category: "imagens",
    index: true,
  },

  {
    slug: "redimensionar-imagem",
    name: "Redimensionar Imagem",
    description: "Redimensione imagens mantendo a qualidade.",
    category: "imagens",
    index: true,
  },

  {
    slug: "gerador-de-qr-code",
    name: "Gerador de QR Code",
    description: "Crie QR Codes personalizados.",
    category: "imagens",
    featured: true,
    index: true,
  },

  {
    slug: "pdf-para-imagens",
    name: "PDF para Imagens",
    description: "Converta PDF em imagens.",
    category: "pdf",
    featured: true,
    index: true,
  },

  {
    slug: "imagens-para-pdf",
    name: "Imagens para PDF",
    description: "Transforme imagens em PDF.",
    category: "pdf",
    index: true,
  },

  {
    slug: "unir-pdfs",
    name: "Unir PDFs",
    description: "Junte vários PDFs em um único arquivo.",
    category: "pdf",
    index: true,
  },

  {
    slug: "dividir-pdf",
    name: "Dividir PDF",
    description: "Separe páginas de um PDF.",
    category: "pdf",
    index: true,
  },

  {
    slug: "girar-pdf",
    name: "Girar PDF",
    description: "Rotacione páginas de um PDF.",
    category: "pdf",
    index: true,
  },

  {
    slug: "compactar-pdf",
    name: "Compactar PDF",
    description: "Reduza o tamanho de arquivos PDF.",
    category: "pdf",
    index: true,
  },

  {
    slug: "calculadora-de-roas",
    name: "Calculadora de ROAS",
    description: "Calcule o retorno sobre investimento em anúncios.",
    category: "calculadoras",
    index: true,
  },

  {
    slug: "calculadora-de-roi",
    name: "Calculadora de ROI",
    description: "Calcule o retorno sobre investimento.",
    category: "calculadoras",
    index: true,
  },

  {
    slug: "calculadora-de-markup",
    name: "Calculadora de Markup",
    description: "Calcule o markup ideal.",
    category: "calculadoras",
    index: true,
  },

  {
    slug: "calculadora-de-margem",
    name: "Calculadora de Margem",
    description: "Calcule a margem de lucro.",
    category: "calculadoras",
    index: true,
  },

  {
    slug: "calculadora-de-desconto",
    name: "Calculadora de Desconto",
    description: "Calcule descontos rapidamente.",
    category: "calculadoras",
    index: true,
  },

  {
    slug: "calculadora-de-porcentagem",
    name: "Calculadora de Porcentagem",
    description: "Faça cálculos percentuais.",
    category: "calculadoras",
    index: true,
  },

  {
    slug: "contador-de-palavras",
    name: "Contador de Palavras",
    description: "Conte palavras, caracteres e linhas.",
    category: "texto",
    index: true,
  },
];