import { describe, expect, it, vi } from 'vitest'
import { identifyPostHogUser } from './posthog-user.ts'

describe('identifyPostHogUser', () => {
  it('identifies the user and reloads feature flags after identify completes', () => {
    const reloadFeatureFlags = vi.fn()
    let onIdentifyComplete: (() => void) | undefined

    const identify = vi.fn(
      (_id: string, _props: Record<string, unknown>, callback?: () => void) => {
        onIdentifyComplete = callback
      },
    )

    identifyPostHogUser(
      { identify, reloadFeatureFlags },
      {
        id: 'user-1',
        email: 'dev@virtality.app',
        name: 'Dev User',
      },
    )

    expect(identify).toHaveBeenCalledWith(
      'user-1',
      { email: 'dev@virtality.app', name: 'Dev User' },
      expect.any(Function),
    )
    expect(reloadFeatureFlags).not.toHaveBeenCalled()

    onIdentifyComplete?.()
    expect(reloadFeatureFlags).toHaveBeenCalledOnce()
  })
})
