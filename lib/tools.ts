import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Calculator,
  Combine,
  FileImage,
  FileText,
  ImageIcon,
  Maximize2,
  Minimize2,
  Percent,
  QrCode,
  RotateCw,
  Scissors,
  Tags,
  TrendingUp,
  Type,
  WandSparkles,
} from "lucide-react";

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

export interface ToolCategoryDefinition {
  slug: ToolCategory;
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export const toolCategories: ToolCategoryDefinition[] = [
  {
    slug: "imagens",
    name: "Imagens",
    description:
      "Remova fundo, converta formatos, comprima arquivos e use outras ferramentas para edição de imagens.",
    href: "/ferramentas/imagens",
    icon: ImageIcon,
  },
  {
    slug: "pdf",
    name: "PDFs",
    description:
      "Converta, organize, extraia imagens e use diversas ferramentas para arquivos PDF.",
    href: "/ferramentas/pdfs",
    icon: FileText,
  },
  {
    slug: "calculadoras",
    name: "Calculadoras",
    description:
      "Ferramentas para ROAS, ROI, margem, markup, desconto, porcentagem e muito mais.",
    href: "/ferramentas/calculadoras",
    icon: Calculator,
  },
  {
    slug: "texto",
    name: "Texto",
    description:
      "Conte palavras, caracteres, tempo de leitura e use outras ferramentas para textos.",
    href: "/ferramentas/texto",
    icon: Type,
  },
];

export interface Tool {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  hubFilter: string;
  badge: string;
  icon: LucideIcon;
  featured?: boolean;
  available: boolean;
  index?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
}

export const tools: Tool[] = [
  {
    slug: "removedor-de-fundo",
    name: "Removedor de Fundo",
    description: "Remova fundos de imagens para produtos, anúncios e projetos.",
    category: "imagens",
    hubFilter: "Otimizar",
    badge: "Imagem",
    icon: ImageIcon,
    featured: true,
    available: true,
    index: true,
    seoTitle: "Removedor de Fundo Online Grátis",
    seoDescription:
      "Remova o fundo de imagens automaticamente em segundos. Ferramenta online gratuita, rápida e sem necessidade de instalar programas.",
    keywords: [
      "removedor de fundo",
      "remover fundo de imagem",
      "apagar fundo de foto",
      "background remover",
      "remover fundo online",
    ],
  },
  {
    slug: "compressor-de-imagens",
    name: "Compressor de Imagens",
    description:
      "Reduza o tamanho de imagens JPG, PNG e WebP para sites, lojas e compartilhamento.",
    category: "imagens",
    hubFilter: "Otimizar",
    badge: "Imagem",
    icon: WandSparkles,
    featured: true,
    available: true,
    index: true,
  },
  {
    slug: "conversor-de-imagens",
    name: "Conversor de Imagens",
    description:
      "Converta arquivos entre PNG, JPG e WebP com controle de qualidade.",
    category: "imagens",
    hubFilter: "Converter",
    badge: "Imagem",
    icon: FileImage,
    featured: true,
    available: true,
    index: true,
  },
  {
    slug: "conversor-heic",
    name: "Conversor HEIC",
    description: "Converta fotos HEIC e HEIF do iPhone para JPG gratuitamente.",
    category: "imagens",
    hubFilter: "Converter",
    badge: "Imagem",
    icon: FileImage,
    available: true,
    index: true,
  },
  {
    slug: "redimensionar-imagem",
    name: "Redimensionar Imagem",
    description:
      "Altere largura e altura de imagens mantendo a qualidade e a proporção.",
    category: "imagens",
    hubFilter: "Otimizar",
    badge: "Imagem",
    icon: Maximize2,
    available: true,
    index: true,
  },
  {
    slug: "gerador-de-qr-code",
    name: "Gerador de QR Code",
    description:
      "Crie QR Codes para links, textos, WhatsApp, e-mail, telefone e Wi-Fi.",
    category: "imagens",
    hubFilter: "Converter",
    badge: "Utilidades",
    icon: QrCode,
    featured: true,
    available: true,
    index: true,
  },
  {
    slug: "pdf-para-imagens",
    name: "PDF para Imagens",
    description:
      "Extraia todas as páginas de um arquivo PDF em formato PNG ou JPG.",
    category: "pdf",
    hubFilter: "Converter",
    badge: "PDF",
    icon: FileText,
    featured: true,
    available: true,
    index: true,
  },
  {
    slug: "imagens-para-pdf",
    name: "Imagens para PDF",
    description: "Transforme arquivos JPG, PNG e WebP em um único documento PDF.",
    category: "pdf",
    hubFilter: "Converter",
    badge: "PDF",
    icon: FileImage,
    available: true,
    index: true,
  },
  {
    slug: "unir-pdfs",
    name: "Unir PDFs",
    description: "Combine vários arquivos PDF em um único documento.",
    category: "pdf",
    hubFilter: "Editar",
    badge: "PDF",
    icon: Combine,
    available: true,
    index: true,
  },
  {
    slug: "dividir-pdf",
    name: "Dividir PDF",
    description: "Separe cada página de um documento PDF em arquivos individuais.",
    category: "pdf",
    hubFilter: "Editar",
    badge: "PDF",
    icon: Scissors,
    available: true,
    index: true,
  },
  {
    slug: "girar-pdf",
    name: "Girar PDF",
    description: "Gire todas as páginas de um arquivo PDF em 90°, 180° ou 270°.",
    category: "pdf",
    hubFilter: "Editar",
    badge: "PDF",
    icon: RotateCw,
    available: true,
    index: true,
  },
  {
    slug: "compactar-pdf",
    name: "Compactar PDF",
    description:
      "Reduza o tamanho de arquivos PDF mantendo a melhor qualidade possível.",
    category: "pdf",
    hubFilter: "Otimizar",
    badge: "PDF",
    icon: Minimize2,
    available: true,
    index: true,
  },
  {
    slug: "calculadora-de-roas",
    name: "Calculadora de ROAS",
    description:
      "Calcule o retorno dos anúncios e estime o ROAS de equilíbrio da operação.",
    category: "calculadoras",
    hubFilter: "Marketing",
    badge: "Marketing",
    icon: BarChart3,
    available: true,
    index: true,
  },
  {
    slug: "calculadora-de-roi",
    name: "Calculadora de ROI",
    description:
      "Calcule a rentabilidade e descubra o ganho ou perda do seu investimento.",
    category: "calculadoras",
    hubFilter: "Financeiro",
    badge: "Negócios",
    icon: TrendingUp,
    available: true,
    index: true,
  },
  {
    slug: "calculadora-de-markup",
    name: "Calculadora de Markup",
    description:
      "Calcule o preço de venda, o lucro bruto e a margem resultante.",
    category: "calculadoras",
    hubFilter: "Vendas",
    badge: "Precificação",
    icon: Tags,
    available: true,
    index: true,
  },
  {
    slug: "calculadora-de-margem",
    name: "Calculadora de Margem",
    description: "Calcule a margem percentual e analise o lucro ou prejuízo por venda.",
    category: "calculadoras",
    hubFilter: "Vendas",
    badge: "Vendas",
    icon: Percent,
    available: true,
    index: true,
  },
  {
    slug: "calculadora-de-desconto",
    name: "Calculadora de Desconto",
    description: "Calcule o valor economizado e descubra o preço final.",
    category: "calculadoras",
    hubFilter: "Vendas",
    badge: "Vendas",
    icon: Percent,
    available: true,
    index: true,
  },
  {
    slug: "calculadora-de-porcentagem",
    name: "Calculadora de Porcentagem",
    description: "Resolva cálculos percentuais de forma simples e rápida.",
    category: "calculadoras",
    hubFilter: "Financeiro",
    badge: "Matemática",
    icon: Calculator,
    available: true,
    index: true,
  },
  {
    slug: "contador-de-palavras",
    name: "Contador de Palavras",
    description:
      "Analise palavras, caracteres, frases, limites e tempo de leitura em tempo real.",
    category: "texto",
    hubFilter: "Analisar",
    badge: "Texto",
    icon: Type,
    available: true,
    index: true,
  },
];

export function getToolHref(slug: string) {
  return `/ferramentas/${slug}`;
}

export function getToolBySlug(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}

export function getToolsByCategory(category: ToolCategory) {
  return tools.filter((tool) => tool.category === category);
}
