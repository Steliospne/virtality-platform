import { describe, expect, it, vi } from 'vitest'
import { revalidateWebsiteMarketingCache } from './revalidate-website-marketing.ts'

function createDeps(overrides?: { secret?: string; fetchImpl?: typeof fetch }) {
  const warn = vi.fn()
  const error = vi.fn()
  const fetchImpl =
    overrides?.fetchImpl ??
    (vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    }) as unknown as typeof fetch)

  return {
    deps: {
      fetch: fetchImpl,
      getWebsiteUrl: () => 'http://localhost:3000',
      getSecret: () => overrides?.secret,
      logger: { warn, error },
    },
    warn,
    error,
    fetchImpl,
  }
}

describe('revalidateWebsiteMarketingCache', () => {
  it('skips and logs when secret is missing', async () => {
    const { deps, warn, fetchImpl } = createDeps({ secret: undefined })
    await revalidateWebsiteMarketingCache({ tag: 'mosaic' }, deps)
    expect(warn).toHaveBeenCalledWith('website.revalidate.skipped', {
      reason: 'missing_secret',
      body: { tag: 'mosaic' },
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('POSTs Bearer auth and tag body', async () => {
    const { deps, fetchImpl } = createDeps({ secret: 'secret' })
    await revalidateWebsiteMarketingCache({ tag: 'partner-logos' }, deps)
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:3000/api/revalidate',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer secret',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tag: 'partner-logos' }),
      },
    )
  })

  it('logs HTTP failures without throwing', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    }) as unknown as typeof fetch
    const { deps, warn } = createDeps({ secret: 'secret', fetchImpl })

    await expect(
      revalidateWebsiteMarketingCache({ all: true }, deps),
    ).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalledWith(
      'website.revalidate.http_error',
      expect.objectContaining({ status: 401, body: { all: true } }),
    )
  })

  it('logs network failures without throwing', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('offline'))
    const { deps, error } = createDeps({ secret: 'secret', fetchImpl })

    await expect(
      revalidateWebsiteMarketingCache({ tag: 'promo-video' }, deps),
    ).resolves.toBeUndefined()
    expect(error).toHaveBeenCalledWith(
      'website.revalidate.network_error',
      expect.objectContaining({ body: { tag: 'promo-video' } }),
      'Failed to call website revalidate endpoint',
    )
  })
})
