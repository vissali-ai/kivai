import type { NextConfig } from "next";

const supabaseUrl = process.env.SUPABASE_URL;
const blogBucket = process.env.SUPABASE_BLOG_BUCKET ?? "blog-media";
const supabaseHostname = supabaseUrl
  ? new URL(supabaseUrl).hostname
  : "fphphknegwlgydwulehl.supabase.co";

const nextConfig: NextConfig = {
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
