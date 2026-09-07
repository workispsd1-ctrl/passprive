import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'slhjiyxfjplbyhmrqgyy.supabase.co', pathname: '/**' },
      { protocol: 'https', hostname: 'mxodvpxdtiukwsmisfgs.supabase.co', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
    ],
    // On NAT64/DNS64 dev networks, public IPv4-only hosts (Supabase storage)
    // resolve to `64:ff9b::/96` addresses, which Next 16's image optimizer treats
    // as private and refuses to fetch ("resolved to private ip"). Allow it in dev
    // only — production runs on dual-stack and keeps the SSRF guard.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
  },
};

export default nextConfig;
