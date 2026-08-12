import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { unstable_cache } from 'next/cache'
import { createORPCClient } from '@virtality/orpc/client'
import { getQueryClient } from '@virtality/react-query'
import {
  getServerUrl,
  highlightCardsCacheTag,
  ORPC_PREFIX,
  type HighlightCardCollection,
  type MarketingCacheTag,
} from '@virtality/shared/types'
import { withMarketingStaleTime } from './marketing-query-options'

function createServerOrpc() {
  return createTanstackQueryUtils(
    createORPCClient({
      url: `${getServerUrl()}${ORPC_PREFIX}`,
    }),
  )
}

function createMarketingClient() {
  return createORPCClient({
    url: `${getServerUrl()}${ORPC_PREFIX}`,
  })
}

function cachedMarketingRead<T>(
  tag: MarketingCacheTag,
  keyParts: string[],
  read: () => Promise<T>,
): Promise<T> {
  return unstable_cache(read, keyParts, {
    tags: [tag],
    revalidate: false,
  })()
}

export async function getCachedPartnerLogos() {
  return cachedMarketingRead(
    'partner-logos',
    ['marketing', 'partner-logos'],
    () => createMarketingClient().partnerLogo.list(),
  )
}

export async function getCachedMosaic() {
  return cachedMarketingRead('mosaic', ['marketing', 'mosaic'], () =>
    createMarketingClient().mosaic.get(),
  )
}

export async function getCachedPromoVideo() {
  return cachedMarketingRead('promo-video', ['marketing', 'promo-video'], () =>
    createMarketingClient().promoVideo.get(),
  )
}

export async function getCachedHighlightCards(
  collection: HighlightCardCollection,
) {
  const tag = highlightCardsCacheTag(collection)
  return cachedMarketingRead(tag, ['marketing', tag], () =>
    createMarketingClient().highlightCard.list({ collection }),
  )
}

export async function getCachedBlogPosts() {
  return cachedMarketingRead('blog', ['marketing', 'blog', 'list'], () =>
    createMarketingClient().blog.listPublished(),
  )
}

export async function getCachedBlogPostBySlug(slug: string) {
  return cachedMarketingRead('blog', ['marketing', 'blog', 'slug', slug], () =>
    createMarketingClient().blog.getPublishedBySlug({ slug }),
  )
}

export async function prefetchMarketingHomeQueries() {
  const queryClient = getQueryClient()
  const orpc = createServerOrpc()

  await Promise.all([
    queryClient.prefetchQuery(
      withMarketingStaleTime({
        ...orpc.partnerLogo.list.queryOptions(),
        queryFn: getCachedPartnerLogos,
      }),
    ),
    queryClient.prefetchQuery(
      withMarketingStaleTime({
        ...orpc.mosaic.get.queryOptions(),
        queryFn: getCachedMosaic,
      }),
    ),
    queryClient.prefetchQuery(
      withMarketingStaleTime({
        ...orpc.promoVideo.get.queryOptions(),
        queryFn: getCachedPromoVideo,
      }),
    ),
    queryClient.prefetchQuery(
      withMarketingStaleTime({
        ...orpc.highlightCard.list.queryOptions({
          input: { collection: 'benefits' },
        }),
        queryFn: () => getCachedHighlightCards('benefits'),
      }),
    ),
    queryClient.prefetchQuery(
      withMarketingStaleTime({
        ...orpc.highlightCard.list.queryOptions({
          input: { collection: 'features' },
        }),
        queryFn: () => getCachedHighlightCards('features'),
      }),
    ),
  ])

  return queryClient
}
