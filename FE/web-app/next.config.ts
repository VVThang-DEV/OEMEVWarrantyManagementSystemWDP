import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Transpile packages that have SSR issues
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  // Skip server bundle for client-only libraries
  experimental: {
    serverComponentsExternalPackages: [
      "three",
      "@react-three/fiber",
      "@react-three/drei",
      "framer-motion",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
