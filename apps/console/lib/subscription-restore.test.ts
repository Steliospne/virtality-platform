import { describe, expect, it, vi } from 'vitest'
import { restoreSubscription } from './subscription-restore.js'

describe('restoreSubscription', () => {
  it('returns ok when Better Auth restore succeeds', async () => {
    const restore = vi.fn().mockResolvedValue({ data: {} })
    await expect(restoreSubscription({ restore })).resolves.toEqual({
      ok: true,
    })
    expect(restore).toHaveBeenCalledWith({})
  })

  it('surfaces Better Auth errors', async () => {
    const restore = vi
      .fn()
      .mockResolvedValue({ error: { message: 'No pending change' } })
    await expect(restoreSubscription({ restore })).resolves.toEqual({
      ok: false,
      message: 'No pending change',
    })
  })
})
