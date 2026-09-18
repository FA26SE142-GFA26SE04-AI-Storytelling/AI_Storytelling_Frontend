import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/forgot-password',
        destination: '/?auth=forgot',
        permanent: false,
      },
      {
        source: '/reset-password',
        destination: '/?auth=reset',
        permanent: false,
      },
      {
        source: '/invitations/:path*',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
