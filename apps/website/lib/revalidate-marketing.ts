import {
  isMarketingCacheTag,
  MARKETING_CACHE_TAGS,
  type MarketingCacheTag,
} from '@virtality/shared/types'

export type RevalidateMarketingBody =
  | { tag: MarketingCacheTag; all?: undefined }
  | { all: true; tag?: undefined }

export type RevalidateMarketingResult =
  | { ok: true; tags: MarketingCacheTag[] }
  | { ok: false; status: 400 | 401; error: string }

export function authorizeRevalidateRequest(
  authorizationHeader: string | null,
  secret: string | undefined,
): boolean {
  const expected = secret?.trim()
  if (!expected) {
    return false
  }

  const match = authorizationHeader?.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    return false
  }

  return match[1] === expected
}

export function parseRevalidateMarketingBody(
  body: unknown,
): { ok: true; value: RevalidateMarketingBody } | { ok: false; error: string } {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Invalid JSON body' }
  }

  const record = body as Record<string, unknown>
  const hasTag = Object.prototype.hasOwnProperty.call(record, 'tag')
  const hasAll = Object.prototype.hasOwnProperty.call(record, 'all')

  if (hasTag === hasAll) {
    return {
      ok: false,
      error: 'Body must include exactly one of "tag" or "all"',
    }
  }

  if (hasAll) {
    if (record.all !== true) {
      return { ok: false, error: '"all" must be true' }
    }
    return { ok: true, value: { all: true } }
  }

  if (typeof record.tag !== 'string' || !isMarketingCacheTag(record.tag)) {
    return { ok: false, error: 'Unknown or invalid tag' }
  }

  return { ok: true, value: { tag: record.tag } }
}

export function resolveRevalidateTags(
  body: RevalidateMarketingBody,
): MarketingCacheTag[] {
  if ('all' in body && body.all) {
    return [...MARKETING_CACHE_TAGS]
  }
  return [body.tag]
}

export function handleRevalidateMarketingRequest(input: {
  authorizationHeader: string | null
  secret: string | undefined
  body: unknown
}): RevalidateMarketingResult {
  if (!authorizeRevalidateRequest(input.authorizationHeader, input.secret)) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }

  const parsed = parseRevalidateMarketingBody(input.body)
  if (!parsed.ok) {
    return { ok: false, status: 400, error: parsed.error }
  }

  return { ok: true, tags: resolveRevalidateTags(parsed.value) }
}
