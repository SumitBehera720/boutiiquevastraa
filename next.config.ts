import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["mysql2", "nodemailer"],
  compress: false,
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5000mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/collection/:path*",
        destination: "/collections/:path*",
        permanent: true,
      },
      {
        source: "/product/:path*",
        destination: "/products/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
