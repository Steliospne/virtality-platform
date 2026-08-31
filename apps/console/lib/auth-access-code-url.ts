export const ACCESS_CODE_QUERY_PARAM = 'access_code'

type SearchParamsLike =
  | URLSearchParams
  | { get: (name: string) => string | null }

function authRouteWithAccessCode(
  path: '/sign-in' | '/sign-up',
  accessCode?: string | null,
): string {
  const trimmed = accessCode?.trim()
  if (!trimmed) return path
  const params = new URLSearchParams({ [ACCESS_CODE_QUERY_PARAM]: trimmed })
  return `${path}?${params.toString()}`
}

export function readAccessCodeFromSearchParams(
  searchParams: SearchParamsLike,
): string {
  return searchParams.get(ACCESS_CODE_QUERY_PARAM) ?? ''
}

export function signInHref(accessCode?: string | null): string {
  return authRouteWithAccessCode('/sign-in', accessCode)
}

export function signUpHref(accessCode?: string | null): string {
  return authRouteWithAccessCode('/sign-up', accessCode)
}
