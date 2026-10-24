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
  images: {
    remotePatterns: [{
      protocol: "https",
      hostname: supabaseHostname,
      port: "",
      pathname: `/storage/v1/object/public/${blogBucket}/**`,
      search: "",
    }],
  },
};

export default nextConfig;
