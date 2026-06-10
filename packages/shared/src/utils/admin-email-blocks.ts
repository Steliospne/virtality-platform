import {
  emailBodyBlockSchema,
  emailBodyBlocksSchema,
  MAX_EMAIL_RECIPIENTS,
  type EmailBodyBlock,
} from '../types/admin-email.ts'
import { validateBucketObjectKey } from './bucket.ts'

const emailAddressSchema = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const hasText = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0

export const validateEmailBodyBlock = (
  block: EmailBodyBlock,
): string | null => {
  const parsed = emailBodyBlockSchema.safeParse(block)
  if (!parsed.success) {
    return 'invalid block shape'
  }

  switch (parsed.data.type) {
    case 'heading':
      return hasText(parsed.data.text) ? null : 'heading text is required'
    case 'paragraph':
      return hasText(parsed.data.text) ? null : 'paragraph text is required'
    case 'image': {
      const objectKeyError = validateBucketObjectKey(parsed.data.objectKey)
      if (objectKeyError) {
        return `image object key is invalid: ${objectKeyError}`
      }
      return hasText(parsed.data.alt) ? null : 'image alt text is required'
    }
    case 'button':
      if (!hasText(parsed.data.label)) {
        return 'button label is required'
      }
      return isHttpUrl(parsed.data.href) ? null : 'button href must be a valid URL'
    case 'list': {
      const items = parsed.data.items.map((item) => item.trim()).filter(Boolean)
      return items.length > 0 ? null : 'at least one list item is required'
    }
    case 'card': {
      const hasHeading = hasText(parsed.data.heading)
      const hasBody = hasText(parsed.data.body)
      const hasImage =
        hasText(parsed.data.imageObjectKey) && hasText(parsed.data.imageAlt)
      const hasButton = hasText(parsed.data.buttonLabel)

      if (!hasHeading && !hasBody && !hasImage && !hasButton) {
        return 'card content is required'
      }

      const imageObjectKey = parsed.data.imageObjectKey
      if (hasText(imageObjectKey)) {
        const objectKeyError = validateBucketObjectKey(imageObjectKey)
        if (objectKeyError) {
          return `card image object key is invalid: ${objectKeyError}`
        }
        if (!hasText(parsed.data.imageAlt)) {
          return 'card image alt text is required'
        }
      }

      if (hasButton) {
        if (!isHttpUrl(parsed.data.buttonHref ?? '')) {
          return 'card button href must be a valid URL'
        }
      }

      return null
    }
    case 'divider':
      return null
  }
}

export const validateEmailBodyBlocks = (
  blocks: EmailBodyBlock[],
): string | null => {
  const parsed = emailBodyBlocksSchema.safeParse(blocks)
  if (!parsed.success) {
    return 'invalid block shape'
  }

  for (const block of parsed.data) {
    const error = validateEmailBodyBlock(block)
    if (error) {
      return error
    }
  }

  return null
}

export const hasMeaningfulEmailBodyContent = (
  blocks: EmailBodyBlock[],
): boolean => {
  const parsed = emailBodyBlocksSchema.safeParse(blocks)
  if (!parsed.success) {
    return false
  }

  return parsed.data.some((block) => {
    switch (block.type) {
      case 'heading':
      case 'paragraph':
        return hasText(block.text)
      case 'image':
        return (
          hasText(block.objectKey) &&
          hasText(block.alt) &&
          validateBucketObjectKey(block.objectKey) === null
        )
      case 'button':
        return hasText(block.label) && isHttpUrl(block.href)
      case 'list':
        return block.items.some((item) => item.trim().length > 0)
      case 'card':
        return (
          hasText(block.heading) ||
          hasText(block.body) ||
          (hasText(block.imageObjectKey) && hasText(block.imageAlt)) ||
          (hasText(block.buttonLabel) && isHttpUrl(block.buttonHref ?? ''))
        )
      case 'divider':
        return false
    }
  })
}

export const validateEmailRecipientList = (
  recipients: string[],
): string | null => {
  const normalized = recipients.map((recipient) => recipient.trim()).filter(Boolean)

  if (normalized.length === 0) {
    return 'recipient list is required'
  }

  if (normalized.length > MAX_EMAIL_RECIPIENTS) {
    return `recipient list cannot exceed ${MAX_EMAIL_RECIPIENTS} recipients`
  }

  const uniqueRecipients = new Set(
    normalized.map((recipient) => recipient.toLowerCase()),
  )
  if (uniqueRecipients.size !== normalized.length) {
    return 'recipient list cannot contain duplicate emails'
  }

  if (normalized.some((recipient) => !emailAddressSchema.test(recipient))) {
    return 'recipient list contains an invalid email'
  }

  return null
}
