import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Avoid runtime optimizer errors; serve images as-is.
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/products/custom-box-3",
        destination: "/products/custom-box/3",
        permanent: true,
      },
      {
        // Generic catch-all: /products/custom-box-6 -> /products/custom-box/6, etc.
        source: "/products/custom-box-:size",
        destination: "/products/custom-box/:size",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
