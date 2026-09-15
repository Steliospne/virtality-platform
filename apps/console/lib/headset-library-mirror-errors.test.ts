import { describe, expect, it } from 'vitest'
import { mirrorWriteErrorMessage } from './headset-library-mirror-errors.js'

const base = {
  deviceId: 'hs-1',
  videoId: 'trail',
  status: 404,
  message: 'Headset not found.',
} as const

describe('mirrorWriteErrorMessage', () => {
  it('toasts only a rejected download request', () => {
    expect(
      mirrorWriteErrorMessage({
        ...base,
        procedure: 'applyEvent',
        code: 'NOT_FOUND',
      }),
    ).toBeNull()
    expect(
      mirrorWriteErrorMessage({
        ...base,
        procedure: 'requestDownload',
        code: 'NOT_FOUND',
      }),
    ).toMatch(/not linked to your account/)
    expect(
      mirrorWriteErrorMessage({
        ...base,
        procedure: 'requestDownload',
        code: 'UNAUTHORIZED',
      }),
    ).toMatch(/session has expired/)
    expect(
      mirrorWriteErrorMessage({
        ...base,
        procedure: 'requestDownload',
        code: null,
      }),
    ).toBe('The download request could not be saved.')
  })
})
