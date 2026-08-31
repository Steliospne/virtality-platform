/** Query param for Access Code input prefill on console billing surfaces. */
export const ACCESS_CODE_PARAM = 'access_code' as const

/**
 * Read an Access Code from URL search params for input prefill.
 * Returns null when the param is missing or blank (whitespace only).
 */
export function readAccessCodePrefill(
  search: string | URLSearchParams,
): string | null {
  const params =
    typeof search === 'string' ? new URLSearchParams(search) : search
  const trimmed = params.get(ACCESS_CODE_PARAM)?.trim()
  return trimmed || null
}
