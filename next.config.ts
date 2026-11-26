import type { NextConfig } from "next";

const supabaseUrl = process.env.SUPABASE_URL;
const blogBucket = process.env.SUPABASE_BLOG_BUCKET ?? "blog-media";
const supabaseHostname = supabaseUrl
  ? new URL(supabaseUrl).hostname
  : "fphphknegwlgydwulehl.supabase.co";

const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
      ],
    }, {
      // Sempre revalidar o HTML do cadastro apos publicacoes de interface.
      // Nao altera o cache de imagens/JS/CSS nem APIs do projeto.
      source: "/conta/cadastro",
      headers: [
        { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
      ],
    }];
  },
  async redirects() {
    return [
      {
        source: "/ferramentas/instagram-follow-analyzer",
        destination: "/ferramentas/analisador-de-seguidores-instagram",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return {
      // No dominio do streaming, os links publicos de album e faixa nao
      // possuem o prefixo interno /musica usado pela estrutura do App Router.
      // afterFiles preserva rotas publicas ja existentes, como noticias.
      afterFiles: [
        {
          source: "/:artist/:album/:track",
          destination: "/musica/:artist/:album/:track",
          has: [{ type: "host", value: "streaming.kivai.com.br" }],
        },
        {
          source: "/:artist/:album",
          destination: "/musica/:artist/:album",
          has: [{ type: "host", value: "streaming.kivai.com.br" }],
        },
      ],
    };
  },
  images: {
    remotePatterns: [blogBucket, "music-media"].map((bucket) => ({
      protocol: "https" as const,
      hostname: supabaseHostname,
      port: "",
      pathname: `/storage/v1/object/public/${bucket}/**`,
      search: "",
    })),
  },
};

export default nextConfig;
