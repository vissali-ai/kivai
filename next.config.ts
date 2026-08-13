import type { NextConfig } from "next";

const supabaseUrl = process.env.SUPABASE_URL;
const blogBucket = process.env.SUPABASE_BLOG_BUCKET ?? "blog-media";
const supabaseHostname = supabaseUrl
  ? new URL(supabaseUrl).hostname
  : "fphphknegwlgydwulehl.supabase.co";

const nextConfig: NextConfig = {
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
