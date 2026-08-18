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
    useTypeScriptCli: true,
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
        source: '/ph/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ph/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
    ]
  },
  skipTrailingSlashRedirect: true,
}

export default nextConfig
