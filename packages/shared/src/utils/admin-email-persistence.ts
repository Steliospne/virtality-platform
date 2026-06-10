import type { EmailBodyBlock } from '../types/admin-email.js'
import {
  renderedEmailSnapshotSchema,
  storedEmailBodyBlocksSchema,
  type RenderedEmailSnapshot,
} from '../types/admin-email-persistence.js'

const parseJson = (value: string, label: string): unknown => {
  try {
    return JSON.parse(value)
  } catch {
    throw new Error(`Invalid ${label} JSON`)
  }
}

export const serializeEmailBodyBlocksJson = (
  bodyBlocks: EmailBodyBlock[],
): string => JSON.stringify(bodyBlocks)

export const parseEmailBodyBlocksJson = (value: string): EmailBodyBlock[] => {
  const parsed = storedEmailBodyBlocksSchema.safeParse(
    parseJson(value, 'email body blocks'),
  )

  if (!parsed.success) {
    throw new Error('Invalid email body blocks JSON')
  }

  return parsed.data
}

export const serializeRenderedEmailSnapshotJson = (
  snapshot: RenderedEmailSnapshot,
): string => JSON.stringify(snapshot)

export const parseRenderedEmailSnapshotJson = (
  value: string,
): RenderedEmailSnapshot => {
  const parsed = renderedEmailSnapshotSchema.safeParse(
    parseJson(value, 'rendered email snapshot'),
  )

  if (!parsed.success) {
    throw new Error('Invalid rendered email snapshot JSON')
  }

  return parsed.data
}
