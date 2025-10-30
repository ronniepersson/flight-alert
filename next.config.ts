import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hexdb.io',
        port: '',
        pathname: '/hex-image**',
      },
    ],
  },
};

export default nextConfig;
