import { describe, expect, it } from 'vitest'
import type { EmailBodyBlock } from '../types/admin-email.js'
import type { RenderedEmailSnapshot } from '../types/admin-email-persistence.js'
import {
  parseEmailBodyBlocksJson,
  parseRenderedEmailSnapshotJson,
  serializeEmailBodyBlocksJson,
  serializeRenderedEmailSnapshotJson,
} from './admin-email-persistence.js'

const sampleBlocks: EmailBodyBlock[] = [
  {
    type: 'heading',
    id: 'h1',
    text: 'Quarterly update',
    level: 2,
  },
  {
    type: 'paragraph',
    id: 'p1',
    text: 'Thanks for reading.',
  },
]

const sampleSnapshot: RenderedEmailSnapshot = {
  subject: 'Quarterly update',
  html: '<html><body>Rendered</body></html>',
  previewText: 'A quick summary',
}

describe('admin email persistence helpers', () => {
  it('round-trips email body blocks through JSON storage', () => {
    const json = serializeEmailBodyBlocksJson(sampleBlocks)

    expect(parseEmailBodyBlocksJson(json)).toEqual(sampleBlocks)
  })

  it('rejects invalid email body block JSON', () => {
    expect(() => parseEmailBodyBlocksJson('not-json')).toThrow(/invalid email body blocks json/i)
    expect(() => parseEmailBodyBlocksJson('{"type":"heading"}')).toThrow(
      /invalid email body blocks json/i,
    )
  })

  it('round-trips rendered email snapshots through JSON storage', () => {
    const json = serializeRenderedEmailSnapshotJson(sampleSnapshot)

    expect(parseRenderedEmailSnapshotJson(json)).toEqual(sampleSnapshot)
  })

  it('rejects rendered snapshots missing required fields', () => {
    expect(() =>
      parseRenderedEmailSnapshotJson(
        JSON.stringify({
          subject: 'Hello',
        }),
      ),
    ).toThrow(/invalid rendered email snapshot json/i)
  })
})
