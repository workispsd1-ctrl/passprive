import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      new URL('https://slhjiyxfjplbyhmrqgyy.supabase.co/**'),
      new URL('https://mxodvpxdtiukwsmisfgs.supabase.co/**'),
      new URL('https://lh3.googleusercontent.com/**'),
    ],
  },
};

export default nextConfig;
