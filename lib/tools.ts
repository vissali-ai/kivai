import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Calculator,
  Combine,
  FileImage,
  ImagePlus,
  FileText,
  ImageIcon,
  Video,
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
  Box,
  Crop,
  Stamp,
  FlipHorizontal,
  FileAudio,
  Gauge,
  Volume2,
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
  {
    slug: "video",
    name: "Vídeos",
    description:
      "Converta, edite e otimize vídeos diretamente no navegador com ferramentas rápidas, gratuitas e fáceis de usar.",
    href: "/ferramentas/videos",
    icon: Video,
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
    slug: "remover-audio-video",
    name: "Remover áudio",
    description: "Exporte uma versão silenciosa do vídeo em WebM.",
    category: "video",
    hubFilter: "Edição",
    badge: "Vídeo",
    icon: Video,
    available: true,
    index: true,
    seoTitle: "Remover Áudio de Vídeo Online Grátis | Kivai",
    seoDescription: "Remova o áudio de vídeos diretamente no navegador e baixe a versão silenciosa em WebM.",
    keywords: ["remover áudio de vídeo", "silenciar vídeo", "tirar som do vídeo"],
  },
  {
    slug: "girar-video",
    name: "Girar vídeo",
    description: "Gire vídeos em 90°, 180° ou 270° e exporte em WebM.",
    category: "video",
    hubFilter: "Edição",
    badge: "Vídeo",
    icon: RotateCw,
    available: true,
    index: true,
    seoTitle: "Girar Vídeo Online Grátis | Kivai",
    seoDescription: "Gire vídeos diretamente no navegador e baixe o resultado em WebM.",
    keywords: ["girar vídeo", "rotacionar vídeo", "virar vídeo"],
  },
  {
    slug: "espelhar-video",
    name: "Espelhar vídeo",
    description: "Espelhe vídeos horizontalmente ou verticalmente e exporte em WebM.",
    category: "video",
    hubFilter: "Edição",
    badge: "Vídeo",
    icon: FlipHorizontal,
    available: true,
    index: true,
    seoTitle: "Espelhar Vídeo Online Grátis | Kivai",
    seoDescription: "Inverta vídeos horizontalmente ou verticalmente direto no navegador.",
    keywords: ["espelhar vídeo", "inverter vídeo", "flip vídeo"],
  },
  {
    slug: "recortar-video",
    name: "Recortar vídeo (Crop)",
    description: "Recorte a área visível de vídeos e exporte em WebM.",
    category: "video",
    hubFilter: "Edição",
    badge: "Vídeo",
    icon: Crop,
    available: true,
    index: true,
    seoTitle: "Recortar Vídeo Online Grátis | Kivai",
    seoDescription:
      "Recorte vídeos online diretamente no navegador, ajuste a área da imagem e baixe o resultado em WebM.",
    keywords: ["recortar vídeo", "crop vídeo", "cortar área do vídeo"],
  },
  {
    slug: "capturar-frame-video",
    name: "Gerador de Thumbnail",
    description: "Crie thumbnails a partir de qualquer frame do vídeo.",
    category: "video",
    hubFilter: "Edição",
    badge: "Vídeo",
    icon: ImageIcon,
    available: true,
    index: true,
    seoTitle: "Gerador de Thumbnail para Vídeo Online Grátis | Kivai",
    seoDescription:
      "Capture frames de vídeos diretamente no navegador e baixe a imagem em PNG ou JPG sem enviar arquivos para servidores.",
    keywords: ["capturar frame de vídeo", "extrair imagem do vídeo", "frame para png"],
  },
  {
    slug: "alterar-volume-video",
    name: "Alterar volume do vídeo",
    description: "Aumente, reduza ou remova o áudio e exporte em WebM.",
    category: "video",
    hubFilter: "Edição",
    badge: "Vídeo",
    icon: Volume2,
    available: true,
    index: true,
    seoTitle: "Alterar Volume do Vídeo Online Grátis | Kivai",
    seoDescription: "Ajuste o volume de um vídeo localmente no navegador e baixe a nova versão em WebM.",
    keywords: ["alterar volume vídeo", "aumentar som vídeo", "diminuir áudio vídeo"],
  },
  {
    slug: "ajustar-velocidade-video",
    name: "Ajustar velocidade do vídeo",
    description: "Acelere ou desacelere vídeos e exporte em WebM.",
    category: "video",
    hubFilter: "Edição",
    badge: "Vídeo",
    icon: Gauge,
    available: true,
    index: true,
    seoTitle: "Ajustar Velocidade do Vídeo Online Grátis | Kivai",
    seoDescription: "Ajuste a velocidade de vídeos diretamente no navegador e baixe o resultado em WebM.",
    keywords: ["acelerar vídeo", "desacelerar vídeo", "velocidade vídeo"],
  },
  {
    slug: "video-para-audio",
    name: "Vídeo para áudio",
    description: "Extraia o áudio de um vídeo no formato WebM.",
    category: "video",
    hubFilter: "Converter",
    badge: "Áudio",
    icon: FileAudio,
    available: true,
    index: true,
    seoTitle: "Vídeo para Áudio Online Grátis | Kivai",
    seoDescription: "Extraia a trilha de áudio de vídeos localmente no navegador em WebM.",
    keywords: ["vídeo para áudio", "extrair áudio de vídeo", "converter vídeo áudio"],
  },
  {
    slug: "dividir-video",
    name: "Dividir vídeo",
    description: "Divida um vídeo em duas partes no ponto escolhido.",
    category: "video",
    hubFilter: "Edição",
    badge: "Vídeo",
    icon: Scissors,
    available: true,
    index: true,
    seoTitle: "Dividir Vídeo Online Grátis | Kivai",
    seoDescription: "Divida vídeos em duas partes localmente no navegador e baixe cada trecho em WebM.",
    keywords: ["dividir vídeo", "cortar vídeo em partes", "separar vídeo"],
  },
  {
    slug: "redimensionar-video",
    name: "Redimensionar vídeo",
    description: "Altere a resolução sem distorcer, cortar ou preencher conforme preferir.",
    category: "video",
    hubFilter: "Edição",
    badge: "Vídeo",
    icon: Maximize2,
    available: true,
    index: true,
    seoTitle: "Redimensionar Vídeo Online Grátis | Kivai",
    seoDescription: "Redimensione vídeos localmente com modos de ajustar, preencher ou esticar e exporte em WebM.",
    keywords: ["redimensionar vídeo", "alterar resolução vídeo", "dimensões vídeo"],
  },
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
    badge: "Imagem",
    icon: ImagePlus,
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
    badge: "Imagem",
    icon: ImageIcon,
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
    badge: "Imagem",
    icon: Box,
    available: true,
    index: true,
    seoTitle: "Gerador de Mockups Online Grátis | Kivai",
    seoDescription: "Crie mockups de produtos, dispositivos e redes sociais diretamente no navegador.",
    keywords: ["gerador de mockups", "mockup online", "criar mockup"],
  },
  {
    slug: "recortar-imagem",
    name: "Recortar Imagem",
    description: "Recorte imagens com precisão diretamente no navegador.",
    category: "imagens",
    hubFilter: "Editar",
    badge: "Imagem",
    icon: Crop,
    available: true,
    index: true,
    seoTitle: "Recortar Imagem Online Grátis | Kivai",
    seoDescription: "Recorte imagens PNG, JPG e WebP online, sem enviar arquivos para servidores.",
    keywords: ["recortar imagem", "cortar foto", "crop imagem"],
  },
  {
    slug: "adicionar-marca-dagua",
    name: "Adicionar Marca d'Água",
    description: "Adicione texto como marca d'água às suas imagens.",
    category: "imagens",
    hubFilter: "Editar",
    badge: "Imagem",
    icon: Stamp,
    available: true,
    index: true,
    seoTitle: "Adicionar Marca d'Água Online Grátis | Kivai",
    seoDescription: "Adicione marcas d'água de texto às imagens diretamente no navegador.",
    keywords: ["marca d água", "marca dagua imagem", "proteger foto"],
  },
  {
    slug: "espelhar-e-girar-imagem",
    name: "Espelhar e Girar Imagem",
    description: "Gire e espelhe imagens em poucos cliques.",
    category: "imagens",
    hubFilter: "Editar",
    badge: "Imagem",
    icon: FlipHorizontal,
    available: true,
    index: true,
    seoTitle: "Espelhar e Girar Imagem Online Grátis | Kivai",
    seoDescription: "Gire e espelhe arquivos PNG, JPG e WebP diretamente no navegador.",
    keywords: ["girar imagem", "espelhar imagem", "rotacionar foto"],
  },
  {
    slug: "conversor-svg-png",
    name: "Conversor SVG ↔ PNG",
    description: "Converta SVG para PNG ou encapsule imagens em SVG.",
    category: "imagens",
    hubFilter: "Converter",
    badge: "Imagem",
    icon: FileImage,
    available: true,
    index: true,
    seoTitle: "Conversor SVG para PNG Online Grátis | Kivai",
    seoDescription: "Converta SVG para PNG e imagens para SVG diretamente no navegador.",
    keywords: ["converter svg png", "svg para png", "png para svg"],
  },
  {
    slug: "gerador-de-placeholder",
    name: "Gerador de Placeholder (LQIP)",
    description: "Crie placeholders leves para imagens e páginas mais rápidas.",
    category: "imagens",
    hubFilter: "Otimizar",
    badge: "Imagem",
    icon: WandSparkles,
    available: true,
    index: true,
    seoTitle: "Gerador de Placeholder LQIP Online Grátis | Kivai",
    seoDescription: "Gere placeholders leves e Data URLs para otimizar o carregamento de imagens.",
    keywords: ["lqip", "placeholder imagem", "imagem baixa qualidade"],
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
    seoTitle: "Calculadora de Porcentagem Online Grátis | Kivai",
    seoDescription: "Calcule porcentagem, aumento, redução, desconto, acréscimo e descubra o valor original. Calculadora de porcentagem online, gratuita e fácil de usar.",
    keywords: ["calculadora de porcentagem", "calcular porcentagem", "aumento percentual", "desconto percentual"],
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
