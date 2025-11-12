import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    // Fix for crypto and other Node.js modules in client-side
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
      };
    }

    // Completely exclude socket.io from server bundle
    if (isServer) {
      config.externals = [...(config.externals || []), 'socket.io-client', 'engine.io-client'];
    }

    // Ignore node modules warnings
    config.ignoreWarnings = [
      { module: /node_modules\/socket\.io-client/ },
      { module: /node_modules\/engine\.io-client/ },
    ];

    return config;
  },
};

export default nextConfig;
