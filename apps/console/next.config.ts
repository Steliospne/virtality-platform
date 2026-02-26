import type { NextConfig } from 'next'
import createMDX from '@next/mdx'

const remoteHosts = [
  'avatars.githubusercontent.com',
  'platform-lookaside.fbsbx.com',
  'lh3.googleusercontent.com',
  'cdn.virtality.app',
  'i9.ytimg.com',
]

const pageExtensions = ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx']

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
})

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    mdxRs: { mdxType: 'gfm' },
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  allowedDevOrigins: ['*.virtality.app'],
  pageExtensions,
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

export default withMDX(nextConfig)
