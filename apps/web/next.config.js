/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Disable linting during builds - we lint in CI instead
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript checking during builds - we check in CI
  typescript: {
    ignoreBuildErrors: true,
  },

  // Transpile packages from monorepo and next-auth for Next.js 16 compatibility
  transpilePackages: ['@fire/db', '@fire/types', 'next-auth'],

  // Image optimization
  images: {
    domains: ['localhost'],
    unoptimized: true, // Disable optimization for development (MinIO doesn't support it)
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9100',
        pathname: '/fire-uploads/**',
      },
    ],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude Prisma from webpack bundling on server
      config.externals = [...(config.externals || []), '@prisma/client', '_http_common']
    } else {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
