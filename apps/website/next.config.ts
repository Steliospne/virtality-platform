import type { NextConfig } from 'next'

const remoteHosts = [
  'avatars.githubusercontent.com',
  'platform-lookaside.fbsbx.com',
  'lh3.googleusercontent.com',
  'cdn.virtality.app',
  'i9.ytimg.com',
]

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  images: {
    remotePatterns: remoteHosts.map((host) => ({
      hostname: host,
      protocol: 'https',
    })),
  },
  async rewrites() {
    return [
      {
        source: '/relay-sOZA/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/relay-sOZA/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
    ]
  },
  skipTrailingSlashRedirect: true,
}

export default nextConfig
