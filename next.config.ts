// next.config.ts
import type { NextConfig } from "next";

const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
let supabaseHost = "";
try {
  supabaseHost = new URL(supabaseURL).hostname;
} catch {
  console.warn("⚠️ NEXT_PUBLIC_SUPABASE_URL inválida ou ausente.");
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/**" }]
      : [{ protocol: "https", hostname: "mmrzhazdbqrwipxpygbn.supabase.co", pathname: "/storage/v1/object/**" }],
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
