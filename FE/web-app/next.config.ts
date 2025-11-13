// Build timestamp: 2025-11-13 - Force Railway rebuild to eliminate chunk 153
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force clean build - Railway cache buster
  generateBuildId: async () => {
    return `build-${Date.now()}-no-chunk-153`;
  },
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
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
  webpack: (config, { isServer }) => {
    // PERMANENT FIX: Prevent socket.io bundling issues
    // Exclude socket.io-client from BOTH server and client bundles
    config.externals = config.externals || [];

    if (
      typeof config.externals === "object" &&
      !Array.isArray(config.externals)
    ) {
      config.externals = [config.externals];
    }

    if (Array.isArray(config.externals)) {
      config.externals.push({
        "socket.io-client": "io",
        "engine.io-client": "io",
      });
    }

    // Fallbacks for Node.js modules on client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        process: false,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        http2: false,
        path: false,
        zlib: false,
        os: false,
        http: false,
        https: false,
        url: false,
        assert: false,
      };
    }

    // Suppress warnings
    config.ignoreWarnings = [
      { module: /node_modules\/socket\.io-client/ },
      { module: /node_modules\/engine\.io-client/ },
      /Critical dependency: the request of a dependency is an expression/,
    ];

    return config;
  },
};

export default nextConfig;
