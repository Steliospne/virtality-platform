/** Website marketing reads: never client-refetch until a new dehydrated payload. */
export const MARKETING_STALE_TIME = 'static' as const

export function withMarketingStaleTime<T extends object>(
  options: T,
): T & { staleTime: typeof MARKETING_STALE_TIME } {
  return {
    ...options,
    staleTime: MARKETING_STALE_TIME,
  }
}
