import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/comida-pre-partido", destination: "/comida-pre-partido.html" },
    ];
  },
};

export default nextConfig;
