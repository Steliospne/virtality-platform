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
}

export default nextConfig
