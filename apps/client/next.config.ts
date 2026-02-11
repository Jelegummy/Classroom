import { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  cleanDistDir: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'mpics.mgronline.com',
      },
    ],
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    parallelServerCompiles: true,
    webpackBuildWorker: true,
  },
  async rewrites() {
    return [
      {
        source: '/models/:path*', // เรียกผ่าน /models/pumpkin.glb
        destination:
          'https://pub-10de472ef8d2442881c7be671b9b1e32.r2.dev/model/:path*', // Next.js จะไปดึงจาก R2 มาให้
      },
    ]
  },
}

export default config
