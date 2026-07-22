import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import StructuredData from "@/components/seo/structured-data";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kivai.com.br"),

  title: {
    default: "Kivai | Ferramentas inteligentes para resultados reais",
    template: "%s | Kivai",
  },

  description:
    "Converta imagens, gere QR Codes, faça cálculos, compacte arquivos e utilize diversas ferramentas online gratuitamente. Tudo em um único lugar.",

  keywords: [
    "kivai",
    "ferramentas online",
    "removedor de fundo",
    "compressor de imagens",
    "conversor de imagens",
    "redimensionar imagem",
    "gerador de qr code",
    "calculadora roas",
    "calculadora roi",
    "calculadora markup",
    "calculadora margem",
    "contador de palavras",
    "ferramentas para marketing",
    "ferramentas para ecommerce",
    "ferramentas gratuitas",
  ],

  authors: [
    {
      name: "Marcus Vissali",
    },
  ],

  creator: "Marcus Vissali",

  publisher: "Kivai",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://kivai.com.br",
    siteName: "Kivai",
    title: "Kivai | Ferramentas inteligentes para resultados reais",
    description:
      "Ferramentas online gratuitas para imagens, marketing, produtividade, e-commerce e muito mais.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Kivai",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Kivai",
    description:
      "Ferramentas online gratuitas para imagens, marketing e produtividade.",
    images: ["/og-image.jpg"],
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-mono",
        jetbrainsMono.variable
      )}
    >
<body className="min-h-full flex flex-col">
  <StructuredData />
  {children}

  <GoogleAnalytics
    gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!}
  />
</body>
    </html>
  );
}
