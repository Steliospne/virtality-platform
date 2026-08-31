import { getConsoleUrl } from '@virtality/shared/types'
import { toAbsoluteConsoleReturnUrl } from '@virtality/shared/utils'

export const DEFAULT_POST_LOGIN_PATH = '/' as const

export type NextSearchParams = Record<string, string | string[] | undefined>

const ABSOLUTE_URL_RE = /^[a-zA-Z][a-zA-Z0-9+\-.]*:/

export function validateSignInRedirectTarget(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null

  const trimmed = raw.trim()
  if (!trimmed.startsWith('/')) return null
  if (trimmed.startsWith('//')) return null
  if (ABSOLUTE_URL_RE.test(trimmed)) return null
  if (trimmed.includes('\\')) return null

  return trimmed
}

export function resolvePostLoginPath(
  redirectParam: string | null | undefined,
): string {
  return validateSignInRedirectTarget(redirectParam) ?? DEFAULT_POST_LOGIN_PATH
}

export function buildSignInHref(pathAndQuery: string): string {
  const target = pathAndQuery.startsWith('/')
    ? pathAndQuery
    : `/${pathAndQuery}`

  return `/sign-in?redirect=${encodeURIComponent(target)}`
}

export function buildPathAndQuery(
  pathname: string,
  searchParams: NextSearchParams,
): string {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      for (const entry of value) {
        params.append(key, entry)
      }
      continue
    }
    params.set(key, value)
  }

  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

export function toSocialSignInCallbackUrl(postLoginPath: string): string {
  const path =
    validateSignInRedirectTarget(postLoginPath) ?? DEFAULT_POST_LOGIN_PATH
  if (path === DEFAULT_POST_LOGIN_PATH) {
    return getConsoleUrl()
  }
  return toAbsoluteConsoleReturnUrl(path)
}
