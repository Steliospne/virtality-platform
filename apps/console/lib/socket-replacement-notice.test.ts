import { describe, expect, it } from 'vitest'
import {
  CONSOLE_REPLACEMENT_NOTICE_MESSAGE,
  buildReplacementNoticeConnectionMeta,
} from './socket-replacement-notice.js'

describe('buildReplacementNoticeConnectionMeta', () => {
  it('marks the connection failed with a clear replacement message', () => {
    expect(buildReplacementNoticeConnectionMeta()).toEqual({
      state: 'failed',
      attempt: 0,
      error: CONSOLE_REPLACEMENT_NOTICE_MESSAGE,
    })
  })
})
