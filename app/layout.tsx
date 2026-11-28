import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { headers } from "next/headers";

import "./globals.css";
import "./mobile-file-inputs.css";

import { Footer } from "@/components/marketing/footer";
import { WhatsappSupportButton } from "@/components/marketing/whatsapp-support-button";
import { ToolFavoriteControl } from "@/components/tools/tool-favorite-control";
import { InstallKivaiPrompt } from "@/components/pwa/install-kivai-prompt";
import { MobileFileSaveChooser } from "@/components/tools/mobile-file-save-chooser";
import { CardFavoritesProvider } from "@/components/tools/tool-card-link";
import { AuthReturnTracker } from "@/components/account/auth-return-tracker";
import { Navbar } from "@/components/marketing/navbar";
import { SiteChrome } from "@/components/marketing/site-chrome";
import { MusicSiteHeader } from "@/components/music/music-site-header";
import { CookieConsentProvider } from "@/components/privacy/cookie-consent-provider";
import StructuredData from "@/components/seo/structured-data";
import { adsConfig } from "@/lib/ads/config";
import { cn } from "@/lib/utils";

const baseMetadata: Metadata = {
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

  category: "Technology",
  appleWebApp: { capable: true, title: "Kivai", statusBarStyle: "default" },

  ...(adsConfig.clientId
    ? { other: { "google-adsense-account": adsConfig.clientId } }
    : {}),
};

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase();
  const streaming = host === "streaming.kivai.com.br";
  const icon = streaming ? "/logo.png" : "/logo-main.png";
  const apple = streaming ? "/apple-touch-icon.png" : "/logo-main.png";
  return { ...baseMetadata, icons: { icon, shortcut: icon, apple } };
}

export async function generateViewport(): Promise<Viewport> {
  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase();
  return { themeColor: host === "streaming.kivai.com.br" ? "#6B0F8C" : "#6C2BD9" };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase();
  const isStreamingHost = host === "streaming.kivai.com.br";
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
        "font-sans",
        isStreamingHost && "kivai-streaming-host",
      )}
    >
      <body
        className={cn("min-h-full flex flex-col", isStreamingHost && "kivai-streaming-host")}
        style={
          isStreamingHost
            ? undefined
            : ({
                "--primary": "#6C2BD9",
                "--primary-foreground": "#FFFFFF",
                "--ring": "#6C2BD9",
                "--brand-primary": "#6C2BD9",
                "--cta-primary": "#6C2BD9",
                "--cta-primary-hover": "#5521B0",
                "--cta-primary-text": "#FFFFFF",
                "--brand-detail-coral": "#FF5A36",
              } as React.CSSProperties)
        }
      >
        <StructuredData />
        <MobileFileSaveChooser />

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
          <CardFavoritesProvider>
          <SiteChrome
            isStreamingHost={isStreamingHost}
            mainHeader={<><AuthReturnTracker /><Navbar /></>}
            musicHeader={<MusicSiteHeader />}
            mainFooter={<><Footer /><WhatsappSupportButton /><ToolFavoriteControl /><InstallKivaiPrompt /></>}
          >{children}</SiteChrome>
          </CardFavoritesProvider>
        </CookieConsentProvider>
      </body>
    </html>
  );
}
