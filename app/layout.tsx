import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import Script from "next/script";

import "./globals.css";
import "./mobile-file-inputs.css";

import { Footer } from "@/components/marketing/footer";
import { Navbar } from "@/components/marketing/navbar";
import { CookieConsentProvider } from "@/components/privacy/cookie-consent-provider";
import StructuredData from "@/components/seo/structured-data";
import { adsConfig } from "@/lib/ads/config";
import { cn } from "@/lib/utils";

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
  metadataBase: new URL("https://www.kivai.com.br"),

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

  authors: [{ name: "Marcus Vissali" }],
  creator: "Marcus Vissali",
  publisher: "Kivai",

  alternates: {
    canonical: "/",
  },

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
    url: "https://www.kivai.com.br",
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

  category: "Technology",

  ...(adsConfig.clientId
    ? { other: { "google-adsense-account": adsConfig.clientId } }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shouldLoadAdsense =
    adsConfig.enabled &&
    adsConfig.provider === "adsense" &&
    Boolean(adsConfig.clientId);

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

        <Script id="google-consent-default" strategy="beforeInteractive">{`
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function () {
            window.dataLayer.push(arguments);
          };

          window.gtag("consent", "default", {
            analytics_storage: "denied",
            ad_storage: "denied",
            ad_user_data: "denied",
            ad_personalization: "denied",
            wait_for_update: 500
          });
        `}</Script>

        {shouldLoadAdsense ? (
          <Script
            id="google-adsense"
            async
            strategy="beforeInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsConfig.clientId}`}
            crossOrigin="anonymous"
          />
        ) : null}

        <CookieConsentProvider>
          <Navbar />
          {children}
          <Footer />
        </CookieConsentProvider>
      </body>
    </html>
  );
}
