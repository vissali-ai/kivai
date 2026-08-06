import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Calculator,
  Combine,
  FileImage,
  FilePenLine,
  FileSpreadsheet,
  ImagePlus,
  FileText,
  ImageIcon,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Percent,
  QrCode,
  RotateCw,
  Scaling,
  Scissors,
  Tags,
  TrendingUp,
  Type,
  WandSparkles,
  Box,
} from "lucide-react";

export type ToolCategory =
  | "imagens"
  | "pdf"
  | "calculadoras"
  | "texto"
  | "social"
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
    slug: "gerador-de-favicon",
    name: "Gerador de Favicon",
    description:
      "Crie favicons para sites em tamanhos prontos para navegadores e dispositivos.",
    category: "imagens",
    hubFilter: "Converter",
    badge: "Imagens",
    icon: ImagePlus,
    featured: true,
    available: true,
    index: true,
    seoTitle: "Gerador de Favicon Online Grátis | Kivai",
    seoDescription: "Crie favicon.ico e ícones PNG para seu site diretamente no navegador.",
    keywords: ["gerador de favicon", "favicon ico", "criar favicon"],
  },
  {
    slug: "imagem-para-favicon",
    name: "Imagem → Favicon",
    description:
      "Transforme uma imagem em favicon para usar no seu site.",
    category: "imagens",
    hubFilter: "Converter",
    badge: "Imagens",
    icon: ImageIcon,
    featured: true,
    available: true,
    index: true,
    seoTitle: "Imagem para Favicon Online Grátis | Kivai",
    seoDescription: "Converta PNG, JPG e WebP em um pacote de favicons para navegador, Apple e Android.",
    keywords: ["imagem para favicon", "converter imagem favicon", "favicon png"],
  },
  {
    slug: "gerador-de-mockups",
    name: "Gerador de Mockups",
    description:
      "Apresente artes e marcas em mockups prontos para compartilhar.",
    category: "imagens",
    hubFilter: "Editar",
    badge: "Imagens",
    icon: Box,
    featured: true,
    available: true,
    index: true,
    seoTitle: "Gerador de Mockups Online Grátis | Kivai",
    seoDescription: "Crie mockups de produtos, dispositivos e redes sociais diretamente no navegador.",
    keywords: ["gerador de mockups", "mockup online", "criar mockup"],
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
    slug: "pdf-para-word",
    name: "PDF para Word",
    description: "Converta arquivos PDF em documentos editáveis do Word no formato DOCX.",
    category: "pdf",
    hubFilter: "Converter",
    badge: "PDF",
    icon: FileText,
    featured: true,
    available: true,
    index: true,
    seoTitle: "PDF para Word: Converter PDF em DOCX Online Grátis | Kivai",
    seoDescription: "Converta PDF para Word (DOCX) online e grátis. Transforme textos, títulos, listas e tabelas em documentos editáveis, sem instalar programas.",
    keywords: ["pdf para word", "converter pdf em word", "pdf para docx", "transformar pdf em word", "conversor pdf word online"],
  },
  {
    slug: "pdf-para-excel",
    name: "PDF para Excel",
    description: "Extraia tabelas e dados de arquivos PDF para uma planilha Excel.",
    category: "pdf",
    hubFilter: "Converter",
    badge: "PDF",
    icon: FileSpreadsheet,
    available: true,
    index: true,
    seoTitle: "PDF para Excel: Converter PDF em XLSX Online Grátis | Kivai",
    seoDescription: "Converta PDF para Excel (XLSX) online e grátis. Extraia tabelas e dados de PDFs digitais, revise o conteúdo e baixe uma planilha editável.",
    keywords: ["pdf para excel", "converter pdf em excel", "pdf para xlsx", "extrair tabela de pdf", "conversor pdf excel online"],
  },
  {
    slug: "excel-para-pdf",
    name: "Excel para PDF",
    description: "Converta planilhas Excel em arquivos PDF organizados, prontos para compartilhar, imprimir ou arquivar.",
    category: "pdf",
    hubFilter: "Converter",
    badge: "PDF",
    icon: FileSpreadsheet,
    available: true,
    index: true,
    seoTitle: "Excel para PDF: converta XLSX em PDF online | Kivai",
    seoDescription: "Converta planilhas Excel em PDF online. Transforme arquivos XLSX em documentos PDF organizados e prontos para compartilhar ou imprimir.",
    keywords: ["excel para pdf", "converter excel em pdf", "xlsx para pdf", "planilha para pdf", "transformar excel em pdf"],
  },
  {
    slug: "editar-pdf",
    name: "Editar PDF",
    description: "Adicione textos, imagens, formas, desenhos e marcações às páginas do seu PDF.",
    category: "pdf",
    hubFilter: "Editar",
    badge: "PDF",
    icon: FilePenLine,
    available: true,
    index: true,
    seoTitle: "Editar PDF Online: adicione textos e imagens | Kivai",
    seoDescription: "Edite PDF online adicionando textos, imagens, formas, desenhos, destaques e assinaturas visuais de maneira simples com o Kivai.",
    keywords: ["editar pdf", "editor de pdf", "escrever em pdf", "adicionar texto no pdf", "editar pdf online", "desenhar em pdf", "adicionar imagem no pdf"],
  },
  {
    slug: "redimensionar-pdf",
    name: "Redimensionar PDF",
    description: "Redimensione páginas de PDF para A6, A5, A4, A3, A2 ou A1, mantendo o conteúdo proporcional.",
    category: "pdf",
    hubFilter: "Editar",
    badge: "PDF",
    icon: Scaling,
    available: true,
    index: true,
    seoTitle: "Redimensionar PDF para A4, A3, A5 e outros | Kivai",
    seoDescription: "Redimensione páginas de PDF para A6, A5, A4, A3, A2 ou A1. Ajuste orientação, margens e proporção de maneira simples com o Kivai.",
    keywords: ["redimensionar pdf", "mudar tamanho do pdf", "pdf para a4", "pdf para a3", "pdf para a5", "alterar tamanho de página pdf", "converter pdf para a4"],
  },
  {
    slug: "montar-pdf-para-impressao",
    name: "Montar PDF para Impressão",
    description: "Monte um PDF em uma nova folha de impressão, escolhendo o tamanho da página, o tamanho do conteúdo e sua posição.",
    category: "pdf",
    hubFilter: "Editar",
    badge: "PDF",
    icon: LayoutGrid,
    available: true,
    index: true,
    seoTitle: "Montar PDF para Impressão Online | Kivai",
    seoDescription: "Monte um PDF para impressão escolhendo tamanho da folha, tamanho do conteúdo, posição, margens e quantidade por página. Ideal para etiquetas, documentos, cartões e materiais gráficos.",
    keywords: ["montar pdf para impressão", "pdf para imprimir", "várias páginas por folha", "imprimir etiquetas pdf", "organizar pdf para impressão"],
  },
  {
    slug: "word-para-pdf",
    name: "Word para PDF",
    description: "Converta documentos DOCX do Word em arquivos PDF diretamente no navegador.",
    category: "pdf",
    hubFilter: "Converter",
    badge: "PDF",
    icon: FileText,
    featured: true,
    available: true,
    index: true,
    seoTitle: "Word para PDF: Converter DOCX em PDF Online Grátis | Kivai",
    seoDescription: "Converta Word para PDF online e grátis. Transforme arquivos DOCX em PDF preservando textos, imagens, tabelas e formatação, sem instalar programas.",
    keywords: ["word para pdf", "converter word em pdf", "docx para pdf", "transformar word em pdf", "conversor word pdf online"],
  },
  {
    slug: "pdf-para-powerpoint",
    name: "PDF para PowerPoint",
    description: "Converta páginas de um arquivo PDF em slides de uma apresentação PowerPoint.",
    category: "pdf",
    hubFilter: "Converter",
    badge: "PDF",
    icon: FileText,
    featured: true,
    available: true,
    index: true,
    seoTitle: "PDF para PowerPoint: Converter PDF em PPTX Online Grátis | Kivai",
    seoDescription: "Converta PDF para PowerPoint (PPTX) online e grátis. Escolha, organize e transforme páginas do PDF em slides com alta fidelidade visual.",
    keywords: ["pdf para powerpoint", "converter pdf em powerpoint", "pdf para pptx", "transformar pdf em slides", "conversor pdf powerpoint online"],
  },
  {
    slug: "powerpoint-para-pdf",
    name: "PowerPoint para PDF",
    description: "Converta apresentações PowerPoint em arquivos PDF de forma rápida, organizada e com ótima qualidade.",
    category: "pdf",
    hubFilter: "Converter",
    badge: "PDF",
    icon: FileText,
    available: true,
    index: true,
    seoTitle: "PowerPoint para PDF: converta PPTX em PDF online | Kivai",
    seoDescription: "Converta apresentações PowerPoint em PDF online. Transforme arquivos PPTX em PDF de forma rápida, fácil e gratuita com o Kivai.",
    keywords: ["powerpoint para pdf", "pptx para pdf", "converter powerpoint em pdf", "converter pptx em pdf", "powerpoint para pdf online"],
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
