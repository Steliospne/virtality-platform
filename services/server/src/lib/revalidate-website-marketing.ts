import { getWebsiteUrl, type MarketingCacheTag } from '@virtality/shared/types'
import { createAppLogger } from '@virtality/shared/observability'

const logger = createAppLogger({
  serviceName: 'server',
  defaultAttributes: {
    component: 'website-marketing-revalidate',
  },
})

export type RevalidateWebsiteMarketingBody =
  | { tag: MarketingCacheTag }
  | { all: true }

export type RevalidateWebsiteMarketingDeps = {
  fetch: typeof fetch
  getWebsiteUrl: () => string
  getSecret: () => string | undefined
  logger: {
    warn: (event: string, attributes?: Record<string, unknown>) => void
    error: (
      event: string,
      attributes?: Record<string, unknown>,
      message?: string,
    ) => void
  }
}

const defaultDeps: RevalidateWebsiteMarketingDeps = {
  fetch,
  getWebsiteUrl,
  getSecret: () => process.env.REVALIDATE_SECRET?.trim() || undefined,
  logger,
}

/**
 * Best-effort bust of website marketing Next Data Cache tags.
 * Never throws — DB mutations must succeed even if revalidate HTTP fails.
 */
export async function revalidateWebsiteMarketingCache(
  body: RevalidateWebsiteMarketingBody,
  deps: RevalidateWebsiteMarketingDeps = defaultDeps,
): Promise<void> {
  const secret = deps.getSecret()
  if (!secret) {
    deps.logger.warn('website.revalidate.skipped', {
      reason: 'missing_secret',
      body,
    })
    return
  }

  const url = `${deps.getWebsiteUrl()}/api/revalidate`

  try {
    const response = await deps.fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const responseBody = await response.text().catch(() => '')
      deps.logger.warn('website.revalidate.http_error', {
        status: response.status,
        body,
        responseBody: responseBody.slice(0, 500),
      })
    }
  } catch (error) {
    deps.logger.error(
      'website.revalidate.network_error',
      { error, body },
      'Failed to call website revalidate endpoint',
    )
  }
}
