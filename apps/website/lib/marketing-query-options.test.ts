import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { describe, expect, it } from 'vitest'
import { createORPCClient } from '@virtality/orpc/client'
import { withMarketingStaleTime } from './marketing-query-options'

describe('marketing query options', () => {
  it('keeps oRPC query keys while applying website-only static staleTime', () => {
    const orpc = createTanstackQueryUtils(
      createORPCClient({ url: 'http://localhost:8080/api/v1/rpc' }),
    )

    const base = orpc.partnerLogo.list.queryOptions()
    const marketing = withMarketingStaleTime(base)

    expect(marketing.queryKey).toEqual(base.queryKey)
    expect(marketing.staleTime).toBe('static')
  })
})
